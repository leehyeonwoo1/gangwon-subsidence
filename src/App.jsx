import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from 'react-leaflet'
import { gangwonRegions, getRiskLevel } from './regions'
import { gangwonSubmunicipalities, getSubmunicipalityData } from './submunicipalities'
import SidePanel from './SidePanel'
import ChatBot from './ChatBot'
import koreaProvinces from './korea-provinces.json'
import koreaMunicipalities from './korea-municipalities.json'
import './App.css'

// ============================================
// 헬퍼 컴포넌트들
// ============================================

// 지도를 특정 좌표로 이동시키는 헬퍼
function MapController({ targetRegion }) {
  const map = useMap()

  useEffect(() => {
    if (targetRegion) {
      map.flyTo([targetRegion.lat, targetRegion.lng], 11, {
        duration: 1.2,
      })
    } else {
      map.flyTo([37.8228, 128.1555], 9, {
        duration: 1.2,
      })
    }
  }, [targetRegion, map])

  return null
}

// 줌 레벨 추적
function ZoomTracker({ onZoomChange }) {
  const map = useMap()

  useEffect(() => {
    onZoomChange(map.getZoom())
    const handleZoom = () => onZoomChange(map.getZoom())
    map.on('zoomend', handleZoom)
    return () => {
      map.off('zoomend', handleZoom)
    }
  }, [map, onZoomChange])

  return null
}

// ============================================
// 메인 App 컴포넌트
// ============================================

