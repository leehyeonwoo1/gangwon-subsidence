import { gangwonRegions, getSafetyIndex } from './regions'

function LandingPage({ onStart }) {
  // 통계 계산
  const stats = {
    total: gangwonRegions.length,
    safe: gangwonRegions.filter(r => getSafetyIndex(r.velocity).score >= 6).length,
    warning: gangwonRegions.filter(r => {
      const s = getSafetyIndex(r.velocity).score
      return s >= 2 && s < 6
    }).length,
    danger: gangwonRegions.filter(r => getSafetyIndex(r.velocity).score < 2).length,
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'white',
        paddingTop: '60px',
        boxSizing: 'border-box',
      }}
    >
      {/* ============ Section 1: HERO ============ */}
      <section
        style={{
          minHeight: 'calc(100vh - 60px)',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #ecfdf5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1), transparent)',
            borderRadius: '50%',
          }}
        />

        <div
          style={{
            maxWidth: '900px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* 배지 */}
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#1e40af',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '24px',
              letterSpacing: '0.5px',
            }}
          >
            🛰️ POWERED BY SENTINEL-1 SAR · AI
          </div>

          {/* 메인 헤드라인 */}
          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 60px)',
              fontWeight: '800',
              color: '#111827',
              letterSpacing: '-2px',
              lineHeight: '1.1',
              marginBottom: '24px',
            }}
          >
            내 동네 땅,<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #1e40af, #3b82f6, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              정말 안전한가요?
            </span>
          </h1>

          {/* 서브 헤드라인 */}
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: '#4b5563',
              lineHeight: '1.6',
              marginBottom: '40px',
              fontWeight: '500',
              maxWidth: '700px',
              margin: '0 auto 40px',
            }}
          >
            위성 데이터로 강원도 18개 시·군과 188개 읍·면·동의<br />
            지반 침하 위험도를 0~10점으로 한눈에 확인하세요.
          </p>

          {/* 목적 선택 안내 */}
          <div style={{ fontSize: '15px', color: '#6b7280', fontWeight: '600', marginBottom: '16px' }}>
            어떤 목적으로 오셨나요?
          </div>

          {/* CTA 버튼 - 공공기관용 / 시민용 두 갈래 */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* 공공기관용 */}
            <button
              onClick={() => onStart('dashboard')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
                color: 'white',
                border: 'none',
                padding: '24px 32px',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(30, 64, 175, 0.35)',
                transition: 'all 0.2s',
                minWidth: '200px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 14px 30px rgba(30, 64, 175, 0.45)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 64, 175, 0.35)'
              }}
            >
              <span style={{ fontSize: '32px' }}>🏛️</span>
              <span style={{ fontSize: '17px', fontWeight: '700' }}>공공기관용</span>
              <span style={{ fontSize: '13px', opacity: 0.85, fontWeight: '500' }}>점검 우선순위 받기</span>
            </button>

            {/* 시민용 */}
            <button
              onClick={() => onStart('map')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: 'white',
                border: 'none',
                padding: '24px 32px',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s',
                minWidth: '200px',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 14px 30px rgba(16, 185, 129, 0.45)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.35)'
              }}
            >
              <span style={{ fontSize: '32px' }}>👤</span>
              <span style={{ fontSize: '17px', fontWeight: '700' }}>시민용</span>
              <span style={{ fontSize: '13px', opacity: 0.85, fontWeight: '500' }}>우리 동네 안전 확인</span>
            </button>
          </div>

          {/* 어떻게 작동해 - 작은 링크로 */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                background: 'none',
                color: '#6b7280',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              어떻게 작동하나요?
            </button>
          </div>

          {/* 통계 */}
          <div
            style={{
              marginTop: '60px',
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              flexWrap: 'wrap',
            }}
          >
            <Stat number={stats.total} label="개 시·군 모니터링" color="#1e40af" />
            <Stat number="188" label="개 읍·면·동 분석" color="#059669" />
            <Stat number="24/7" label="위성 감시" color="#dc2626" />
          </div>

          {/* 스크롤 안내 */}
          <div
            style={{
              marginTop: '60px',
              color: '#9ca3af',
              fontSize: '13px',
              animation: 'bounce 2s infinite',
            }}
          >
            ↓ 자세히 알아보기
          </div>
        </div>
      </section>

      {/* ============ Section 2: 문제 인식 ============ */}
      <section
        style={{
          padding: '100px 20px',
          background: '#fafafa',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel color="#dc2626">⚠️ 우리가 직면한 문제</SectionLabel>
          <SectionTitle>
            매년 우리 발 밑이<br />무너지고 있습니다
          </SectionTitle>
          
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginTop: '50px',
            }}
          >
            <ProblemCard
              emoji="🌉"
              title="정자교 붕괴 (2023)"
              description="갑작스러운 도로 함몰로 1명 사망, 1명 부상. 노후 인프라의 위험성이 드러난 사고였습니다."
            />
            <ProblemCard
              emoji="🕳️"
              title="매년 200건 이상 싱크홀"
              description="국토부 통계에 따르면 한국에서 매년 수백 건의 지반 함몰이 발생하고 있습니다."
            />
            <ProblemCard
              emoji="⛏️"
              title="강원도 폐광 지역"
              description="태백, 정선 등 과거 탄광 지역에서는 지반 안정화가 여전히 진행 중입니다."
            />
          </div>
        </div>
      </section>

      {/* ============ Section 3: 솔루션 ============ */}
      <section
        style={{
          padding: '100px 20px',
          background: 'white',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel color="#1e40af">🛰️ 솔루션</SectionLabel>
          <SectionTitle>
            위성으로 24시간<br />땅을 감시합니다
          </SectionTitle>
          <p
            style={{
              fontSize: '17px',
              color: '#6b7280',
              marginTop: '20px',
              lineHeight: '1.6',
              maxWidth: '700px',
              margin: '20px auto 0',
            }}
          >
            유럽우주국의 Sentinel-1 위성이 강원도 전역을 mm 단위로 측정합니다.<br />
            InSAR 분석으로 보이지 않는 지반 변화를 감지합니다.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
              marginTop: '60px',
            }}
          >
            <SolutionCard
              icon="🛰️"
              title="Sentinel-1 위성"
              description="유럽우주국의 SAR 위성이 12일 주기로 강원도를 정밀 스캔합니다."
            />
            <SolutionCard
              icon="🔬"
              title="InSAR 분석"
              description="간섭 합성개구레이더 기법으로 mm 단위 지표 변화를 감지합니다."
            />
            <SolutionCard
              icon="🗺️"
              title="206개 지역 분석"
              description="18개 시·군과 188개 읍·면·동까지 세분화된 위험도를 제공합니다."
            />
            <SolutionCard
              icon="🤖"
              title="AI 안전 챗봇"
              description="어려운 전문 용어 대신 누구나 이해할 수 있는 친근한 설명을 제공합니다."
            />
          </div>
        </div>
      </section>

      {/* ============ Section 4: 사용법 ============ */}
      <section
        id="how-it-works"
        style={{
          padding: '100px 20px',
          background: 'linear-gradient(180deg, #f9fafb 0%, white 100%)',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel color="#059669">✅ 사용법</SectionLabel>
          <SectionTitle>3단계로 끝나요</SectionTitle>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
              marginTop: '50px',
            }}
          >
            <StepCard
              number="1"
              title="우리 동네 클릭"
              description="지도에서 본인 지역을 클릭하세요. 강원도 18개 시·군과 188개 읍·면·동을 지원합니다."
            />
            <StepCard
              number="2"
              title="안전 지수 확인"
              description="0~10점 안전 지수와 시민용 안내문을 한 번에 확인하세요. 높을수록 안전!"
            />
            <StepCard
              number="3"
              title="AI에게 물어보기"
              description='"우리 동네 어때?", "뭘 해야 해?" 자연스럽게 물어보세요.'
            />
          </div>
        </div>
      </section>

      {/* ============ Section 5: 신뢰성 ============ */}
      <section
        style={{
          padding: '100px 20px',
          background: '#f0f9ff',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel color="#1e40af">📚 학술 신뢰성</SectionLabel>
          <SectionTitle>
            세계 표준 기술<br />한국 시민에게
          </SectionTitle>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginTop: '50px',
            }}
          >
            <CredCard title="도쿄대학교" description="InSAR 지반침하 연구 인용" />
            <CredCard title="ESA Sentinel-1" description="유럽우주국 위성 데이터" />
            <CredCard title="국토안전관리원" description="공식 안전 가이드라인 준수" />
          </div>
        </div>
      </section>

      {/* ============ Section 6: GSI 상세 설명 ============ */}
      <section
        style={{
          padding: '100px 20px',
          background: 'white',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <SectionLabel color="#1e40af">📡 방법론</SectionLabel>
            <SectionTitle>
              강산지킴이 GSI<br />
              <span style={{ fontSize: '0.7em', color: '#4b5563', fontWeight: '600' }}>(지반안정지수)란?</span>
            </SectionTitle>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '20px',
            }}
          >
            {/* 측정 방법 */}
            <GsiCard
              color="#1e40af"
              bgColor="#eff6ff"
              icon="🛰️"
              title="측정 방법"
              items={[
                'Sentinel-1 SAR 위성 데이터(2022~2026, 4년치) SBAS-InSAR 기법으로 지표 변위 측정',
                '강원도 전역 250만 픽셀, 294개 간섭도 처리',
              ]}
            />

            {/* 등급 계산 방식 */}
            <GsiCard
              color="#059669"
              bgColor="#f0fdf4"
              icon="📊"
              title="등급 계산 방식"
              items={[
                '연간 지표 변위 속도(mm/yr)를 강원도 전체 95%ile 기준으로 정규화',
                '인프라 근접도(도로/건물) 가중치 적용',
                '안정(60%) / 주의(25%) / 경계(10%) / 위험(5%) 분위수 기반 등급화',
              ]}
            />

            {/* 검증 결과 */}
            <GsiCard
              color="#7c3aed"
              bgColor="#f5f3ff"
              icon="✅"
              title="검증 결과"
              items={[
                '실제 산사태 3건(봉평면, 용평면, 정선 피암터널) 검증 완료',
                '강원도 산사태 이력 143건 중 61.5% 통계적 유의 일치',
                '2023년 태풍 카눈 관련 이력 거의 100% 일치',
              ]}
            />

            {/* 데이터 한계 */}
            <GsiCard
              color="#d97706"
              bgColor="#fffbeb"
              icon="⚠️"
              title="데이터 한계"
              items={[
                '산림 80% 산악지형 특성상 절대 변위값보다 상대적 위험 순위가 신뢰도 높음',
                '초기 관측 기간(2022년) 데이터는 정밀도 제한적',
                'GNSS 보정은 Phase 2 예정',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ============ Section 7: 마지막 CTA ============ */}
      <section
        style={{
          padding: '100px 20px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          textAlign: 'center',
          color: 'white',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(30px, 4vw, 44px)',
              fontWeight: '800',
              letterSpacing: '-1px',
              marginBottom: '20px',
              lineHeight: '1.2',
            }}
          >
            우리 동네는 지금<br />얼마나 안전할까요?
          </h2>
          <p
            style={{
              fontSize: '17px',
              opacity: 0.9,
              marginBottom: '40px',
              lineHeight: '1.6',
            }}
          >
            클릭 한 번으로 확인하세요. 무료, 회원가입 불필요.
          </p>
          <button
            onClick={onStart}
            style={{
              background: 'white',
              color: '#1e40af',
              border: 'none',
              padding: '18px 44px',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
            }}
          >
            🗺️ 지도 보러 가기 →
          </button>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer
        style={{
          padding: '40px 20px',
          background: '#111827',
          color: '#9ca3af',
          textAlign: 'center',
          fontSize: '13px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '16px', color: 'white', fontWeight: '700', marginBottom: '12px' }}>
            🛰️ 강원도 지반침하 모니터링
          </div>
          <div style={{ marginBottom: '8px' }}>
            ⚠️ 본 시스템은 시연용 데이터로 작동하며, 실제 재난 대응은 공식 기관을 통해 진행해주세요.
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '16px' }}>
            국토안전관리원 1670-9090 · 강원도청 033-249-3500 · 응급 119
          </div>
        </div>
      </footer>
    </div>
  )
}

