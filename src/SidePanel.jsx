import { useMemo } from 'react'
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
  if (!region) return null

  const isSubmunicipality = !!region.parentRegion

  // 안전 지수 + 시민용 설명
  const safety = useMemo(() => getSafetyIndex(region.velocity), [region.velocity])
  const civic = useMemo(() => getCivicExplanation(region.velocity), [region.velocity])

  // 시계열 데이터
  const timeSeriesData = useMemo(() => {
    const result = generateTimeSeries(region.velocity, region.id || region.name)
    return Array.isArray(result) ? result : (result?.data ? result : { months: [], data: [] })
  }, [region])

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
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '380px',
        maxHeight: 'calc(100vh - 40px)',
        background: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        borderRadius: '16px',
        transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        border: isSubmunicipality ? '2px solid #f3f4f6' : 'none',
      }}
    >
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
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', borderTop: '1px solid #dbeafe', paddingTop: '8px' }}>
          기술 데이터: 침하 속도 <strong>{region.velocity} mm/year</strong> · 최종 갱신 {region.lastUpdated}
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