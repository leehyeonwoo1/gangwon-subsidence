import { useState } from 'react'
import { gangwonRegions, getGSIBreakdown, getRFGrade } from './regions'
import * as XLSX from 'xlsx'

function Dashboard({ onNavigate }) {
  // GSI 낮은 순(위험한 순) 정렬 — 화면 점수와 순위 일치
  const ranked = [...gangwonRegions].sort((a, b) => getGSIBreakdown(a).gsi - getGSIBreakdown(b).gsi)

  // 선택된 지역 (기본: 1순위)
  const [selected, setSelected] = useState(ranked[0])

  // GSI 등급별 권장 조치
  const actionOf = (gsi) => {
    if (gsi < 4) return '긴급 정밀진단'
    if (gsi < 6) return '정밀진단 권장'
    if (gsi < 8) return '정기 점검'
    return '모니터링 유지'
  }

  // 요약 통계 — 멘토 2-4 등급 기준(GSI): 8+ 안정 / 6~8 주의 / 4~6 경계 / 4미만 위험
  const counts = { danger: 0, gyeonggye: 0, juui: 0, anjeong: 0 }
  gangwonRegions.forEach((r) => {
    const g = getGSIBreakdown(r).gsi
    if (g < 4) counts.danger++
    else if (g < 6) counts.gyeonggye++
    else if (g < 8) counts.juui++
    else counts.anjeong++
  })

  // .xlsx 다운로드
  const handleDownload = () => {
    const rows = ranked.map((r, i) => {
      const bd = getGSIBreakdown(r)
      const grade = getRFGrade(bd.gsi)
      return {
        '순위': i + 1,
        '지역': r.name,
        'GSI(0~10)': bd.gsi,
        '수직변위(mm/year)': r.velocity,
        '가속도(mm/yr²)': bd.raw.acceleration,
        '신호신뢰도': bd.raw.coherence,
        '산사태근접도': bd.raw.landslideProximity,
        '등급': grade.label,
        '권장조치': actionOf(bd.gsi),
        '최종갱신': r.lastUpdated,
      }
    })
    const header = [
      ['강원도 지반침하 점검 우선순위 (시연용 샘플 데이터)'],
      ['※ 위성 InSAR 광역 침하 분석 기반 스크리닝 결과 / 정밀진단은 현장조사 필요'],
      [`생성일: ${new Date().toLocaleDateString('ko-KR')}`],
      [],
    ]
    const ws = XLSX.utils.aoa_to_sheet(header)
    XLSX.utils.sheet_add_json(ws, rows, { origin: -1 })
    ws['!cols'] = [
      { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '점검우선순위')
    XLSX.writeFile(wb, `강원도_점검우선순위_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        {/* 헤더 */}
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
          강원도 18개 시·군 · GSI 낮은 순(위험) 정렬 · 위성 InSAR 광역 분석 기반
        </p>

        {/* 요약 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <SummaryCard label="🔴 위험" value={counts.danger} color="#dc2626" />
          <SummaryCard label="🟠 경계" value={counts.gyeonggye} color="#ea580c" />
          <SummaryCard label="🟡 주의" value={counts.juui} color="#ca8a04" />
          <SummaryCard label="🟢 안정" value={counts.anjeong} color="#16a34a" />
        </div>

        {/* 다운로드 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            onClick={handleDownload}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#16a34a', color: 'white', border: 'none',
              padding: '10px 18px', borderRadius: '8px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer',
            }}
          >
            📥 .xlsx 다운로드
          </button>
        </div>

        {/* 메인: 좌측 목록 + 우측 상세 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px', alignItems: 'start' }}>
          {/* 좌측: Top-N 목록 */}
          <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: '700', fontSize: '14px', color: '#374151' }}>
              위험 지점 순위 (클릭하면 상세 분석)
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {ranked.map((r, i) => {
                const bd = getGSIBreakdown(r)
                const grade = getRFGrade(bd.gsi)
                const isSelected = selected?.id === r.id
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelected(r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px', cursor: 'pointer',
                      borderBottom: '1px solid #f9fafb',
                      background: isSelected ? '#eff6ff' : 'white',
                      borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: '700', color: i < 3 ? '#dc2626' : '#9ca3af', minWidth: '24px' }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontWeight: '600', color: '#111827' }}>{r.name}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{r.velocity} mm/yr</span>
                    <span style={{ fontWeight: '700', color: grade.color, minWidth: '40px', textAlign: 'right' }}>
                      {bd.gsi}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 우측: 상세 패널 */}
          <DetailPanel region={selected} actionOf={actionOf} />
        </div>

        {/* 하단 안내 + 돌아가기 */}
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px', lineHeight: '1.6' }}>
          ※ 본 우선순위는 위성 InSAR 광역 침하 분석 기반의 스크리닝 결과이며, 정밀 조사 대상 선정을 위한 참고 자료입니다.
          실제 정밀 진단은 GPR 등 현장 조사를 통해 수행됩니다.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          style={{
            marginTop: '16px', background: 'none', color: '#6b7280',
            border: '1px solid #e5e7eb', padding: '10px 20px', borderRadius: '8px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
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

// 우측 상세 패널 — GSI 분해 + 근거 (멘토 2-5 "왜 이 등급인가")
function DetailPanel({ region, actionOf }) {
  if (!region) return null
  const bd = getGSIBreakdown(region)
  const grade = getRFGrade(bd.gsi)

  return (
    <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '20px', position: 'sticky', top: '80px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#111827' }}>
          {grade.emoji} {region.name}
        </div>
        {bd.lowConfidence && (
          <span style={{ fontSize: '11px', background: '#fef9c3', color: '#854d0e', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
            ⚠️ 신호 불안정
          </span>
        )}
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        GSI <strong style={{ color: grade.color, fontSize: '16px' }}>{bd.gsi}</strong> / 10 · {grade.label}
        <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
        AI 등급 <strong style={{ color: grade.color }}>{grade.emoji} {grade.label}</strong>
      </div>

      {/* GSI 점수 분해 막대 */}
      <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
          📊 위험도 기여 분석 <span style={{ fontWeight: '500', color: '#9ca3af' }}>(왜 이 점수인가)</span>
        </div>
        {bd.contributions.map((c) => (
          <div key={c.key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
              <span style={{ color: '#374151', fontWeight: '600' }}>
                {c.label}
                <span style={{ color: '#9ca3af', fontWeight: '400', marginLeft: '4px' }}>가중치 {(c.weight * 100).toFixed(0)}%</span>
              </span>
              <span style={{ color: '#6b7280' }}>{c.raw}</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                width: `${c.fill * 100}%`,
                height: '100%',
                background: c.key === 'velocity' ? '#dc2626'
                  : c.key === 'acceleration' ? '#ea580c'
                  : c.key === 'coherence' ? '#0891b2'
                  : '#7c3aed',
                borderRadius: '4px',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e5e7eb' }}>
          GSI = 10 × (1 − 위험도 가중합) = <strong style={{ color: grade.color }}>{bd.gsi}</strong>
        </div>
      </div>

      {/* 판단 근거 */}
      <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>📋 판단 근거</div>
        <div>• {bd.raw.velocity < 0 ? '침하' : bd.raw.velocity > 0 ? '융기' : '변위'} 속도: <strong>{bd.raw.velocity} mm/yr</strong></div>
        <div>• 변위 가속도: <strong>{bd.raw.acceleration} mm/yr²</strong> <span style={{ fontSize: '11px', color: '#9ca3af' }}>({bd.raw.acceleration > 0 ? '가속 중' : bd.raw.acceleration < 0 ? '감속 중' : '일정'})</span></div>
        <div>• 신호 신뢰도: <strong>{bd.raw.coherence}</strong> {bd.lowConfidence && <span style={{ color: '#ca8a04' }}>(낮음)</span>}</div>
        <div>• 산사태 근접도: <strong>{(bd.raw.landslideProximity * 100).toFixed(0)}%</strong></div>
      </div>

      {/* 권장 조치 */}
      <div style={{ marginTop: '14px', background: `${grade.color}11`, border: `1px solid ${grade.color}33`, borderRadius: '10px', padding: '12px 14px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>권장 조치</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: grade.color }}>{actionOf(bd.gsi)}</div>
      </div>
    </div>
  )
}

export default Dashboard