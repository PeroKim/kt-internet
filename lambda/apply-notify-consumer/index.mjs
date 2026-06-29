// 상담신청 알림 소비 Lambda (consumer)
// 트리거: SQS (apply-notifications)
// 동작: 메시지의 channel 에 따라 Slack 발송.
//       실패한 메시지만 batchItemFailures 로 보고 → SQS가 해당 메시지만 재시도.
//       maxReceiveCount 초과 시 DLQ로 이동(유실 방지).
//
// ※ 이벤트 소스 매핑에서 "Report batch item failures"를 켜야 한다.
//
// 환경변수
//   SLACK_WEBHOOK_URL  Slack Incoming Webhook URL
//     → 이 Webhook이 가리키는 채널이 알림 채널입니다.
//       kt-bizmeka와 동일한 메커니즘이며, 이 URL만 kt-internet 전용 채널로 바꾸면 됩니다.

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// tel: 링크용 숫자/+ 만 남긴다 (010-1234-5678 -> 01012345678)
const telHref = (p) => "tel:" + String(p || "").replace(/[^0-9+]/g, "");

async function sendSlack({ submission: s, submittedAt }) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn("SLACK_WEBHOOK_URL not set; skipping slack message.");
    return;
  }
  const body = {
    text: `:bell: *상담신청 접수* — ${s.name} / ${s.phone}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: "🔔 상담신청 접수" } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*이름/업체명*\n${s.name}` },
          { type: "mrkdwn", text: `*연락처*\n<${telHref(s.phone)}|${s.phone}>` },
          { type: "mrkdwn", text: `*이메일*\n<mailto:${s.email}|${s.email}>` },
          { type: "mrkdwn", text: `*설치 주소*\n${s.region}` },
          { type: "mrkdwn", text: `*접수시각*\n${submittedAt}` },
        ],
      },
      { type: "section", text: { type: "mrkdwn", text: `*신청 내역*\n${s.config || "-"}` } },
      { type: "section", text: { type: "mrkdwn", text: `*남길 말*\n${s.memo || "-"}` } },
    ],
  };
  const res = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`slack webhook HTTP ${res.status} ${t}`);
  }
}

export const handler = async (event) => {
  const batchItemFailures = [];

  for (const record of event.Records || []) {
    try {
      const msg = JSON.parse(record.body);
      if (msg.channel === "slack") {
        await sendSlack(msg);
      } else {
        console.error("unknown channel:", msg.channel);
      }
    } catch (err) {
      console.error(`send failed (msg ${record.messageId}):`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
