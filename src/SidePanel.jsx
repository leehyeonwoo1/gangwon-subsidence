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

// Chart.js에 필요한 부품들 등록 (한 번만 해주면 됨)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function SidePanel({ region, onClose, isChatOpen  }) {
  // 선택된 지역 없으면 패널 숨김
  if (!region) return null

  const risk = getRiskLevel(region.velocity)
  const timeSeries = generateTimeSeries(region.velocity)

  // Chart.js 데이터 형식
  const chartData = {
    labels: timeSeries.months,
    datasets: [
      {
        label: '누적 침하량 (mm)',
        data: timeSeries.data,
        borderColor: risk.color,
        backgroundColor: risk.color + '33', // 투명도 추가
        tension: 0.3, // 선을 부드럽게
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  // 그래프 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} mm`,
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: '침하량 (mm)' },
        reverse: true, // 침하는 음수니까 위아래 뒤집기
      },
      x: {
        title: { display: true, text: '월' },
      },
    },
  }

  return (
  <div
    className="side-panel"
    style={{
      position: 'absolute',
      top: '20px',
      right: isChatOpen ? '420px' : '20px',
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
          fontSize: '24px',
          cursor: 'pointer',
          color: '#666',
        }}
      >
        ×
      </button>

      {/* 헤더 */}
      <h2 style={{ margin: '0 0 4px 0' }}>
        {risk.emoji} {region.name}
      </h2>
      <div
        style={{
          color: risk.color,
          fontWeight: 'bold',
          marginBottom: '20px',
        }}
      >
        {risk.grade} 등급
      </div>

      {/* 핵심 지표 */}
      <div
        style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#666' }}>현재 침하 속도</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: risk.color }}>
          {region.velocity} <span style={{ fontSize: '14px' }}>mm/year</span>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          최종 갱신: {region.lastUpdated}
        </div>
      </div>

      {/* 시계열 그래프 */}
      <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
        📈 최근 12개월 침하 추세
      </div>
      <div style={{ height: '280px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* 분석 코멘트 */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px',
          background: risk.color + '15',
          borderLeft: `4px solid ${risk.color}`,
          fontSize: '13px',
          lineHeight: '1.5',
        }}
      >
        <strong>분석:</strong>{' '}
        {region.velocity <= -10
          ? '연간 10mm 이상의 빠른 침하가 관측됩니다. 정밀 모니터링이 필요합니다.'
          : region.velocity <= -5
          ? '경고 수준의 침하가 진행 중입니다. 지속 관찰이 필요합니다.'
          : region.velocity <= -2
          ? '경미한 침하가 관측되나 안정 범위 내에 있습니다.'
          : '안정적인 지반 상태를 유지하고 있습니다.'}
      </div>
    </div>
  )
}

export default SidePanel