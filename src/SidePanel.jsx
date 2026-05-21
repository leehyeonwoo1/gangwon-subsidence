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
import { getRiskLevel, generateTimeSeries } from './regions'

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

  // 읍·면·동인지 시·군인지 판별
  const isSubmunicipality = !!region.parentRegion

  const risk = getRiskLevel(region.velocity)

  // 시계열 데이터 생성
  const timeSeriesData = useMemo(() => {
    return generateTimeSeries(region.velocity, region.id || region.name)
  }, [region])

  const chartData = {
    labels: timeSeriesData.map((d) => d.month),
    datasets: [
      {
        label: '침하량 (mm)',
        data: timeSeriesData.map((d) => d.displacement),
        borderColor: risk.color,
        backgroundColor: `${risk.color}33`,
        tension: 0.3,
        pointBackgroundColor: 'white',
        pointBorderColor: risk.color,
        pointRadius: isSubmunicipality ? 3 : 4,  // 읍·면·동은 점 살짝 작게
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
        text: isSubmunicipality ? '최근 12개월 침하 추세 (참고용)' : '최근 12개월 침하 추세',
        font: { size: isSubmunicipality ? 11 : 13, weight: '600' },
        color: '#374151',
      },
    },
    scales: {
      x: {
        title: { display: true, text: '월', font: { size: 10 } },
        grid: { display: false },
        ticks: { font: { size: 9 } },
      },
      y: {
        title: { display: true, text: '침하량 (mm)', font: { size: 10 } },
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 9 } },
        reverse: true,
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
        width: '360px',
        maxHeight: 'calc(100vh - 40px)',
        background: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        borderRadius: '16px',
        transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        // 읍·면·동일 때 살짝 다른 배경 (구분용)
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

      {/* 헤더 - 읍·면·동이면 부모 시·군도 표시 */}
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
          {risk.emoji} {region.name}
        </h2>
        <div
          style={{
            display: 'inline-block',
            marginTop: '8px',
            padding: '4px 10px',
            background: `${risk.color}22`,
            color: risk.color,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
          }}
        >
          {risk.grade} 등급
        </div>
      </div>

      {/* 침하 속도 */}
      <div
        style={{
          background: '#f9fafb',
          padding: '14px',
          borderRadius: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          현재 침하 속도
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: risk.color,
            letterSpacing: '-1px',
          }}
        >
          {region.velocity}
          <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '4px', fontWeight: '500' }}>
            mm/year
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
          최종 갱신: {region.lastUpdated}
        </div>
      </div>

      {/* 특별 사유 (읍·면·동만) */}
      {isSubmunicipality && region.reason && (
        <div
          style={{
            background: `${risk.color}11`,
            border: `1px solid ${risk.color}44`,
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
      <div
        style={{
          height: isSubmunicipality ? '180px' : '220px',
          marginBottom: '12px',
        }}
      >
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* 분석 멘트 */}
      <div
        style={{
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#374151',
          lineHeight: '1.6',
        }}
      >
        <strong>분석:</strong>{' '}
        {region.velocity <= -10
          ? '빠른 침하가 진행 중입니다. 정밀 조사 권장.'
          : region.velocity <= -5
          ? '경고 수준 침하. 지속 관찰이 필요합니다.'
          : region.velocity <= -2
          ? '경미한 침하가 관측되나 안정 범위 내에 있습니다.'
          : '안정적인 지반 상태를 유지하고 있습니다.'}
      </div>

      {/* 읍·면·동이면 부모 시·군 보기 안내 */}
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