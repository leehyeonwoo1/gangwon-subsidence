function Header({ currentPage, onNavigate }) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      {/* 로고 */}
      <div
        onClick={() => onNavigate('landing')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '24px' }}>🛰️</span>
        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '700',
              color: '#111827',
              letterSpacing: '-0.3px',
              lineHeight: '1.1',
            }}
          >
            강원도 지반침하 모니터링
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#6b7280',
              fontWeight: '500',
              marginTop: '2px',
            }}
          >
            Sentinel-1 SAR · InSAR 분석
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          onClick={() => onNavigate('landing')}
          style={{
            background: currentPage === 'landing' ? '#eff6ff' : 'transparent',
            color: currentPage === 'landing' ? '#1e40af' : '#374151',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          홈
        </button>
        <button
          onClick={() => onNavigate('map')}
          style={{
            background: currentPage === 'map' 
              ? 'linear-gradient(135deg, #1e40af, #3b82f6)' 
              : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
          }}
        >
          지도 보기 →
        </button>
      </nav>
    </header>
  )
}

export default Header