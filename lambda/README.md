# 상담신청 → Slack 알림 (서버리스)

kt-bizmeka와 **동일한 메커니즘**입니다. 다른 점은 **Slack Webhook URL(= 알림 채널)** 뿐입니다.

```
브라우저(/apply/ 폼)
   │  POST JSON
   ▼
[apply-intake]  Lambda Function URL — 입력 검증 + 허니팟
   │  SendMessageBatch
   ▼
 SQS (apply-notifications)  ── 실패 시 재시도 → 초과 시 ─▶ DLQ
   │  트리거
   ▼
[apply-notify-consumer]  Lambda — Slack Incoming Webhook 발송
   │
   ▼
 Slack 채널 (kt-internet 전용)
```

검증을 통과하면 즉시 SQS(내구성 큐)에 적재되므로, 이후 Slack 발송이 실패해도 유실되지 않습니다.

## 구성 요소

| 항목 | 내용 |
| --- | --- |
| `apply-intake/index.mjs` | Function URL(POST). 검증·허니팟 후 SQS 적재. 런타임 Node.js 20.x |
| `apply-notify-consumer/index.mjs` | SQS 트리거. Slack Webhook 발송. 런타임 Node.js 20.x |
| SQS `apply-notifications` | 표준 큐. DLQ 연결(maxReceiveCount 5 권장) |

> 두 함수 모두 외부 의존성이 없습니다. `@aws-sdk/client-sqs`와 `fetch`는 Node.js 20 Lambda 런타임에 기본 포함됩니다. (node_modules 불필요)

## 배포 절차 (요약)

1. **SQS 큐 생성** — `apply-notifications` (표준). DLQ `apply-notifications-dlq` 연결, maxReceiveCount=5.
2. **consumer Lambda 생성** — `apply-notify-consumer`
   - 코드: `apply-notify-consumer/index.mjs`
   - 환경변수: `SLACK_WEBHOOK_URL`
   - 트리거: SQS `apply-notifications`, **Report batch item failures 체크**
   - 실행 역할에 `sqs:ReceiveMessage/DeleteMessage/GetQueueAttributes` 권한
3. **intake Lambda 생성** — `apply-intake`
   - 코드: `apply-intake/index.mjs`
   - 환경변수: `QUEUE_URL`(위 큐), `ALLOW_ORIGIN`(예: `https://kt-officenet.kr`)
   - **Function URL 활성화**(Auth: NONE), 실행 역할에 `sqs:SendMessage` 권한
4. **프론트 연결** — `src/_data/site.js`의 `forms.applyEndpoint`에 intake **Function URL**을 넣고 재빌드/배포.

## Slack 채널 설정 (← 여기만 kt-bizmeka와 다름)

1. kt-internet 알림을 받을 Slack 채널에서 **Incoming Webhook** 추가
   (Slack 앱 → Incoming Webhooks → Add to Workspace → 채널 선택).
2. 발급된 Webhook URL을 consumer Lambda의 `SLACK_WEBHOOK_URL`에 설정.
3. Webhook은 생성 시 고른 채널로만 전송하므로, **이 URL을 바꾸면 채널이 바뀝니다.**

## 로컬/미설정 동작

`site.forms.applyEndpoint`가 비어 있으면 폼은 **데모 모드**(검증 후 완료 화면만 표시)로 동작합니다. 엔드포인트를 넣는 순간부터 실제 Slack 전송이 시작됩니다.

## 전송 데이터(JSON)

```json
{
  "name": "이름/업체명",
  "phone": "010-1234-5678",
  "email": "example@company.com",
  "region": "설치 주소",
  "calc_config": "오피스넷 베이직 / 인터넷전화 2회선 / 3년 약정 / 예상 사은품 300,000원",
  "memo": "남길 말",
  "agree": true,
  "company_url": ""
}
```

`company_url`은 허니팟(봇 차단용 숨김 필드)이며 값이 있으면 서버가 조용히 무시합니다.