function App() {
  const gangwonCenter = [37.8228, 128.1555]

  // ============================================
  // State 정의
  // ============================================
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1300)
  const [currentZoom, setCurrentZoom] = useState(9)

  // 줌 11 이상이면 읍·면·동 모드
  const isDetailMode = currentZoom >= 11

  // ============================================
  // useEffect 효과들
  // ============================================
  useEffect(() => {
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1300)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ============================================
  // 도우미 함수들
  // ============================================

  const selectRegionSmart = (region) => {
  setSelectedRegion(region)
}

const openChatSmart = () => {
  setIsChatOpen(true)
}

  const matchRegion = (geoName) => {
    if (!geoName || typeof geoName !== 'string') return null
    return gangwonRegions.find((r) => r.name === geoName)
  }

  // ============================================
  // GeoJSON 데이터들
  // ============================================

  // 강원도 외곽선
  const gangwonGeoJSON = {
    type: 'FeatureCollection',
    features: koreaProvinces.features.filter(
      (feature) =>
        feature.properties.name === '강원도' ||
        feature.properties.name === '강원특별자치도'
    ),
  }

  // 강원도 외부 마스크
  const createOutsideMask = () => {
    const gangwonFeature = gangwonGeoJSON.features[0]
    if (!gangwonFeature) return null

    const outerRing = [
      [120.0, 30.0],
      [135.0, 30.0],
      [135.0, 45.0],
      [120.0, 45.0],
      [120.0, 30.0],
    ]

    let gangwonRings = []
    const geometry = gangwonFeature.geometry

    if (geometry.type === 'Polygon') {
      gangwonRings = geometry.coordinates
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon) => {
        gangwonRings.push(...polygon)
      })
    }

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: '강원도 외부 마스크' },
          geometry: {
            type: 'Polygon',
            coordinates: [outerRing, ...gangwonRings],
          },
        },
      ],
    }
  }

  const outsideMaskGeoJSON = createOutsideMask()

  // 강원도 18개 시·군
  const gangwonMunicipalitiesGeoJSON = {
    type: 'FeatureCollection',
    features: koreaMunicipalities.features.filter(
      (feature) => matchRegion(feature.properties.name) !== null
    ),
  }

  // 강원도 188개 읍·면·동
  const submunicipalitiesGeoJSON = gangwonSubmunicipalities

  // ============================================
  // 스타일 정의
  // ============================================

  const outsideMaskStyle = {
    fillColor: '#1e3a8a',
    fillOpacity: 0.5,
    color: '#64748b',
    weight: 0,
    interactive: false,
  }

  const provinceStyle = {
    color: '#1e3a8a',
    weight: 4,
    fillColor: 'transparent',
    fillOpacity: 0,
    dashArray: null,
    interactive: false,
  }

  // 시·군 스타일
  const municipalityStyle = (feature) => {
    const region = matchRegion(feature.properties.name)
    if (!region) return { fillOpacity: 0, opacity: 0 }
    const risk = getRiskLevel(region.velocity)
    return {
      color: risk.color,
      weight: 1.5,
      fillColor: risk.color,
      fillOpacity: 0.45,
    }
  }

  // 읍·면·동 스타일
  const submunicipalityStyle = (feature) => {
    const data = getSubmunicipalityData(feature)
    if (!data) return { fillOpacity: 0, opacity: 0 }
    const risk = getRiskLevel(data.velocity)
    return {
      color: risk.color,
      weight: 1,
      fillColor: risk.color,
      fillOpacity: 0.55,
    }
  }

  // ============================================
  // 이벤트 핸들러들
  // ============================================

  // 시·군 이벤트
  const onEachMunicipality = (feature, layer) => {
    const region = matchRegion(feature.properties.name)
    if (!region) return

    layer.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.75, weight: 3 })
      this.bringToFront()
    })

    layer.on('mouseout', function () {
      const risk = getRiskLevel(region.velocity)
      this.setStyle({
        fillOpacity: 0.45,
        weight: 1.5,
        color: risk.color,
      })
    })

    layer.on('click', function () {
      selectRegionSmart(region)
    })

    layer.bindTooltip(region.name, {
      sticky: true,
      direction: 'top',
      className: 'region-tooltip',
    })
  }

  // 읍·면·동 이벤트
  const onEachSubmunicipality = (feature, layer) => {
    const data = getSubmunicipalityData(feature)
    if (!data) return

    layer.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.8, weight: 2.5 })
      this.bringToFront()
    })

    layer.on('mouseout', function () {
      const risk = getRiskLevel(data.velocity)
      this.setStyle({
        fillOpacity: 0.55,
        weight: 1,
        color: risk.color,
      })
    })

    layer.on('click', function () {
      const parentRegion = gangwonRegions.find((r) => r.name === data.parentRegion)
      if (parentRegion) {
        selectRegionSmart(parentRegion)
      }
    })

    const risk = getRiskLevel(data.velocity)
    layer.bindTooltip(
      `<strong>${data.name}</strong><br/>${data.velocity} mm/year ${risk.emoji}`,
      {
        sticky: true,
        direction: 'top',
        className: 'region-tooltip',
      }
    )
  }

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapContainer
        center={gangwonCenter}
        zoom={9}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController targetRegion={selectedRegion} />
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* 강원도 외부 반투명 마스크 */}
        {outsideMaskGeoJSON && (
          <GeoJSON
            key="outside-mask"
            data={outsideMaskGeoJSON}
            style={outsideMaskStyle}
          />
        )}

        {/* 시·군 단위 (줌 10 이하) */}
        {!isDetailMode && (
          <GeoJSON
            key={`muni-${gangwonMunicipalitiesGeoJSON.features.length}`}
            data={gangwonMunicipalitiesGeoJSON}
            style={municipalityStyle}
            onEachFeature={onEachMunicipality}
          />
        )}

        {/* 읍·면·동 단위 (줌 11 이상) */}
        {isDetailMode && (
          <GeoJSON
            key={`sub-${submunicipalitiesGeoJSON.features.length}`}
            data={submunicipalitiesGeoJSON}
            style={submunicipalityStyle}
            onEachFeature={onEachSubmunicipality}
          />
        )}

        {/* 강원도 외곽선 */}
        <GeoJSON
          key="province"
          data={gangwonGeoJSON}
          style={provinceStyle}
        />

        {/* 시·군 마커 */}
        {gangwonRegions.map((region) => {
          const risk = getRiskLevel(region.velocity)
          return (
            <CircleMarker
              key={region.id}
              center={[region.lat, region.lng]}
              radius={8}
              pathOptions={{
                color: 'white',
                fillColor: risk.color,
                fillOpacity: 1,
                weight: 2,
              }}
              eventHandlers={{
                click: () => selectRegionSmart(region),
              }}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>
                    {risk.emoji} {region.name}
                  </h3>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div>
                      <strong>위험 등급:</strong>{' '}
                      <span style={{ color: risk.color, fontWeight: 'bold' }}>
                        {risk.grade}
                      </span>
                    </div>
                    <div>
                      <strong>침하 속도:</strong> {region.velocity} mm/year
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      최종 갱신: {region.lastUpdated}
                    </div>
                    <button
                      onClick={() => selectRegionSmart(region)}
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: risk.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      상세 분석 보기 →
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* 사이드 패널 */}
      <SidePanel
  region={selectedRegion}
  onClose={() => setSelectedRegion(null)}
  isChatOpen={false}
/>

      {/* 챗봇 */}
      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onRegionSelect={(region) => selectRegionSmart(region)}
      />

      {/* 챗봇 플로팅 버튼 */}
      {!isChatOpen && (
        <button
          className="chat-fab"
          onClick={openChatSmart}
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(30, 64, 175, 0.35)',
            zIndex: 1000,
            fontSize: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🤖
        </button>
      )}

      {/* 범례 */}
      <div
        className="legend-card"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: selectedRegion ? '400px' : '20px',
          padding: '14px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 1000,
          fontSize: '13px',
          lineHeight: '1.9',
          transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '13px', letterSpacing: '-0.3px' }}>
          지반침하 위험도
        </div>
        <div>🔴 위험 (≤ -10 mm/year)</div>
        <div>🟠 경고 (-10 ~ -5)</div>
        <div>🟡 주의 (-5 ~ -2)</div>
        <div>🟢 안전 (-2 이상)</div>
      </div>

      {/* 좌측 상단 제목 + 모드 표시 */}
      <div
        className="info-card"
        style={{
          position: 'absolute',
          top: '20px',
          left: '60px',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 1000,
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}>
          🛰️ 강원도 지반침하 모니터링
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: '500' }}>
          Sentinel-1 SAR · InSAR 분석
        </div>
        <div
          style={{
            fontSize: '11px',
            color: isDetailMode ? '#dc2626' : '#3b82f6',
            marginTop: '8px',
            fontWeight: '600',
            padding: '4px 8px',
            background: isDetailMode ? '#fef2f2' : '#eff6ff',
            borderRadius: '6px',
            display: 'inline-block',
          }}
        >
          {isDetailMode ? '🔍 읍·면·동 단위' : '🗺️ 시·군 단위'}
        </div>
      </div>
    </div>
  )
}

export default App