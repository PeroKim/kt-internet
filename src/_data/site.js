// 전역 사이트 메타데이터 (SEO·OG·JSON-LD 공통)
// ※ 배포 도메인이 확정되면 url 값을 실제 도메인으로 교체하세요.
module.exports = {
  name: "KT 오피스넷·인터넷전화 현금 사은품",
  shortName: "오피스넷·인터넷전화 안내센터",
  url: "https://kt-internet.co.kr",
  locale: "ko_KR",
  lang: "ko",
  description:
    "KT 오피스넷 비즈니스 인터넷과 인터넷전화(센트릭스)의 신규·이전 설치 현금 사은품을 직접 눌러서 바로 확인하세요. 회선·결합·번호 옵션까지 실시간 계산하고 그 자리에서 상담신청.",
  keywords:
    "KT 오피스넷, 오피스넷 현금 사은품, KT 인터넷전화, 기업 인터넷전화, 센트릭스, KT 센트릭스, 사무실 인터넷, 비즈니스 인터넷, 인터넷전화 요금, 오피스넷 캐시백, 오피스넷 요금, 인터넷전화 설치, 인터넷 설치 사은품",
  ogImage: "/assets/og-default.svg",
  ogImageAlt: "KT 오피스넷·인터넷전화 현금 사은품 안내",
  themeColor: "#e6002d",
  logo: "/assets/favicon.svg",

  // 사업자 정보 (운영사)
  company: {
    name: "주식회사 엘다인", // 상호
    ceo: "오문숙", // 대표자
    bizNo: "282-81-03312", // 사업자등록번호
    address: "경기도 고양시 덕양구 지정로 15, 307호", // 소재지
  },

  author: {
    name: "오피스넷·인터넷전화 안내센터",
  },

  // 폼 제출 연동 — 상담신청 폼이 POST할 엔드포인트 (intake Lambda / API Gateway)
  // 비워 두면 폼은 데모(검증 후 완료 메시지)로 동작합니다.
  // 엔드포인트를 넣으면 intake Lambda → SQS → consumer Lambda → Slack 채널로 신청이 전송됩니다.
  forms: {
    applyEndpoint: "https://tdrx2g3l6b.execute-api.ap-northeast-2.amazonaws.com/",
  },

  blog: {
    title: "오피스넷·인터넷전화 가이드",
    description:
      "KT 오피스넷 비즈니스 인터넷과 인터넷전화(센트릭스) 도입·요금·현금 사은품(캐시백) 노하우. 사무실 인터넷을 고르는 실무 가이드를 안내센터가 직접 정리했습니다.",
  },

  // 검색엔진 소유 확인 (값 발급 후 채우기)
  verification: {
    google: "n5m0hJypvTNA3etpgn9E1i2CpQxQ3duDU2Fr_wBXXl4",
    naver: "",
  },
};
