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
import { getRiskLevel, generateTimeSeries, getSafetyIndex, getCivicExplanation } from './regions'
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
  // ⬇️ 모든 훅은 early return보다 위에 있어야 함 (React 규칙)
  const isMobile = useIsMobile()
  const isSubmunicipality = region ? !!region.parentRegion : false

  // 📱 바텀 시트 높이 (vh 단위). 스냅 포인트: 40(작게) / 88(크게)
  const SNAP_SMALL = 40
  const SNAP_LARGE = 88
  const [sheetHeight, setSheetHeight] = useState(SNAP_SMALL)
  const dragRef = useRef({ dragging: false, startY: 0, startHeight: 0 })

  // region이 새로 열릴 때마다 작게(40)에서 시작
  useEffect(() => {
    if (region) setSheetHeight(SNAP_SMALL)
  }, [region])

  // 드래그 시작
  const handleDragStart = (clientY) => {
    dragRef.current = { dragging: true, startY: clientY, startHeight: sheetHeight }
  }

  // 드래그 중: 손가락 움직인 만큼 높이 변경
  const handleDragMove = (clientY) => {
    if (!dragRef.current.dragging) return
    const deltaY = dragRef.current.startY - clientY // 위로 올리면 +
    const deltaVh = (deltaY / window.innerHeight) * 100
    let next = dragRef.current.startHeight + deltaVh
    next = Math.max(15, Math.min(92, next)) // 15~92vh 범위 제한
    setSheetHeight(next)
  }

  // 드래그 끝: 가까운 스냅 포인트로 고정 (너무 낮으면 닫기)
  const handleDragEnd = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    if (sheetHeight < 28) {
      onClose() // 충분히 내리면 닫기
    } else if (sheetHeight < (SNAP_SMALL + SNAP_LARGE) / 2) {
      setSheetHeight(SNAP_SMALL)
    } else {
      setSheetHeight(SNAP_LARGE)
    }
  }

  const safety = useMemo(() => getSafetyIndex(region?.velocity ?? 0), [region])
  const civic = useMemo(() => getCivicExplanation(region?.velocity ?? 0), [region])

  const timeSeriesData = useMemo(() => {
    const result = generateTimeSeries(region?.velocity ?? 0, region?.id || region?.name || '')
    return Array.isArray(result) ? result : (result?.data ? result : { months: [], data: [] })
  }, [region])

  // ⬇️ 훅을 다 부른 뒤에 early return
  if (!region) return null

  // generateTimeSeries가 { months, data } 형식이면 그대로, 배열이면 변환
  const months = Array.isArray(timeSeriesData)
    ? timeSeriesData.map(d => d.month)
    : timeSeriesData.months || []
  const data = Array.isArray(timeSeriesData)
    ? timeSeriesData.map(d => d.displacement)
    : timeSeriesData.data || []

  // 안전 지수 시계열 (그래프용)
  const safetyTimeSeries = data.map(v => getSafetyIndex(v).score)

  const chartData = {
    labels: months,
    datasets: [
      {
        label: '안전 지수',
        data: safetyTimeSeries,
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
        text: '📊 최근 12개월 안전 지수 변화',
        font: { size: isSubmunicipality ? 11 : 13, weight: '600' },
        color: '#374151',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `안전 지수: ${ctx.parsed.y.toFixed(1)}/10`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 } },
      },
      y: {
        min: 0,
        max: 10,
        title: { display: true, text: '안전 지수 (0~10점)', font: { size: 10 } },
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 9 },
          stepSize: 2,
        },
      },
    },
  }

  return (
    <div
      className="side-panel"
      style={
        isMobile
          ? {
              // 📱 모바일: 하단에서 올라오는 시트 (드래그로 높이 조절)
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: `${sheetHeight}vh`,
              background: 'white',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
              zIndex: 1500,
              padding: '20px',
              paddingTop: '28px',
              overflowY: 'auto',
              boxSizing: 'border-box',
              borderRadius: '20px 20px 0 0',
              border: 'none',
              transition: dragRef.current.dragging ? 'none' : 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              touchAction: 'none',
            }
          : {
              // 💻 데스크톱: 우측 패널 (기존 그대로)
              position: 'absolute',
              top: '80px',
              right: '20px',
              width: '380px',
              maxHeight: 'calc(100vh - 100px)',
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              zIndex: 1000,
              padding: '20px',
              overflowY: 'auto',
              boxSizing: 'border-box',
              borderRadius: '16px',
              transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              border: isSubmunicipality ? '2px solid #f3f4f6' : 'none',
            }
      }
    >
      {/* 📱 모바일 손잡이 바 (드래그 가능) */}
      {isMobile && (
        <div
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => {
            handleDragStart(e.clientY)
            const move = (ev) => handleDragMove(ev.clientY)
            const up = () => {
              handleDragEnd()
              window.removeEventListener('mousemove', move)
              window.removeEventListener('mouseup', up)
            }
            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', up)
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '5px',
              background: '#d1d5db',
              borderRadius: '3px',
            }}
          />
        </div>
      )}

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#6b7280',
          padding: '4px 8px',
        }}
      >
        ×
      </button>

      {/* 헤더 */}
      <div style={{ marginBottom: '16px' }}>
        {isSubmunicipality && (
          <div
            style={{
              fontSize: '11px',
              color: '#6b7280',
              fontWeight: '500',
              marginBottom: '4px',
            }}
          >
            🗺️ {region.parentRegion} · 읍·면·동 단위
          </div>
        )}
        <h2
          style={{
            margin: 0,
            fontSize: isSubmunicipality ? '20px' : '24px',
            fontWeight: '700',
            color: '#111827',
            letterSpacing: '-0.5px',
          }}
        >
          {safety.level.emoji} {region.name}
        </h2>
      </div>

      {/* 🌟 안전 지수 메인 카드 */}
      <div
        style={{
          background: `linear-gradient(135deg, ${safety.level.color}15, ${safety.level.color}05)`,
          border: `2px solid ${safety.level.color}33`,
          padding: '20px',
          borderRadius: '14px',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
          안전 지수
        </div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: '800',
            color: safety.level.color,
            lineHeight: '1',
            letterSpacing: '-2px',
          }}
        >
          {safety.score}
          <span style={{ fontSize: '20px', color: '#9ca3af', marginLeft: '4px', fontWeight: '600' }}>
            / 10
          </span>
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '4px 12px',
            background: safety.level.color,
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
          }}
        >
          {safety.level.label}
        </div>
        <div style={{ fontSize: '13px', color: '#374151', marginTop: '10px', fontWeight: '500' }}>
          {safety.level.description}
        </div>
      </div>

      {/* 시민 안내 박스 */}
      <div
        style={{
          background: '#fefce8',
          border: '1px solid #fde047',
          padding: '12px',
          borderRadius: '10px',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '700', marginBottom: '6px' }}>
          👤 시민 안내
        </div>
        <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: '1.5' }}>
          {safety.level.civicMessage}
        </div>
        {/* 지역별 추가 정보 */}
        <div style={{
          fontSize: '12px',
          color: '#78350f',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px dashed #fde047',
          lineHeight: '1.5',
        }}>
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
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #93c5fd',
          padding: '12px',
          borderRadius: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '700', marginBottom: '6px' }}>
          🏛️ 공공기관용 분석
        </div>
        <div style={{ fontSize: '13px', color: '#1f2937', lineHeight: '1.5' }}>
          {safety.level.officialMessage}
        </div>
        {/* 지역별 정밀 데이터 */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginTop: '8px',
          borderTop: '1px solid #dbeafe',
          paddingTop: '8px',
          lineHeight: '1.7',
        }}>
          <div>• 침하 속도: <strong style={{ color: '#1f2937' }}>{region.velocity} mm/year</strong></div>
          <div>• 안전 지수: <strong style={{ color: '#1f2937' }}>{safety.score}/10</strong></div>
          <div>• 최종 갱신: {region.lastUpdated}</div>
          {region.parentRegion && <div>• 소속: {region.parentRegion}</div>}
        </div>
      </div>

      {/* 특별 사유 (읍·면·동만) */}
      {isSubmunicipality && region.reason && (
        <div
          style={{
            background: `${safety.level.color}11`,
            border: `1px solid ${safety.level.color}44`,
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
            📍 지질학적 요인
          </div>
          <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>
            {region.reason}
          </div>
        </div>
      )}

      {/* 그래프 */}
      {months.length > 0 && (
        <div
          style={{
            height: isSubmunicipality ? '180px' : '220px',
            marginBottom: '12px',
          }}
        >
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* 읍·면·동이면 부모 시·군 안내 */}
      {isSubmunicipality && (
        <div
          style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#6b7280',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          💡 시·군 단위 종합 분석은 줌아웃 후 마커 클릭
        </div>
      )}
    </div>
  )
}

export default SidePanel