import { gangwonRegions, getSafetyIndex } from './regions'
import * as XLSX from 'xlsx'

function Dashboard({ onNavigate }) {
  // 침하 심한 순 정렬 (velocity 작을수록 = 더 많이 가라앉음 = 위험)
  const ranked = [...gangwonRegions].sort((a, b) => a.velocity - b.velocity)

  // 등급별 권장 조치 (다운로드/표 공용)
  const actionOf = (score) => {
    if (score < 2) return '긴급 정밀진단'
    if (score < 4) return '정밀진단 권장'
    if (score < 6) return '정기 점검'
    return '모니터링 유지'
  }

  // .xlsx 다운로드
  const handleDownload = () => {
    // 표 데이터를 배열로 구성
    const rows = ranked.map((r, i) => {
      const safety = getSafetyIndex(r.velocity)
      return {
        '순위': i + 1,
        '지역': r.name,
        '안전지수(0~10)': safety.score,
        '침하속도(mm/year)': r.velocity,
        '위험등급': safety.level.label,
        '권장조치': actionOf(safety.score),
        '최종갱신': r.lastUpdated,
      }
    })

    // 맨 위에 안내 행 추가
    const header = [
      ['강원도 지반침하 점검 우선순위 (시연용 샘플 데이터)'],
      ['※ 위성 InSAR 광역 침하 분석 기반 스크리닝 결과 / 정밀진단은 현장조사 필요'],
      [`생성일: ${new Date().toLocaleDateString('ko-KR')}`],
      [], // 빈 줄
    ]

    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(header)
    XLSX.utils.sheet_add_json(ws, rows, { origin: -1 }) // 안내 아래에 표 붙이기

    // 열 너비 보기 좋게
    ws['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 14 }, { wch: 18 },
      { wch: 10 }, { wch: 14 }, { wch: 12 },
    ]

    // 워크북 만들고 다운로드
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '점검우선순위')
    XLSX.writeFile(wb, `강원도_점검우선순위_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // 요약 통계
  const counts = { danger: 0, warning: 0, caution: 0, safe: 0 }
  gangwonRegions.forEach((r) => {
    const s = getSafetyIndex(r.velocity).score
    if (s < 2) counts.danger++
    else if (s < 4) counts.warning++
    else if (s < 6) counts.caution++
    else counts.safe++
  })

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        paddingTop: '80px',
        paddingBottom: '40px',
        boxSizing: 'border-box',
        background: '#f9fafb',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        {/* 헤더 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🏛️</span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
              공공기관용 — 점검 우선순위
            </h1>
          </div>
          <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '5px 12px', borderRadius: '8px', fontWeight: '600' }}>
            시연용 샘플 데이터
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px' }}>
          강원도 18개 시·군 · 침하 심한 순 정렬 · 위성 InSAR 광역 분석 기반
        </p>

        {/* 요약 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <SummaryCard label="전체" value={gangwonRegions.length} color="#111827" />
          <SummaryCard label="🔴 위험" value={counts.danger} color="#dc2626" />
          <SummaryCard label="🟠 경고" value={counts.warning} color="#ea580c" />
          <SummaryCard label="🟡 주의" value={counts.caution} color="#ca8a04" />
        </div>

        {/* 다운로드 버튼 (다음 단계에서 기능 연결) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            onClick={handleDownload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            📥 .xlsx 다운로드
          </button>
        </div>

        {/* 우선순위 표 */}
        <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left', color: '#374151' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>순위</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>지역</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>안전지수</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>침하속도</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>등급</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>권장 조치</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const safety = getSafetyIndex(r.velocity)
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: i < 3 ? '#dc2626' : '#9ca3af' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827' }}>{r.name}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: safety.level.color }}>
                      {safety.score}
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>/10</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{r.velocity} mm/yr</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${safety.level.color}22`, color: safety.level.color, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                        {safety.level.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{actionOf(safety.score)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 하단 안내 + 돌아가기 */}
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px', lineHeight: '1.6' }}>
          ※ 본 우선순위는 위성 InSAR 광역 침하 분석 기반의 스크리닝 결과이며, 정밀 조사 대상 선정을 위한 참고 자료입니다.
          실제 정밀 진단은 GPR 등 현장 조사를 통해 수행됩니다.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          style={{
            marginTop: '16px',
            background: 'none',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ← 처음으로
        </button>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: '800', color: color, letterSpacing: '-0.5px' }}>{value}</div>
    </div>
  )
}

export default Dashboard