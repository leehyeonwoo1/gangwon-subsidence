import realRegionsData from './realRegionsData.json'
import realTimeSeriesData from './realTimeSeriesData.json'

export const gangwonRegions = realRegionsData

export function getRiskLevel(velocity) {
  const abs = Math.abs(velocity)
  if (abs >= 60) return { grade: '위험', color: '#dc2626', emoji: '🔴' }
  if (abs >= 35) return { grade: '경고', color: '#ea580c', emoji: '🟠' }
  if (abs >= 15) return { grade: '주의', color: '#eab308', emoji: '🟡' }
  return { grade: '안전', color: '#16a34a', emoji: '🟢' }
}

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

export function generateTimeSeries(key, velocity = 0) {
  const real = realTimeSeriesData[key]
  if (real) return real

  const months = [
    '2025-05', '2025-06', '2025-07', '2025-08',
    '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04',
  ]
  const monthlyRate = velocity / 12
  let cumulative = 0
  const data = []
  for (let i = 0; i < months.length; i++) {
    const noise = (Math.random() - 0.5) * 1.0
    cumulative += monthlyRate + noise
    data.push(parseFloat(cumulative.toFixed(2)))
  }
  return { months, data }
}

export function getSafetyIndex(gsi) {
  const score = Math.max(0, Math.min(10, gsi))
  return {
    score: parseFloat(score.toFixed(1)),
    level: getSafetyLevel(score),
  }
}

export function getSafetyLevel(score) {
  if (score >= 8) {
    return {
      label: '매우 안전', shortLabel: '안전', color: '#16a34a', emoji: '🟢',
      description: '땅이 거의 움직이지 않아요',
      civicMessage: '안심하고 생활하셔도 됩니다.',
      officialMessage: '정상 범위 - 정기 모니터링 유지',
    }
  }
  if (score >= 6) {
    return {
      label: '양호', shortLabel: '양호', color: '#65a30d', emoji: '🟢',
      description: '땅이 아주 천천히 움직이고 있어요',
      civicMessage: '큰 걱정 없이 생활 가능합니다. 일상 점검만 권장.',
      officialMessage: '안정 범위 - 분기별 점검 권장',
    }
  }
  if (score >= 4) {
    return {
      label: '주의', shortLabel: '주의', color: '#eab308', emoji: '🟡',
      description: '땅이 조금씩 가라앉고 있어요',
      civicMessage: '집/건물에 균열이 생기는지 가끔 살펴보세요.',
      officialMessage: '주의 필요 - 월별 정밀 점검',
    }
  }
  if (score >= 2) {
    return {
      label: '경고', shortLabel: '경고', color: '#ea580c', emoji: '🟠',
      description: '땅이 눈에 띄게 가라앉고 있어요',
      civicMessage: '집/도로의 균열, 기울어짐을 확인하시고 이상 시 신고하세요.',
      officialMessage: '경고 - 즉시 정밀 조사 권장, 지속 모니터링 필수',
    }
  }
  return {
    label: '위험', shortLabel: '위험', color: '#dc2626', emoji: '🔴',
    description: '땅이 빠르게 가라앉고 있어요',
    civicMessage: '⚠️ 인근 건물/도로에 균열, 함몰 발견 시 즉시 119 또는 1670-9090에 신고하세요.',
    officialMessage: '🚨 고위험 - 긴급 정밀 진단 필요, 거주민 안전 조치 검토',
  }
}

export function getCivicExplanation(velocity) {
  const safety = getSafetyIndex(velocity)
  const speed = Math.abs(velocity)
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

export function withParticle(word, particle) {
  if (!word || word.length === 0) return word + (particle.charAt(0) || '')
  const lastChar = word.charCodeAt(word.length - 1)
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
    return word + particle.charAt(0)
  }
  const hasJongseong = (lastChar - 0xAC00) % 28 !== 0
  if (particle === '은는' || particle === '은/는') return word + (hasJongseong ? '은' : '는')
  if (particle === '이가' || particle === '이/가') return word + (hasJongseong ? '이' : '가')
  if (particle === '을를' || particle === '을/를') return word + (hasJongseong ? '을' : '를')
  if (particle === '와과' || particle === '와/과') return word + (hasJongseong ? '과' : '와')
  return word + particle
}

const gsiCache = new Map()

function normalize(value, min, max) {
  const v = (value - min) / (max - min)
  return Math.max(0, Math.min(1, v))
}

export function getGSIBreakdown(region) {
  const key = region.id || region.name
  if (gsiCache.has(key)) return gsiCache.get(key)

  const velocity = region.velocity
  const infra    = region.infra ?? 0

  const nVelocity = normalize(Math.abs(velocity), 0, 119.8)
  const riskScore = nVelocity * 0.35 + infra * 0.25

  const gsiSource = region.extreme_gsi ?? region.gsi
  const gsi = (gsiSource !== undefined && gsiSource !== null)
    ? parseFloat(gsiSource.toFixed(1))
    : parseFloat((10 * (1 - riskScore)).toFixed(1))

  const result = { gsi, raw: { velocity, infra } }
  gsiCache.set(key, result)
  return result
}

export function getRFGrade(gsi) {
  if (gsi >= 8) return { label: '안정', color: '#16a34a', emoji: '🟢' }
  if (gsi >= 6) return { label: '주의', color: '#eab308', emoji: '🟡' }
  if (gsi >= 4) return { label: '경계', color: '#ea580c', emoji: '🟠' }
  return { label: '위험', color: '#dc2626', emoji: '🔴' }
}

// ===== 시군 분위수 rank 기반 등급 (공공기관용과 동일 기준) =====
const _sortedSigunguForGrade = [...realRegionsData].sort((a, b) => a.gsi - b.gsi)
const _nSg   = _sortedSigunguForGrade.length
const _sgI5  = Math.max(1, Math.ceil(_nSg * 0.05))
const _sgI15 = Math.ceil(_nSg * 0.15)
const _sgI40 = Math.ceil(_nSg * 0.40)
const _sigunguRankMapExport = Object.fromEntries(
  _sortedSigunguForGrade.map((r, i) => [r.id, i])
)

export function getSigunguGrade(region) {
  const rank = _sigunguRankMapExport[region.id]
  if (rank === undefined) return { label: '안정', color: '#16a34a', emoji: '🟢' }
  if (rank < _sgI5)  return { label: '위험', color: '#dc2626', emoji: '🔴' }
  if (rank < _sgI15) return { label: '경계', color: '#ea580c', emoji: '🟠' }
  if (rank < _sgI40) return { label: '주의', color: '#ca8a04', emoji: '🟡' }
  return               { label: '안정', color: '#16a34a', emoji: '🟢' }
}

// ===== 읍면동 등급 (gsi 분위수 기반, 낮을수록 위험) =====
// realSubmunicipalityData.json gsi 분포 기준 분위수 임계값
// 하위5%: gsi < 1.60 / 5~15%: < 2.10 / 15~40%: < 3.30 / 40%+: 안정
export function getSubmunicipalityGrade(data) {
  const gsi = data.gsi   // realSubmunicipalityData.json 의 gsi 값 사용
  if (gsi == null) return getRiskLevel(data.velocity)
  if (gsi < 1.60) return { label: '위험', color: '#dc2626', emoji: '🔴' }
  if (gsi < 2.10) return { label: '경계', color: '#ea580c', emoji: '🟠' }
  if (gsi < 3.30) return { label: '주의', color: '#ca8a04', emoji: '🟡' }
  return              { label: '안정', color: '#16a34a', emoji: '🟢' }
}
