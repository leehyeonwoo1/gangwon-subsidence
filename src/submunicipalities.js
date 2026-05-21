// 강원도 읍·면·동 데이터 생성기
// code가 "32"로 시작하는 것 = 강원도

import koreaSubmunicipalities from './korea-submunicipalities.json'
import { gangwonRegions } from './regions'

// 강원도 읍·면·동만 필터링
export const gangwonSubmunicipalities = {
  type: 'FeatureCollection',
  features: koreaSubmunicipalities.features.filter(
    (feature) => feature.properties.code?.startsWith('32')
  ),
}

// 가짜 침하 데이터 생성 함수
function generateFakeVelocity(parentVelocity) {
  const noise = (Math.random() - 0.5) * 4
  return parseFloat((parentVelocity + noise).toFixed(2))
}

// 읍·면·동 폴리곤의 중심점 + 부모 시·군 찾기
function findParentRegion(feature) {
  let coords = []
  if (feature.geometry.type === 'Polygon') {
    coords = feature.geometry.coordinates[0]
  } else if (feature.geometry.type === 'MultiPolygon') {
    coords = feature.geometry.coordinates[0][0]
  }

  if (coords.length === 0) return null

  const center = coords.reduce(
    (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
    { lng: 0, lat: 0 }
  )
  center.lng /= coords.length
  center.lat /= coords.length

  let nearestRegion = null
  let minDistance = Infinity

  gangwonRegions.forEach((region) => {
    const dLat = region.lat - center.lat
    const dLng = region.lng - center.lng
    const distance = Math.sqrt(dLat * dLat + dLng * dLng)
    if (distance < minDistance) {
      minDistance = distance
      nearestRegion = region
    }
  })

  return { region: nearestRegion, center }
}

// 발표 스토리텔링용 - 실제 학술적으로 위험한 읍·면·동
// 폐광/카르스트/매립지 등 인공적/지질적 위험 요인 있는 곳들
const specialSubmunicipalities = {
  '황지동': { velocity: -15.2, reason: '폐광 지역 + 카르스트 지형' },
  '장성동': { velocity: -13.8, reason: '탄광 침하 이력 보유' },
  '사북읍': { velocity: -14.5, reason: '폐광 후 지반 안정화 진행 중' },
  '고한읍': { velocity: -12.3, reason: '폐광 지역 침하 진행' },
  '상동읍': { velocity: -8.7, reason: '광산 활동 영향 지역' },
  '도계읍': { velocity: -11.2, reason: '탄광 도시, 채굴 영향' },
  '천곡동': { velocity: -6.5, reason: '해안 매립지' },
  '옥계면': { velocity: -5.8, reason: '시멘트 공장 인접 지역' },
}

// 가짜 침하 데이터 캐싱
const submunicipalityDataCache = new Map()

export function getSubmunicipalityData(feature) {
  const code = feature.properties.code
  if (!code) return null

  if (submunicipalityDataCache.has(code)) {
    return submunicipalityDataCache.get(code)
  }

  const parent = findParentRegion(feature)
  if (!parent || !parent.region) return null

  // 특별 읍·면·동인지 확인
const name = feature.properties.name
const special = specialSubmunicipalities[name]

// 데이터 생성
const data = {
  id: code,
  name: feature.properties.name,
  parentRegion: parent.region.name,
  lat: parent.center.lat,
  lng: parent.center.lng,
  velocity: special ? special.velocity : generateFakeVelocity(parent.region.velocity),
  reason: special ? special.reason : null,  // 위험 사유 (특별한 곳만)
  lastUpdated: '2025-04-15',
}

  submunicipalityDataCache.set(code, data)
  return data
}