import { useState } from 'react'
import { gangwonRegions, getGSIBreakdown } from './regions'
import * as XLSX from 'xlsx'
import realSubmunicipalityData from './realSubmunicipalityData.json'

// ── 모듈 레벨: 읍면동 분위수 기반 등급 시스템 ──────────────────
// 185개 읍면동 GSI를 정렬 후 rank 기반으로 5% / 15% / 40% 경계 계산
const _sortedGSIs = Object.values(realSubmunicipalityData)
  .map((r) => r.gsi)
  .sort((a, b) => a - b)
const _n  = _sortedGSIs.length               // 185
const _I5  = Math.floor(_n * 0.05)           // 9
const _I15 = Math.floor(_n * 0.15)           // 27
const _I40 = Math.floor(_n * 0.40)           // 74

// 분위수 기반 카운트 (rank 기반 → 타이 문제 없이 정확)
const QUANTILE_COUNTS = {
  danger:   _I5,                // 9
  gyeonggye: _I15 - _I5,       // 18
  juui:     _I40 - _I15,       // 47
  anjeong:  _n   - _I40,       // 111
}

// rank 경계의 실제 GSI 임계값
const _Q5  = _sortedGSIs[_I5]   // 1.60
const _Q15 = _sortedGSIs[_I15]  // 2.10
const _Q40 = _sortedGSIs[_I40]  // 3.30

// 개별 항목 등급 함수 (getRFGrade 대체)
function getQuantileGrade(gsi) {
  if (gsi < _Q5)  return { label: '위험', color: '#dc2626', emoji: '🔴' }
  if (gsi < _Q15) return { label: '경계', color: '#ea580c', emoji: '🟠' }
  if (gsi < _Q40) return { label: '주의', color: '#ca8a04', emoji: '🟡' }
  return            { label: '안정', color: '#16a34a', emoji: '🟢' }
}
// ───────────────────────────────────────────────────────────────

function Dashboard({ onNavigate }) {
  // GSI 낮은 순(위험한 순) 정렬
  const ranked = [...gangwonRegions].sort((a, b) => getGSIBreakdown(a).gsi - getGSIBreakdown(b).gsi)

  const [selected, setSelected] = useState(ranked[0])

  const actionOf = (gsi) => {
    if (gsi < _Q5)  return '긴급 정밀진단'
    if (gsi < _Q15) return '정밀진단 권장'
    if (gsi < _Q40) return '정기 점검'
    return '모니터링 유지'
  }

  // .xlsx 다운로드 (시군 우선순위 목록)
  const handleDownload = () => {
    const rows = ranked.map((r, i) => {
      const bd    = getGSIBreakdown(r)
      const grade = getQuantileGrade(bd.gsi)
      return {
        '순위': i + 1,
        '지역': r.name,
        'GSI(0~10)': bd.gsi,
        '연간변위속도(mm/yr)': bd.raw.velocity,
        '변위방향': bd.raw.velocity < 0 ? '침하' : bd.raw.velocity > 0 ? '융기' : '안정',
        '인프라근접도(%)': Math.round(bd.raw.infra * 100),
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
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>
          강원도 18개 시·군 · GSI 낮은 순(위험) 정렬 · 위성 InSAR 광역 분석 기반
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>
          등급 기준: 읍면동 185개 분위수 — 위험 하위 5% / 경계 5~15% / 주의 15~40% / 안정 40%+
        </p>

        {/* 요약 카드 — 읍면동 185개 rank 기반 분위수 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <SummaryCard label="🔴 위험" value={QUANTILE_COUNTS.danger}   sub={`GSI < ${_Q5}`}  color="#dc2626" />
          <SummaryCard label="🟠 경계" value={QUANTILE_COUNTS.gyeonggye} sub={`${_Q5}~${_Q15}`} color="#ea580c" />
          <SummaryCard label="🟡 주의" value={QUANTILE_COUNTS.juui}      sub={`${_Q15}~${_Q40}`} color="#ca8a04" />
          <SummaryCard label="🟢 안정" value={QUANTILE_COUNTS.anjeong}   sub={`GSI ≥ ${_Q40}`} color="#16a34a" />
        </div>

        {/* 다운로드 */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '12px', flexWrap: 'wrap' }}>
          <a
            href="/gsi_danger_pixels.xlsx"
            download="gsi_danger_pixels.xlsx"
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: '2px', background: '#16a34a', color: 'white',
              padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: '700' }}>📊 위험 픽셀 데이터 (.xlsx)</span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>위험등급 384,034개 픽셀 좌표/GSI/변위속도 포함</span>
          </a>
          <a
            href="/gsi_heatmap.png"
            download="gsi_heatmap.png"
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: '2px', background: '#1e40af', color: 'white',
              padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: '700' }}>🗺️ GSI 히트맵 이미지 (.png)</span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>픽셀 단위 위험도 시각화, GIS 소프트웨어 호환</span>
          </a>
        </div>

        {/* 메인: 좌측 목록 + 우측 상세 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px', alignItems: 'start' }}>
          {/* 좌측: 시군 순위 목록 */}
          <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', fontWeight: '700', fontSize: '14px', color: '#374151' }}>
              위험 지점 순위 (클릭하면 상세 분석)
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {ranked.map((r, i) => {
                const bd    = getGSIBreakdown(r)
                const grade = getQuantileGrade(bd.gsi)
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
                    <span style={{ fontSize: '11px', fontWeight: '600', color: grade.color,
                      background: `${grade.color}15`, padding: '2px 6px', borderRadius: '4px' }}>
                      {grade.emoji} {grade.label}
                    </span>
                    <span style={{ fontWeight: '700', color: grade.color, minWidth: '36px', textAlign: 'right' }}>
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

function SummaryCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '26px', fontWeight: '800', color: color, letterSpacing: '-0.5px' }}>{value}</span>
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>읍면동</span>
      </div>
      {sub && <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '2px' }}>GSI {sub}</div>}
    </div>
  )
}

