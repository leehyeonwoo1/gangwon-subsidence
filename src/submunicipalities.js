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

  const data = {
    id: code,
    name: feature.properties.name,
    parentRegion: parent.region.name,
    lat: parent.center.lat,
    lng: parent.center.lng,
    velocity: generateFakeVelocity(parent.region.velocity),
    lastUpdated: '2025-04-15',
  }

  submunicipalityDataCache.set(code, data)
  return data
}