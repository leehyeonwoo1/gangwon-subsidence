// 강원도 읍·면·동 데이터 생성기
// code가 "32"로 시작하는 것 = 강원도

import koreaSubmunicipalities from './korea-submunicipalities.json'
import { gangwonRegions } from './regions'
import realSubmunicipalityData from './realSubmunicipalityData.json'

// 강원도 읍·면·동만 필터링
export const gangwonSubmunicipalities = {
  type: 'FeatureCollection',
  features: koreaSubmunicipalities.features.filter(
    (feature) => feature.properties.code?.startsWith('32')
  ),
}

// code 앞 4자리로 시·군 매칭
// 통계청 강원도 시·군 코드
const codeToRegionMap = {
  '3201': '춘천시',
  '3202': '원주시',
  '3203': '강릉시',
  '3204': '동해시',
  '3205': '태백시',
  '3206': '속초시',
  '3207': '삼척시',
  // ⚠️ 군 지역 code는 3208~3218이 아니라 3231~3241부터 시작 (실제 korea-submunicipalities.json 기준으로 수정)
  '3231': '홍천군',
  '3232': '횡성군',
  '3233': '영월군',
  '3234': '평창군',
  '3235': '정선군',
  '3236': '철원군',
  '3237': '화천군',
  '3238': '양구군',
  '3239': '인제군',
  '3240': '고성군',
  '3241': '양양군',
  // 강원특별자치도 코드 추가 (2023년 이후)
  '5101': '춘천시',
  '5102': '원주시',
  '5103': '강릉시',
  '5104': '동해시',
  '5105': '태백시',
  '5106': '속초시',
  '5107': '삼척시',
  '5108': '홍천군',
  '5109': '횡성군',
  '5110': '영월군',
  '5111': '평창군',
  '5112': '정선군',
  '5113': '철원군',
  '5114': '화천군',
  '5115': '양구군',
  '5116': '인제군',
  '5117': '고성군',
  '5118': '양양군',
}

// 발표 스토리텔링용 - 실제 학술적으로 위험한 읍·면·동
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

// 가짜 침하 데이터 생성 함수
function generateFakeVelocity(parentVelocity) {
  const noise = (Math.random() - 0.5) * 4
  return parseFloat((parentVelocity + noise).toFixed(2))
}

// code로 부모 시·군 찾기 (정확한 매칭)
function findParentByCode(code) {
  if (!code) return null
  const prefix = code.substring(0, 4)
  const regionName = codeToRegionMap[prefix]
  if (!regionName) return null
  return gangwonRegions.find((r) => r.name === regionName) || null
}

// 폴리곤 중심점 계산 (지도 이동용)
function getCenter(feature) {
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
  return center
}

// 가짜 침하 데이터 캐싱
const submunicipalityDataCache = new Map()

export function getSubmunicipalityData(feature) {
  const code = feature.properties.code
  if (!code) return null

  // 캐시 확인
  if (submunicipalityDataCache.has(code)) {
    return submunicipalityDataCache.get(code)
  }

  // code로 부모 시·군 정확 매칭
  // code로 부모 시·군 정확 매칭
let parentRegion = findParentByCode(code)

// 백업: code 매칭 실패 시 좌표 기반으로 추정
if (!parentRegion) {
  const tempCenter = getCenter(feature)
  if (tempCenter) {
    let minDistance = Infinity
    gangwonRegions.forEach((region) => {
      const dLat = region.lat - tempCenter.lat
      const dLng = region.lng - tempCenter.lng
      const distance = Math.sqrt(dLat * dLat + dLng * dLng)
      if (distance < minDistance) {
        minDistance = distance
        parentRegion = region
      }
    })
  }
}

// 그래도 못 찾으면 (정말 예외적 케이스) 안전 등급으로 fallback
if (!parentRegion) {
  parentRegion = { name: '강원도', velocity: -2.0 }
}

  // 폴리곤 중심점
  const center = getCenter(feature)
  if (!center) return null

  // 특별 읍·면·동인지 확인 (발표 스토리텔링용 — 실제값보다 우선)
  const name = feature.properties.name
  const special = specialSubmunicipalities[name]

  // gsi_pixels.csv를 읍면동 경계로 집계한 실측값 (build_real_data.py로 생성).
  // GSI 픽셀이 매칭되지 않은 일부 읍면동은 real이 없어 가짜값으로 fallback.
  const real = realSubmunicipalityData[code]

  // 데이터 생성: 특별 스토리텔링 > 실측 집계값 > 가짜값(fallback) 우선순위
  const data = {
    id: code,
    name: name,
    parentRegion: parentRegion.name,
    lat: center.lat,
    lng: center.lng,
    velocity: special
      ? special.velocity
      : real
        ? real.velocity
        : generateFakeVelocity(parentRegion.velocity),
    gsi: real ? real.gsi : null,
    extreme_gsi: real ? (real.extreme_gsi ?? null) : null,
    infra: real ? real.infra : null,
    pixelCount: real ? real.pixelCount : null,
    reason: special ? special.reason : null,
    lastUpdated: real ? real.lastUpdated : '2025-04-15',
  }

  submunicipalityDataCache.set(code, data)
  return data
}