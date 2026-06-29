// 상담신청 수신 Lambda (intake)
// 트리거: Lambda Function URL (POST)
// 동작: 입력 검증 → SQS(내구성 큐)에 Slack 알림 작업 적재 → 즉시 200 응답
//
// "유실 방지": 검증을 통과한 신청은 곧바로 SQS에 적재된다. 이후 Slack 발송이
// 실패해도 SQS가 재시도하고, 끝내 실패하면 DLQ에 보존된다.
//
// 환경변수
//   QUEUE_URL     알림 작업을 적재할 SQS 큐 URL
//   ALLOW_ORIGIN  CORS 허용 출처   예) https://kt-officenet.kr

import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});
const QUEUE_URL = process.env.QUEUE_URL;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// 제어문자(탭/줄바꿈 제외) 제거 후 안전 길이로 자른다.
const stripControl = (s) =>
  Array.from(s)
    .filter((c) => {
      const n = c.charCodeAt(0);
      return n === 9 || n === 10 || n === 13 || (n > 31 && n !== 127);
    })
    .join("");

const clean = (v, max = 500) => stripControl(String(v ?? "")).trim().slice(0, max);

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^[0-9\-\s]{9,20}$/.test(v);

export const handler = async (event) => {
  const method =
    event?.requestContext?.http?.method || event?.httpMethod || "POST";

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  let raw = event.body || "{}";
  if (event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");

  let d;
  try {
    d = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  // 허니팟: 봇이 채우는 숨김 필드. 값이 있으면 성공처럼 응답하고 조용히 무시.
  if (clean(d.company_url, 100)) return json(200, { ok: true });

  const submission = {
    name: clean(d.name, 100), // 이름 / 업체명
    phone: clean(d.phone, 20), // 연락처
    email: clean(d.email, 100),
    region: clean(d.region, 200), // 설치 주소
    config: clean(d.calc_config, 500), // 신청 내역(상품·사은품)
    memo: clean(d.memo, 2000), // 남길 말
    agree: d.agree === true || d.agree === "on" || d.agree === "true",
  };

  const errors = [];
  if (!submission.name) errors.push("name");
  if (!isPhone(submission.phone)) errors.push("phone");
  if (!isEmail(submission.email)) errors.push("email");
  if (!submission.region) errors.push("region");
  if (!submission.agree) errors.push("agree");
  if (errors.length) {
    return json(400, { ok: false, error: "validation", fields: errors });
  }

  const submittedAt = new Date().toISOString();
  const payload = { submission, submittedAt };
  const entries = [
    { Id: "slack", MessageBody: JSON.stringify({ channel: "slack", ...payload }) },
  ];

  try {
    const res = await sqs.send(
      new SendMessageBatchCommand({ QueueUrl: QUEUE_URL, Entries: entries })
    );
    if (res.Failed && res.Failed.length) {
      console.error("SQS enqueue partial failure:", JSON.stringify(res.Failed));
      return json(502, { ok: false, error: "enqueue_failed" });
    }
  } catch (err) {
    console.error("SQS enqueue failed:", err);
    return json(502, { ok: false, error: "enqueue_failed" });
  }

  return json(200, { ok: true });
};
