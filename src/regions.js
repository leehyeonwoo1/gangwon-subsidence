// 강원도 18개 시·군 + 가짜 침하 데이터
// velocity 단위: mm/year (음수 = 침하)
// 진짜 API 연결되면 이 데이터는 백엔드에서 받아올 예정

export const gangwonRegions = [
  // 시 (7개)
  { id: 'chuncheon',  name: '춘천시', lat: 37.8813, lng: 127.7298, velocity: -3.2, lastUpdated: '2025-04-15' },
  { id: 'wonju',      name: '원주시', lat: 37.3422, lng: 127.9202, velocity: -6.8, lastUpdated: '2025-04-15' },
  { id: 'gangneung',  name: '강릉시', lat: 37.7519, lng: 128.8761, velocity: -1.5, lastUpdated: '2025-04-15' },
  { id: 'donghae',    name: '동해시', lat: 37.5247, lng: 129.1143, velocity: -4.7, lastUpdated: '2025-04-15' },
  { id: 'taebaek',    name: '태백시', lat: 37.1641, lng: 128.9856, velocity: -12.3, lastUpdated: '2025-04-15' },
  { id: 'sokcho',     name: '속초시', lat: 38.2070, lng: 128.5918, velocity: -2.1, lastUpdated: '2025-04-15' },
  { id: 'samcheok',   name: '삼척시', lat: 37.4500, lng: 129.1654, velocity: -7.9, lastUpdated: '2025-04-15' },

  // 군 (11개)
  { id: 'hongcheon',  name: '홍천군', lat: 37.6970, lng: 127.8889, velocity: -1.8, lastUpdated: '2025-04-15' },
  { id: 'hoengseong', name: '횡성군', lat: 37.4914, lng: 127.9851, velocity: -2.5, lastUpdated: '2025-04-15' },
  { id: 'yeongwol',   name: '영월군', lat: 37.1836, lng: 128.4615, velocity: -8.4, lastUpdated: '2025-04-15' },
  { id: 'pyeongchang',name: '평창군', lat: 37.3706, lng: 128.3902, velocity: -3.6, lastUpdated: '2025-04-15' },
  { id: 'jeongseon',  name: '정선군', lat: 37.3805, lng: 128.6608, velocity: -11.2, lastUpdated: '2025-04-15' },
  { id: 'cheorwon',   name: '철원군', lat: 38.1466, lng: 127.3134, velocity: -0.9, lastUpdated: '2025-04-15' },
  { id: 'hwacheon',   name: '화천군', lat: 38.1062, lng: 127.7081, velocity: -1.2, lastUpdated: '2025-04-15' },
  { id: 'yanggu',     name: '양구군', lat: 38.1099, lng: 127.9900, velocity: -2.8, lastUpdated: '2025-04-15' },
  { id: 'inje',       name: '인제군', lat: 38.0697, lng: 128.1707, velocity: -1.7, lastUpdated: '2025-04-15' },
  { id: 'goseong',    name: '고성군', lat: 38.3806, lng: 128.4677, velocity: -2.3, lastUpdated: '2025-04-15' },
  { id: 'yangyang',   name: '양양군', lat: 38.0754, lng: 128.6189, velocity: -1.9, lastUpdated: '2025-04-15' },
]

// 침하 속도에 따라 위험 등급 계산하는 함수
// 진짜 API 연결돼도 이 함수는 그대로 쓸 거야
export function getRiskLevel(velocity) {
  if (velocity <= -10) return { grade: '위험', color: '#dc2626', emoji: '🔴' }
  if (velocity <= -5)  return { grade: '경고', color: '#ea580c', emoji: '🟠' }
  if (velocity <= -2)  return { grade: '주의', color: '#eab308', emoji: '🟡' }
  return { grade: '안전', color: '#16a34a', emoji: '🟢' }
}
// 시계열 가짜 데이터 생성 함수
// 진짜 API 연결되면 백엔드에서 받아올 예정 (GET /timeseries)
export function generateTimeSeries(velocity) {
  // 최근 12개월치 가짜 데이터 만들기
  const months = [
    '2024-05', '2024-06', '2024-07', '2024-08',
    '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04',
  ]

  // velocity가 -12.3이면 12개월간 누적 -12.3mm 침하
  // 매달 조금씩 일정하지 않게 (현실적인 노이즈 추가)
  const monthlyRate = velocity / 12
  let cumulative = 0
  const data = []

  for (let i = 0; i < months.length; i++) {
    // 노이즈: -0.5 ~ +0.5 범위로 살짝 흔들기
    const noise = (Math.random() - 0.5) * 1.0
    cumulative += monthlyRate + noise
    data.push(parseFloat(cumulative.toFixed(2)))
  }

  return { months, data }
}