// === 헬퍼 컴포넌트들 ===

function Stat({ number, label, color }) {
  return (
    <div>
      <div
        style={{
          fontSize: '36px',
          fontWeight: '800',
          color: color,
          letterSpacing: '-1px',
          lineHeight: '1',
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: '#6b7280',
          marginTop: '6px',
          fontWeight: '500',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function SectionLabel({ children, color }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        background: `${color}15`,
        color: color,
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        marginBottom: '20px',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontSize: 'clamp(28px, 4vw, 44px)',
        fontWeight: '800',
        color: '#111827',
        letterSpacing: '-1.5px',
        lineHeight: '1.2',
      }}
    >
      {children}
    </h2>
  )
}

function ProblemCard({ emoji, title, description }) {
  return (
    <div
      style={{
        background: 'white',
        padding: '32px 24px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid #f3f4f6',
        textAlign: 'left',
        transition: 'all 0.3s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{emoji}</div>
      <h3
        style={{
          fontSize: '17px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
        {description}
      </p>
    </div>
  )
}

function SolutionCard({ icon, title, description }) {
  return (
    <div
      style={{
        padding: '28px 20px',
        background: 'linear-gradient(135deg, #f9fafb, white)',
        borderRadius: '16px',
        border: '1px solid #f3f4f6',
        textAlign: 'left',
        transition: 'all 0.3s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6'
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = '#f3f4f6'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
        {description}
      </p>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div
      style={{
        background: 'white',
        padding: '32px 24px',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        textAlign: 'left',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          fontSize: '48px',
          fontWeight: '800',
          color: '#f3f4f6',
          lineHeight: '1',
        }}
      >
        {number}
      </div>
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10b981, #34d399)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '800',
          marginBottom: '16px',
        }}
      >
        {number}
      </div>
      <h3
        style={{
          fontSize: '17px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
        {description}
      </p>
    </div>
  )
}

function CredCard({ title, description }) {
  return (
    <div
      style={{
        padding: '24px 20px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid #dbeafe',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e40af',
          marginBottom: '6px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
        {description}
      </div>
    </div>
  )
}

function GsiCard({ color, bgColor, icon, title, items }) {
  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${color}25`,
        borderRadius: '16px',
        padding: '28px 28px',
        transition: 'all 0.25s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}15`
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: color,
            margin: 0,
            letterSpacing: '-0.3px',
          }}
        >
          {title}
        </h3>
      </div>
      <ul style={{ margin: 0, padding: '0 0 0 18px', listStyle: 'none' }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.7',
              marginBottom: i < items.length - 1 ? '8px' : 0,
              paddingLeft: '4px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '-14px',
                color: color,
                fontWeight: '700',
              }}
            >
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default LandingPage