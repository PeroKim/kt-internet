# 배포 가이드 (kt-bizmeka와 동일한 AWS 구성)

```
[정적 사이트]  S3 + CloudFront        ← npm run deploy
[상담신청 폼]  intake Lambda → SQS → consumer Lambda → Slack 채널
```

- 정적 사이트는 **S3에 업로드 + CloudFront로 배포**합니다.
- 상담신청 폼은 **Lambda + SQS**로 받아 **Slack 채널**에 알림을 보냅니다. (kt-bizmeka와 동일, 채널만 다름)
- **비밀값(Slack Webhook URL)은 git에 절대 넣지 않습니다.** 오직 consumer Lambda 환경변수에만 둡니다.

---

## 1. 정적 사이트 — S3 + CloudFront

`package.json`의 `deploy` 스크립트가 kt-bizmeka와 같은 형태입니다:

```bash
npm run deploy
# = eleventy 빌드 → aws s3 sync _site s3://kt-internet --delete
#   → cloudfront 무효화(/*)
```

준비물(최초 1회):

1. **S3 버킷** 생성 (예: `kt-internet`) — 정적 웹 호스팅 용도
2. **CloudFront 배포** 생성 — 오리진을 위 S3로 지정, 기본 루트 객체 `index.html`
3. `package.json`의 `REPLACE_DISTRIBUTION_ID`를 실제 CloudFront 배포 ID로 교체
4. AWS CLI 로그인(`aws configure`)이 되어 있어야 `npm run deploy` 동작
5. (선택) 도메인 연결 시 ACM 인증서 + Route53. 도메인이 정해지면 `src/_data/site.js`의 `url`도 교체

---

## 2. 상담신청 폼 — Lambda + SQS + Slack

코드는 `lambda/` 에 있습니다. 자세한 단계는 [`lambda/README.md`](lambda/README.md) 참고.

요약:

1. **SQS 큐** `apply-notifications`(+DLQ) 생성
2. **consumer Lambda** `apply-notify-consumer` 생성
   - 코드: `lambda/apply-notify-consumer/index.mjs`
   - 트리거: SQS(위 큐), *Report batch item failures* 체크
   - 환경변수: **`SLACK_WEBHOOK_URL`** ← 여기에 Slack Webhook URL을 넣습니다 (아래 3번)
3. **intake Lambda** `apply-intake` 생성
   - 코드: `lambda/apply-intake/index.mjs`
   - 환경변수: `QUEUE_URL`, `ALLOW_ORIGIN`(예: `https://kt-officenet.kr`)
   - **Function URL** 활성화(Auth: NONE)
4. intake의 **Function URL**을 `src/_data/site.js`의 `forms.applyEndpoint`에 입력 → 재빌드/배포

---

## 3. Slack Webhook (← kt-bizmeka와 채널만 다른 부분)

1. kt-internet 알림용 Slack 채널에 **Incoming Webhook** 발급 (Webhook URL이 곧 그 채널)
2. 발급된 URL을 **consumer Lambda 환경변수 `SLACK_WEBHOOK_URL`**에 설정
   - AWS 콘솔 → Lambda `apply-notify-consumer` → 구성 → 환경 변수 → `SLACK_WEBHOOK_URL` 추가
3. 채널을 바꾸려면 그 채널로 Webhook을 새로 발급해 이 환경변수만 교체

> ⚠️ Webhook URL은 비밀번호와 같습니다. 코드/`site.js`/git에 넣지 말고 Lambda 환경변수에만 두세요.
> 채팅 등으로 노출됐다면 Slack 앱에서 **Revoke 후 재발급**하는 것을 권장합니다.

---

## 동작 확인

- `forms.applyEndpoint`가 비어 있으면 폼은 **데모 모드**(검증 후 완료 화면)로 동작합니다.
- 엔드포인트를 넣고 배포하면, `/apply/` 제출 시 Slack 채널에 신청 내역이 도착합니다.
