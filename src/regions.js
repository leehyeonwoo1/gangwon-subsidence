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
// 위험 등급별 상세 정보 (행동 가이드, 권장 사항)
export function getRiskGuide(velocity) {
  if (velocity <= -10) {
    return {
      summary: '연간 10mm 이상 빠른 침하가 진행 중인 고위험 지역입니다.',
      actions: [
        '🚨 거주민: 인근 건물의 균열·기울어짐 발견 시 즉시 119 또는 관할 구청에 신고',
        '🏢 사업자: 건물 안전진단 의뢰 (한국시설안전공단 1577-8855)',
        '👀 일상 점검: 도로 함몰, 맨홀 침하, 벽 균열 정기 확인',
        '🚧 도로/공사: 인근 굴착 공사 진행 시 추가 침하 위험 — 관계 기관 통보',
      ],
      precautions: [
        '대형 건물 신축 신중히 검토',
        '지하수 과도한 사용 자제',
        '기존 노후 건물 정밀 점검 필수',
      ],
      contacts: [
        { name: '국토안전관리원', phone: '1670-9090', desc: '지반침하 신고' },
        { name: '강원도청 재난안전실', phone: '033-249-3500', desc: '지역 재난 신고' },
        { name: '소방서', phone: '119', desc: '응급 상황' },
      ],
    }
  }
  if (velocity <= -5) {
    return {
      summary: '경고 수준의 침하가 진행 중입니다. 지속 관찰이 필요합니다.',
      actions: [
        '👀 거주민: 집/건물 균열, 문짝 뒤틀림 등 변화 관찰',
        '📞 의심 시: 관할 구청 또는 국토안전관리원에 문의',
        '🏗️ 신축 공사: 지반 조사 보고서 확인',
      ],
      precautions: [
        '인접 지역 지반 변화 모니터링',
        '폐광·매립지 인근 활동 주의',
      ],
      contacts: [
        { name: '국토안전관리원', phone: '1670-9090', desc: '지반침하 신고' },
        { name: '강원도청 재난안전실', phone: '033-249-3500', desc: '지역 재난 신고' },
      ],
    }
  }
  if (velocity <= -2) {
    return {
      summary: '경미한 침하가 관측되지만 안정 범위 내에 있습니다.',
      actions: [
        '📊 정기 관찰 권장 (월 1회 정도)',
        '🆘 변화 감지 시 신고 채널 이용',
      ],
      precautions: ['대규모 굴착 공사 시 영향 평가 필요'],
      contacts: [
        { name: '국토안전관리원', phone: '1670-9090', desc: '문의/신고' },
      ],
    }
  }
  return {
    summary: '안정적인 지반 상태를 유지하고 있습니다.',
    actions: [
      '✅ 특별한 조치 불필요',
      '🌱 일반적 시설 관리 권장',
    ],
    precautions: [],
    contacts: [
      { name: '국토안전관리원', phone: '1670-9090', desc: '문의' },
    ],
  }
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
// 안전 지수 계산 (0~10점)
// 시민용 직관적 지표 (높을수록 안전)
export function getSafetyIndex(velocity) {
  // 침하/융기 → 0~10점 변환
  let score
  
  if (velocity <= -15) {
    score = Math.max(0, 2 + (velocity + 15) * 0.4)  // -15~-20: 2~0점
  } else if (velocity <= -10) {
    score = 2 + (velocity + 15) * 0.4  // -10~-15: 4~2점
  } else if (velocity <= -5) {
    score = 4 + (velocity + 10) * 0.4  // -5~-10: 6~4점
  } else if (velocity <= -2) {
    score = 6 + (velocity + 5) * (2/3)  // -2~-5: 8~6점
  } else if (velocity <= 0) {
    score = 8 + (velocity + 2) * 0.5  // 0~-2: 9~8점
  } else {
    score = Math.min(10, 9 + velocity * 0.2)  // 0 이상: 9~10점
  }
  
  // 0~10 범위로 보장
  score = Math.max(0, Math.min(10, score))
  
  return {
    score: parseFloat(score.toFixed(1)),
    level: getSafetyLevel(score),
  }
}

// 안전 지수에 따른 레벨 정보
function getSafetyLevel(score) {
  if (score >= 8) {
    return {
      label: '매우 안전',
      shortLabel: '안전',
      color: '#16a34a',
      emoji: '🟢',
      description: '땅이 거의 움직이지 않아요',
      civicMessage: '안심하고 생활하셔도 됩니다.',
      officialMessage: '정상 범위 - 정기 모니터링 유지',
    }
  }
  if (score >= 6) {
    return {
      label: '양호',
      shortLabel: '양호',
      color: '#65a30d',
      emoji: '🟢',
      description: '땅이 아주 천천히 움직이고 있어요',
      civicMessage: '큰 걱정 없이 생활 가능합니다. 일상 점검만 권장.',
      officialMessage: '안정 범위 - 분기별 점검 권장',
    }
  }
  if (score >= 4) {
    return {
      label: '주의',
      shortLabel: '주의',
      color: '#eab308',
      emoji: '🟡',
      description: '땅이 조금씩 가라앉고 있어요',
      civicMessage: '집/건물에 균열이 생기는지 가끔 살펴보세요.',
      officialMessage: '주의 필요 - 월별 정밀 점검',
    }
  }
  if (score >= 2) {
    return {
      label: '경고',
      shortLabel: '경고',
      color: '#ea580c',
      emoji: '🟠',
      description: '땅이 눈에 띄게 가라앉고 있어요',
      civicMessage: '집/도로의 균열, 기울어짐을 확인하시고 이상 시 신고하세요.',
      officialMessage: '경고 - 즉시 정밀 조사 권장, 지속 모니터링 필수',
    }
  }
  return {
    label: '위험',
    shortLabel: '위험',
    color: '#dc2626',
    emoji: '🔴',
    description: '땅이 빠르게 가라앉고 있어요',
    civicMessage: '⚠️ 인근 건물/도로에 균열, 함몰 발견 시 즉시 119 또는 1670-9090에 신고하세요.',
    officialMessage: '🚨 고위험 - 긴급 정밀 진단 필요, 거주민 안전 조치 검토',
  }
}

// 시민용 친근한 설명 생성
export function getCivicExplanation(velocity) {
  const safety = getSafetyIndex(velocity)
  const speed = Math.abs(velocity)
  
  // 침하 속도를 일상적인 단위로 (1년에 얼마나 가라앉나)
  let speedDescription
  if (speed <= 1) {
    speedDescription = '거의 움직이지 않아요'
  } else if (speed <= 3) {
    speedDescription = `1년에 ${speed.toFixed(1)}mm (손톱 두께보다 얇게)`
  } else if (speed <= 10) {
    speedDescription = `1년에 ${speed.toFixed(1)}mm (동전 두께 정도)`
  } else {
    speedDescription = `1년에 ${speed.toFixed(1)}mm (눈에 띄는 속도)`
  }
  
  return {
    safetyIndex: safety.score,
    level: safety.level,
    speedDescription,
    direction: velocity < 0 ? '가라앉음' : (velocity > 0 ? '솟아오름' : '안정'),
  }
}