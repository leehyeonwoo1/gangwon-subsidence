import { useMemo, useState, useRef, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { getRiskLevel, generateTimeSeries, getSafetyIndex, getSafetyLevel, getCivicExplanation, getSigunguGrade } from './regions'
import { useIsMobile } from './useIsMobile'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function SidePanel({ region, onClose, isChatOpen }) {
  const isMobile = useIsMobile()
  const isSubmunicipality = region ? !!region.parentRegion : false

  const SNAP_SMALL = 40
  const SNAP_LARGE = 92
  const [sheetHeight, setSheetHeight] = useState(SNAP_SMALL)
  const dragRef = useRef({ dragging: false, startY: 0, startHeight: 0 })
  const heightRef = useRef(SNAP_SMALL)
  const handleBarRef = useRef(null)

  useEffect(() => {
    heightRef.current = sheetHeight
  }, [sheetHeight])

  useEffect(() => {
    if (region) {
      setSheetHeight(SNAP_SMALL)
      heightRef.current = SNAP_SMALL
    }
  }, [region])

  useEffect(() => {
    const bar = handleBarRef.current
    if (!bar) return

    const start = (clientY) => {
      dragRef.current = {
        dragging: true,
        startY: clientY,
        startHeight: heightRef.current,
        lastY: clientY,
        lastTime: Date.now(),
        velocity: 0,
      }
    }
    const move = (clientY) => {
      if (!dragRef.current.dragging) return
      const now = Date.now()
      const d = dragRef.current
      const dt = now - d.lastTime
      if (dt > 0) {
        const dyVh = ((d.lastY - clientY) / window.innerHeight) * 100
        d.velocity = dyVh / dt
      }
      d.lastY = clientY
      d.lastTime = now
      const deltaY = d.startY - clientY
      const deltaVh = (deltaY / window.innerHeight) * 100
      let next = d.startHeight + deltaVh
      next = Math.max(15, Math.min(92, next))
      heightRef.current = next
      setSheetHeight(next)
    }
    const end = () => {
      if (!dragRef.current.dragging) return
      dragRef.current.dragging = false
      const h = heightRef.current
      const v = dragRef.current.velocity
      const FLICK = 0.12

      const settle = (target) => {
        setSheetHeight(target)
        heightRef.current = target
      }

      if (v > FLICK) { settle(SNAP_LARGE); return }
      if (v < -FLICK) {
        if (v < -0.4 || h < SNAP_SMALL) { onClose() } else { settle(SNAP_SMALL) }
        return
      }

      if (h < 28) { onClose() }
      else if (h < (SNAP_SMALL + SNAP_LARGE) / 2) { settle(SNAP_SMALL) }
      else { settle(SNAP_LARGE) }
    }

    const onTouchStart = (e) => { e.preventDefault(); e.stopPropagation(); start(e.touches[0].clientY) }
    const onTouchMove = (e) => { if (!dragRef.current.dragging) return; e.preventDefault(); move(e.touches[0].clientY) }
    const onTouchEnd = () => { end() }
    const onMouseDown = (e) => {
      e.preventDefault()
      start(e.clientY)
      const mm = (ev) => move(ev.clientY)
      const mu = () => { end(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu) }
      window.addEventListener('mousemove', mm)
      window.addEventListener('mouseup', mu)
    }

    bar.addEventListener('touchstart', onTouchStart, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    bar.addEventListener('mousedown', onMouseDown)

    return () => {
      bar.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      bar.removeEventListener('mousedown', onMouseDown)
    }
  }, [isMobile, region])

  // ✅ 수정: null 체크 + 시군/읍면동 분기
  const safety = useMemo(() => {
    if (!region) return getSafetyIndex(0)
    if (region.parentRegion) {
      // 읍면동: 기존 getSafetyIndex 사용
      return getSafetyIndex(region.gsi ?? 0)
    }
    // 시군: 분위수 기준
    const grade = getSigunguGrade(region)
    const fallback = getSafetyIndex(region.gsi ?? 0)
    return {
      score: parseFloat((region.gsi ?? 0).toFixed(1)),
      level: {
        ...grade,
        description: fallback.level.description,
        civicMessage: fallback.level.civicMessage,
        officialMessage: fallback.level.officialMessage,
      }
    }
  }, [region])

  const civic = useMemo(() => getCivicExplanation(region?.velocity ?? 0), [region])

  const timeSeriesData = useMemo(() => {
    const result = generateTimeSeries(region?.id || region?.name || '', region?.velocity ?? 0)
    return Array.isArray(result) ? result : (result?.data ? result : { months: [], data: [] })
  }, [region])

  if (!region) return null

  const months = Array.isArray(timeSeriesData)
    ? timeSeriesData.map(d => d.month)
    : timeSeriesData.months || []
  const data = Array.isArray(timeSeriesData)
    ? timeSeriesData.map(d => d.displacement)
    : timeSeriesData.data || []

  const displacementTimeSeries = data

  const chartData = {
    labels: months,
    datasets: [
      {
        label: '누적 변위',
        data: displacementTimeSeries,
        borderColor: safety.level.color,
        backgroundColor: `${safety.level.color}33`,
        tension: 0.3,
        pointBackgroundColor: 'white',
        pointBorderColor: safety.level.color,
        pointRadius: isSubmunicipality ? 3 : 4,
        pointBorderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '📊 최근 12개월 누적 변위 변화',
        font: { size: isSubmunicipality ? 11 : 13, weight: '600' },
        color: '#374151',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `누적 변위: ${ctx.parsed.y.toFixed(1)}mm`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 } } },
      y: {
        title: { display: true, text: '누적 변위 (mm, 음수=침하)', font: { size: 10 } },
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 9 } },
      },
    },
  }

  return (
    <div
      className="side-panel"
      style={
        isMobile
          ? {
              position: 'fixed', left: 0, right: 0, bottom: 0, width: '100%',
              height: `${sheetHeight}vh`, background: 'white',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.18)', zIndex: 1500,
              padding: '20px', paddingTop: '28px', overflowY: 'auto',
              boxSizing: 'border-box', borderRadius: '20px 20px 0 0', border: 'none',
              transition: dragRef.current.dragging ? 'none' : 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }
          : {
              position: 'absolute', top: '80px', right: '20px', width: '380px',
              maxHeight: 'calc(100vh - 100px)', background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000,
              padding: '20px', overflowY: 'auto', boxSizing: 'border-box',
              borderRadius: '16px', transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              border: isSubmunicipality ? '2px solid #f3f4f6' : 'none',
            }
      }
    >
      {isMobile && (
        <div
          ref={handleBarRef}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', touchAction: 'none',
          }}
        >
          <div style={{ width: '40px', height: '5px', background: '#d1d5db', borderRadius: '3px' }} />
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'none', border: 'none', fontSize: '20px',
          cursor: 'pointer', color: '#6b7280', padding: '4px 8px',
        }}
      >
        ×
      </button>

      <div style={{ marginBottom: '16px' }}>
        {isSubmunicipality && (
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', marginBottom: '4px' }}>
            🗺️ {region.parentRegion} · 읍·면·동 단위
          </div>
        )}
        <h2 style={{ margin: 0, fontSize: isSubmunicipality ? '20px' : '24px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px' }}>
          {safety.level.emoji} {region.name}
        </h2>
      </div>

      {/* 안전 지수 메인 카드 */}
      <div style={{
        background: `linear-gradient(135deg, ${safety.level.color}15, ${safety.level.color}05)`,
        border: `2px solid ${safety.level.color}33`,
        padding: '20px', borderRadius: '14px', marginBottom: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>안전 지수</div>
        <div style={{ fontSize: '48px', fontWeight: '800', color: safety.level.color, lineHeight: '1', letterSpacing: '-2px' }}>
          {safety.score}
          <span style={{ fontSize: '20px', color: '#9ca3af', marginLeft: '4px', fontWeight: '600' }}>/ 10</span>
        </div>
        <div style={{
          display: 'inline-block', marginTop: '10px', padding: '4px 12px',
          background: safety.level.color, color: 'white', borderRadius: '20px',
          fontSize: '12px', fontWeight: '700',
        }}>
          {safety.level.label}
        </div>
        <div style={{ fontSize: '13px', color: '#374151', marginTop: '10px', fontWeight: '500' }}>
          {safety.level.description}
        </div>
      </div>

      {/* 시민 안내 박스 */}
      <div style={{
        background: '#fefce8', border: '1px solid #fde047',
        padding: '12px', borderRadius: '10px', marginBottom: '12px',
      }}>
        <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '700', marginBottom: '6px' }}>👤 시민 안내</div>
        <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: '1.5' }}>{safety.level.civicMessage}</div>
        <div style={{ fontSize: '12px', color: '#78350f', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #fde047', lineHeight: '1.5' }}>
          📌 <strong>{region.name}의 1년 변화:</strong>{' '}
          {region.velocity < 0
            ? `약 ${Math.abs(region.velocity).toFixed(1)}mm씩 가라앉음`
            : region.velocity > 0
            ? `약 ${region.velocity.toFixed(1)}mm씩 솟아오름`
            : '거의 변화 없음'}
          {' '}({civic.speedDescription})
        </div>
      </div>

      {/* 공공기관용 박스 */}
      <div style={{
        background: '#eff6ff', border: '1px solid #93c5fd',
        padding: '12px', borderRadius: '10px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '700', marginBottom: '6px' }}>🏛️ 공공기관용 분석</div>
        <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: '1.5' }}>{safety.level.officialMessage}</div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', borderTop: '1px solid #dbeafe', paddingTop: '8px', lineHeight: '1.7' }}>
          <div>• 침하 속도: <strong style={{ color: '#1f2937' }}>{region.velocity} mm/year</strong></div>
          <div>• 안전 지수: <strong style={{ color: '#1f2937' }}>{safety.score}/10</strong></div>
          <div>• 최종 갱신: {region.lastUpdated}</div>
          {region.parentRegion && <div>• 소속: {region.parentRegion}</div>}
        </div>
      </div>

      {/* 특별 사유 (읍면동만) */}
      {isSubmunicipality && region.reason && (
        <div style={{
          background: `${safety.level.color}11`, border: `1px solid ${safety.level.color}44`,
          padding: '12px', borderRadius: '8px', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>📍 지질학적 요인</div>
          <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{region.reason}</div>
        </div>
      )}

      {/* 그래프 */}
      {months.length > 0 && (
        <div style={{ height: isSubmunicipality ? '180px' : '220px', marginBottom: '12px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {isSubmunicipality && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>
          💡 시·군 단위 종합 분석은 줌아웃 후 마커 클릭
        </div>
      )}
    </div>
  )
}

export default SidePanel
