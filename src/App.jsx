import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, ImageOverlay, useMap } from "react-leaflet";
import { gangwonRegions, getRiskLevel, getSigunguGrade } from './regions'
import { gangwonSubmunicipalities, getSubmunicipalityData } from './submunicipalities'
import SidePanel from './SidePanel'
import ChatBot from './ChatBot'
import koreaProvinces from './korea-provinces.json'
import koreaMunicipalities from './korea-municipalities.json'
import './App.css'
import LandingPage from './LandingPage'
import Header from './Header'
import Dashboard from './Dashboard'

function MapController({ targetRegion }) {
  const map = useMap()
  useEffect(() => {
    if (targetRegion) {
      map.flyTo([targetRegion.lat, targetRegion.lng], 11, { duration: 1.2 })
    } else {
      map.flyTo([37.8228, 128.1555], 9, { duration: 1.2 })
    }
  }, [targetRegion, map])
  return null
}

function ZoomTracker({ onZoomChange }) {
  const map = useMap()
  useEffect(() => {
    onZoomChange(map.getZoom())
    const handleZoom = () => onZoomChange(map.getZoom())
    map.on('zoomend', handleZoom)
    return () => { map.off('zoomend', handleZoom) }
  }, [map, onZoomChange])
  return null
}

function App() {
  const [currentPage, setCurrentPage] = useState('landing')

  const navigateTo = (page) => {
    setCurrentPage(page)
    window.history.pushState({ page }, '', `/${page === 'landing' ? '' : page}`)
  }

  useEffect(() => {
    const handlePopState = (e) => {
      const page = e.state?.page || 'landing'
      setCurrentPage(page)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (currentPage === 'map') {
      document.body.classList.add('map-mode')
    } else {
      document.body.classList.remove('map-mode')
    }
    return () => { document.body.classList.remove('map-mode') }
  }, [currentPage])

  const gangwonCenter = [37.8228, 128.1555]
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1300)
  const [currentZoom, setCurrentZoom] = useState(9)
  const [showMunicipalities, setShowMunicipalities] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showSubmunicipalities, setShowSubmunicipalities] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1300)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const selectRegionSmart = (region) => { setSelectedRegion(region) }
  const openChatSmart = () => { setIsChatOpen(true) }

  const matchRegion = (geoName) => {
    if (!geoName || typeof geoName !== 'string') return null
    return gangwonRegions.find((r) => r.name === geoName)
  }

  const isInGangwon = (feature) => {
    let firstPoint
    if (feature.geometry.type === 'Polygon') {
      firstPoint = feature.geometry.coordinates[0][0]
    } else if (feature.geometry.type === 'MultiPolygon') {
      firstPoint = feature.geometry.coordinates[0][0][0]
    } else {
      return false
    }
    const [lng, lat] = firstPoint
    return lat >= 37.0 && lat <= 38.7 && lng >= 127.0 && lng <= 129.6
  }

  const gangwonGeoJSON = {
    type: 'FeatureCollection',
    features: koreaProvinces.features.filter(
      (feature) =>
        feature.properties.name === '강원도' ||
        feature.properties.name === '강원특별자치도'
    ),
  }

  const createOutsideMask = () => {
    const gangwonFeature = gangwonGeoJSON.features[0]
    if (!gangwonFeature) return null
    const outerRing = [
      [120.0, 30.0], [135.0, 30.0], [135.0, 45.0], [120.0, 45.0], [120.0, 30.0],
    ]
    let gangwonRings = []
    const geometry = gangwonFeature.geometry
    if (geometry.type === 'Polygon') {
      gangwonRings = geometry.coordinates
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon) => { gangwonRings.push(...polygon) })
    }
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { name: '강원도 외부 마스크' },
        geometry: { type: 'Polygon', coordinates: [outerRing, ...gangwonRings] },
      }],
    }
  }

  const outsideMaskGeoJSON = createOutsideMask()

  const gangwonMunicipalitiesGeoJSON = {
    type: 'FeatureCollection',
    features: koreaMunicipalities.features.filter(
      (feature) => matchRegion(feature.properties.name) !== null && isInGangwon(feature)
    ),
  }

  const submunicipalitiesGeoJSON = gangwonSubmunicipalities

  const outsideMaskStyle = {
    fillColor: '#1e3a8a', fillOpacity: 0.5,
    color: '#64748b', weight: 0, interactive: false,
  }

  const provinceStyle = {
    color: '#1e3a8a', weight: 4,
    fillColor: 'transparent', fillOpacity: 0,
    dashArray: null, interactive: false,
  }

  // ✅ 시군 분위수 기준으로 색칠
  const municipalityStyle = (feature) => {
    const region = matchRegion(feature.properties.name)
    if (!region) return { fillOpacity: 0, opacity: 0 }
    const grade = getSigunguGrade(region)
    return {
      color: grade.color,
      weight: 1.5,
      fillColor: grade.color,
      fillOpacity: 0.45,
    }
  }

  const submunicipalityStyle = (feature) => {
    const data = getSubmunicipalityData(feature)
    if (!data) return { fillOpacity: 0, opacity: 0 }
    const risk = getRiskLevel(data.velocity)
    return {
      color: risk.color, weight: 1,
      fillColor: risk.color, fillOpacity: 0.55,
    }
  }

  const onEachMunicipality = (feature, layer) => {
    const region = matchRegion(feature.properties.name)
    if (!region) return

    layer.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.75, weight: 3 })
      this.bringToFront()
    })
    layer.on('mouseout', function () {
      const grade = getSigunguGrade(region)
      this.setStyle({ fillOpacity: 0.45, weight: 1.5, color: grade.color })
    })
    layer.on('click', function () { selectRegionSmart(region) })
    layer.bindTooltip(region.name, { sticky: true, direction: 'top', className: 'region-tooltip' })
  }

  const onEachSubmunicipality = (feature, layer) => {
    const data = getSubmunicipalityData(feature)
    if (!data) return

    layer.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.8, weight: 2.5 })
      this.bringToFront()
    })
    layer.on('mouseout', function () {
      const risk = getRiskLevel(data.velocity)
      this.setStyle({ fillOpacity: 0.55, weight: 1, color: risk.color })
    })
    layer.on('click', function () { selectRegionSmart(data) })

    const risk = getRiskLevel(data.velocity)
    layer.bindTooltip(
      `<strong>${data.name}</strong><br/>${data.velocity} mm/year ${risk.emoji}`,
      { sticky: true, direction: 'top', className: 'region-tooltip' }
    )
  }

  if (currentPage === 'landing') {
    return (
      <>
        <Header currentPage={currentPage} onNavigate={navigateTo} />
        <LandingPage onStart={(dest) => navigateTo(dest || 'map')} />
      </>
    )
  }

  if (currentPage === 'dashboard') {
    return (
      <>
        <Header currentPage={currentPage} onNavigate={navigateTo} />
        <Dashboard onNavigate={navigateTo} />
      </>
    )
  }

  return (
    <>
      <Header currentPage={currentPage} onNavigate={navigateTo} />
      <div style={{ width: '100vw', height: '100vh', position: 'relative', paddingTop: '60px', boxSizing: 'border-box' }}>
        <MapContainer
          center={gangwonCenter}
          zoom={8}
          minZoom={8}
          maxBounds={[[37.0, 127.0], [38.7, 129.6]]}
          maxBoundsViscosity={1.0}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController targetRegion={selectedRegion} />
          <ZoomTracker onZoomChange={setCurrentZoom} />

          {outsideMaskGeoJSON && (
            <GeoJSON key="outside-mask" data={outsideMaskGeoJSON} style={outsideMaskStyle} />
          )}

          {showMunicipalities && (
            <GeoJSON
              key={`muni-${gangwonMunicipalitiesGeoJSON.features.length}`}
              data={gangwonMunicipalitiesGeoJSON}
              style={municipalityStyle}
              onEachFeature={onEachMunicipality}
            />
          )}

          {showSubmunicipalities && (
            <GeoJSON
              key={`sub-${submunicipalitiesGeoJSON.features.length}`}
              data={submunicipalitiesGeoJSON}
              style={submunicipalityStyle}
              onEachFeature={onEachSubmunicipality}
            />
          )}

          <GeoJSON key="province" data={gangwonGeoJSON} style={provinceStyle} />

          {showHeatmap && (
            <ImageOverlay
              url="/gsi_heatmap.png"
              bounds={[[36.715861, 126.860542], [38.903812, 130.205295]]}
              opacity={0.6}
              zIndex={400}
            />
          )}

          {/* ✅ CircleMarker도 분위수 기준 */}
          {gangwonRegions.map((region) => {
            const grade = getSigunguGrade(region)
            return (
              <CircleMarker
                key={region.id}
                center={[region.lat, region.lng]}
                radius={8}
                pathOptions={{
                  color: 'white',
                  fillColor: grade.color,
                  fillOpacity: 1,
                  weight: 2,
                }}
                eventHandlers={{ click: () => selectRegionSmart(region) }}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h3 style={{ margin: '0 0 8px 0' }}>
                      {grade.emoji} {region.name}
                    </h3>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <div>
                        <strong>등급:</strong>{' '}
                        <span style={{ color: grade.color, fontWeight: 'bold' }}>
                          {grade.label}
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
                          marginTop: '8px', padding: '4px 8px',
                          background: grade.color, color: 'white',
                          border: 'none', borderRadius: '4px',
                          cursor: 'pointer', fontSize: '12px',
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

        <SidePanel region={selectedRegion} onClose={() => setSelectedRegion(null)} isChatOpen={false} />

        <ChatBot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onRegionSelect={(region) => selectRegionSmart(region)}
          selectedRegion={selectedRegion}
        />

        {showHeatmap && (
          <div className="legend-card" style={{ position: 'absolute', bottom: '104px', left: '24px', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 1000, fontSize: '13px', lineHeight: '1.9' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '13px' }}>픽셀 단위 위험도 (InSAR)</div>
            <div>🔴 위험 (하위 5%)</div>
            <div>🟠 경계 (하위 5~15%)</div>
            <div>🟡 주의 (하위 15~40%)</div>
            <div style={{ color: '#9ca3af' }}>□ 안정 또는 데이터 없음</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>Sentinel-1 SAR 250만 픽셀 기반</div>
          </div>
        )}

        {!isChatOpen && (
          <button
            className="chat-fab"
            onClick={openChatSmart}
            style={{
              position: 'absolute', bottom: '24px', left: '24px',
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)',
              color: 'white', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(30, 64, 175, 0.35)',
              zIndex: 1000, fontSize: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🤖
          </button>
        )}

        <div className="legend-card" style={{ position: 'absolute', bottom: '20px', right: selectedRegion ? '400px' : '20px', padding: '14px 18px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 1000, fontSize: '13px', lineHeight: '1.9', transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}>안전 지수 (0~10점)</div>
          <div>🔴 위험 (0~2점)</div>
          <div>🟠 경계 (2~4점)</div>
          <div>🟡 주의 (4~6점)</div>
          <div>🟢 양호/안전 (6점 이상)</div>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>높을수록 안전합니다</div>
        </div>

        <div className="info-card" style={{ position: 'absolute', top: '20px', left: '60px', padding: '14px 22px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 1000 }}>
          <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}>🛰️ 강원도 지반침하 모니터링</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: '500' }}>Sentinel-1 SAR · InSAR 분석</div>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '10px', marginBottom: '5px', fontWeight: '600', letterSpacing: '0.5px' }}>레이어</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[
              { key: 'muni', label: '시군 단위', state: showMunicipalities, toggle: () => setShowMunicipalities(v => !v) },
              { key: 'heat', label: '픽셀 히트맵', state: showHeatmap, toggle: () => setShowHeatmap(v => !v) },
              { key: 'sub', label: '읍면동 단위', state: showSubmunicipalities, toggle: () => setShowSubmunicipalities(v => !v) },
            ].map(({ key, label, state, toggle }) => (
              <button
                key={key}
                onClick={toggle}
                style={{
                  fontSize: '11px', fontWeight: '600', padding: '4px 9px', borderRadius: '6px',
                  border: `1.5px solid ${state ? '#3b82f6' : '#e5e7eb'}`, cursor: 'pointer',
                  background: state ? '#eff6ff' : '#f9fafb', color: state ? '#1d4ed8' : '#9ca3af',
                  transition: 'all 0.15s',
                }}
              >
                {state ? '●' : '○'} {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
