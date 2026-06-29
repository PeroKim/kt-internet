// KT 오피스넷 · 센트릭스 상품/사은품 데이터
// 사은품 금액은 약정 3년·신규가입 기준 예시값입니다. (실제 금액은 상담 시 확정)

const internet = [
  {
    id: "officenet-slim",
    name: "오피스넷 슬림",
    speed: "100Mbps",
    monthlyFee: 28000,
    baseGift: 90000,
    badge: "소호·소형 매장",
    desc: "인터넷 검색·이메일·카드결제(POS)·소형 CCTV 정도면 충분한 1~5인 소규모 사무실·매장용 기본형입니다.",
  },
  {
    id: "officenet-basic",
    name: "오피스넷 베이직",
    speed: "500Mbps",
    monthlyFee: 40000,
    baseGift: 140000,
    badge: "인기",
    desc: "여러 대의 PC와 CCTV·POS를 함께 쓰고 화상회의·클라우드 업무가 잦은 일반 사무실에 가장 많이 선택하는 속도입니다.",
  },
  {
    id: "officenet-essence",
    name: "오피스넷 에센스",
    speed: "1Gbps",
    monthlyFee: 45000,
    baseGift: 140000,
    badge: "추천",
    desc: "대용량 파일 전송·클라우드 백업·다회선 환경을 위한 1Gbps. 베이직과 요금 차이가 크지 않아 넉넉한 속도를 원할 때 추천합니다.",
  },
];

// 센트릭스(인터넷전화) — 회선 단위
const centrix = {
  id: "centrix",
  name: "KT 인터넷전화(센트릭스)",
  monthlyPerLine: 5800, // 회선당 월 기본료
  installPerLine: 0, // 신규 결합 시 설치비 면제
  giftPerLine: 30000, // 회선당 현금 사은품
  desc: "대표번호·내선·통화 녹취·ARS를 인터넷으로 묶는 기업용 전화 서비스.",
  features: [
    "대표번호 1개 + 내선 무제한 구성",
    "통화 녹취·착신 전환·ARS 자동응답",
    "사무실 이전 시 번호 그대로 이동",
    "스마트폰 앱으로 회사번호 발·수신",
  ],
  // 센트릭스와 함께 신청 가능한 부가 옵션 (월 요금만, 캐시백 없음)
  addons: [
    { id: "local-number", name: "지역번호 추가 (02 등)", monthly: 7700 },
    { id: "rep-number", name: "대표번호 추가 (1588 등)", monthly: 7000 },
  ],
};

// 약정 기간별 사은품 배율
const termMultiplier = {
  1: 0.4,
  2: 0.7,
  3: 1.0,
};

// 인터넷 + 센트릭스 결합 시 추가 현금 사은품
const bundleBonus = 100000;

module.exports = {
  internet,
  centrix,
  termMultiplier,
  bundleBonus,
};