function DetailPanel({ region, actionOf }) {
  if (!region) return null
  const bd    = getGSIBreakdown(region)
  const grade = getQuantileGrade(bd.gsi)

  const velDir   = bd.raw.velocity < 0 ? '침하' : bd.raw.velocity > 0 ? '융기' : '안정'
  const velColor = bd.raw.velocity < 0 ? '#dc2626' : bd.raw.velocity > 0 ? '#2563eb' : '#16a34a'

  const dataRows = [
    {
      label: '연간 변위 속도',
      value: `${bd.raw.velocity} mm/yr`,
      tag: velDir,
      tagColor: velColor,
    },
    {
      label: '인프라 근접도',
      value: `${Math.round(bd.raw.infra * 100)}%`,
      tag: null,
    },
    {
      label: '데이터 신뢰도',
      value: '측정 중',
      tag: 'Phase 2 예정',
      tagColor: '#9ca3af',
    },
  ]

  return (
    <div style={{ background: 'white', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '20px', position: 'sticky', top: '80px' }}>
      {/* 헤더 */}
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
        {grade.emoji} {region.name}
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        GSI <strong style={{ color: grade.color, fontSize: '16px' }}>{bd.gsi}</strong> / 10
        <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
        분위수 등급 <strong style={{ color: grade.color }}>{grade.emoji} {grade.label}</strong>
      </div>

      {/* 실측 데이터 */}
      <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
          📊 실측 데이터
        </div>
        {dataRows.map(({ label, value, tag, tagColor }) => (
          <div
            key={label}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid #f3f4f6',
            }}
          >
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{value}</span>
              {tag && (
                <span style={{
                  fontSize: '11px', fontWeight: '600', color: tagColor,
                  background: `${tagColor}18`, padding: '2px 7px', borderRadius: '4px',
                }}>
                  {tag}
                </span>
              )}
            </span>
          </div>
        ))}
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
          GSI 산정: 강원도 250만 픽셀 분위수 기반
        </div>
      </div>

      {/* 권장 조치 */}
      <div style={{ background: `${grade.color}11`, border: `1px solid ${grade.color}33`, borderRadius: '10px', padding: '12px 14px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>권장 조치</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: grade.color }}>{actionOf(bd.gsi)}</div>
      </div>
    </div>
  )
}

export default Dashboard
