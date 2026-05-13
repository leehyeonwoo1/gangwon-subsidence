import { useState, useRef, useEffect } from 'react'
import { gangwonRegions, getRiskLevel } from './regions'

function ChatBot({ isOpen, onClose, onRegionSelect }) {
  // 메시지 목록 상태
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '안녕하세요! 강원도 지반침하 모니터링 AI 어시스턴트입니다. 🛰️\n\n궁금한 점을 물어보세요. 예: "가장 위험한 지역은?" "태백시는 어때?"',
    },
  ])

  // 입력창 상태
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 메시지 영역 자동 스크롤
  const messagesEndRef = useRef(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 가짜 AI 응답 생성 함수
  const generateFakeResponse = (question) => {
    const q = question.toLowerCase()

    // 키워드 기반 응답 (간단한 패턴 매칭)
    if (q.includes('가장 위험') || q.includes('제일 위험') || q.includes('위험한 지역')) {
      const sorted = [...gangwonRegions].sort((a, b) => a.velocity - b.velocity)
      const top3 = sorted.slice(0, 3)
      return `현재 강원도에서 가장 위험한 지역 TOP 3입니다:\n\n` +
        top3.map((r, i) => {
          const risk = getRiskLevel(r.velocity)
          return `${i + 1}. ${risk.emoji} **${r.name}**: ${r.velocity} mm/year (${risk.grade})`
        }).join('\n') +
        `\n\n특히 ${top3[0].name}은(는) 연간 ${Math.abs(top3[0].velocity)}mm의 빠른 침하가 진행 중이라 정밀 모니터링이 필요합니다.`
    }

    if (q.includes('안전한 지역') || q.includes('안정')) {
      const sorted = [...gangwonRegions].sort((a, b) => b.velocity - a.velocity)
      const top3 = sorted.slice(0, 3)
      return `현재 강원도에서 가장 안정적인 지역입니다:\n\n` +
        top3.map((r, i) => `${i + 1}. 🟢 **${r.name}**: ${r.velocity} mm/year`).join('\n')
    }

    if (q.includes('전체') || q.includes('통계') || q.includes('얼마나')) {
      const dangerous = gangwonRegions.filter(r => r.velocity <= -10).length
      const warning = gangwonRegions.filter(r => r.velocity > -10 && r.velocity <= -5).length
      const caution = gangwonRegions.filter(r => r.velocity > -5 && r.velocity <= -2).length
      const safe = gangwonRegions.filter(r => r.velocity > -2).length
      return `강원도 18개 시·군의 지반침하 현황입니다:\n\n` +
        `🔴 위험: ${dangerous}개\n🟠 경고: ${warning}개\n🟡 주의: ${caution}개\n🟢 안전: ${safe}개\n\n` +
        `전체적으로 동남부(태백, 정선) 지역이 폐광 영향으로 침하가 두드러집니다.`
    }

    // 특정 지역 질문 처리
    const matchedRegion = gangwonRegions.find(r => question.includes(r.name.replace('시', '').replace('군', '')))
    if (matchedRegion) {
      const risk = getRiskLevel(matchedRegion.velocity)
      return `${risk.emoji} **${matchedRegion.name}** 분석 결과입니다:\n\n` +
        `• 위험 등급: **${risk.grade}**\n` +
        `• 침하 속도: ${matchedRegion.velocity} mm/year\n` +
        `• 최종 갱신: ${matchedRegion.lastUpdated}\n\n` +
        (matchedRegion.velocity <= -10
          ? `⚠️ 연간 10mm 이상의 빠른 침하가 관측됩니다. 정밀 모니터링이 필요합니다.`
          : matchedRegion.velocity <= -5
          ? `📊 경고 수준의 침하가 진행 중입니다. 지속 관찰이 필요합니다.`
          : matchedRegion.velocity <= -2
          ? `📈 경미한 침하가 관측되나 안정 범위 내에 있습니다.`
          : `✅ 안정적인 지반 상태를 유지하고 있습니다.`)
    }

    // 안녕/도움말
    if (q.includes('안녕') || q.includes('hi') || q.includes('hello')) {
      return '안녕하세요! 강원도 18개 시·군의 지반침하 데이터를 기반으로 답변드릴 수 있습니다. 🛰️'
    }

    if (q.includes('도움') || q.includes('뭐 할 수') || q.includes('할 수 있')) {
      return `다음과 같은 질문에 답변할 수 있어요:\n\n` +
        `• "가장 위험한 지역은?"\n` +
        `• "안정적인 지역은?"\n` +
        `• "춘천시는 어때?"\n` +
        `• "전체 통계 보여줘"\n` +
        `• 특정 시·군 이름 (예: "태백", "정선")`
    }

    // 기본 응답
    return `질문을 잘 이해하지 못했어요. 😅\n\n다음과 같이 물어봐 주세요:\n• "가장 위험한 지역은?"\n• "춘천시 침하 상태?"\n• "전체 통계"`
  }

  // 메시지 전송
  const handleSend = () => {
  if (!input.trim() || isLoading) return

  const userMessage = { role: 'user', content: input.trim() }
  setMessages((prev) => [...prev, userMessage])
  setInput('')
  setIsLoading(true)

  // 질문에서 언급된 지역 찾기 (지도 이동용)
  const mentionedRegion = gangwonRegions.find((r) =>
    userMessage.content.includes(r.name.replace('시', '').replace('군', ''))
  )

  // "가장 위험한" 질문이면 가장 위험한 지역 선택
  let regionToSelect = mentionedRegion
  if (
    userMessage.content.includes('가장 위험') ||
    userMessage.content.includes('제일 위험')
  ) {
    regionToSelect = [...gangwonRegions].sort((a, b) => a.velocity - b.velocity)[0]
  }

  setTimeout(() => {
    const aiResponse = {
      role: 'assistant',
      content: generateFakeResponse(userMessage.content),
    }
    setMessages((prev) => [...prev, aiResponse])
    setIsLoading(false)

    // 지도에서 해당 지역 선택 (사이드 패널 열림 + 지도 이동)
    if (regionToSelect && onRegionSelect) {
      onRegionSelect(regionToSelect)
    }
  }, 800)
}

  // Enter 키로 전송
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
  <div
    style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '380px',
      maxHeight: 'calc(100vh - 40px)',
      background: 'white',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      borderRadius: '16px',
      overflow: 'hidden',
    }}
  >
      {/* 헤더 */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          color: 'white',
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            🤖 AI 침하 분석 어시스턴트
          </div>
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
            Powered by Claude (예정)
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* 메시지 영역 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: '#f9fafb',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className="chat-message"
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#3b82f6' : 'white',
                color: msg.role === 'user' ? 'white' : '#1f2937',
                border: msg.role === 'assistant' ? '1px solid #e5e5e5' : 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'white',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                color: '#666',
              }}
            >
              <span style={{ display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}>
                💭 분석 중...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 질문 버튼 */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
        }}
      >
        {['가장 위험한 지역?', '전체 통계', '태백시 분석'].map((q) => (
          <button
            key={q}
            className="quick-question-btn"
            onClick={() => {
              setInput(q)
              setTimeout(() => handleSend(), 50)
            }}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: '#f3f4f6',
              border: '1px solid #e5e5e5',
              borderRadius: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: '#4b5563',
              fontWeight: '500',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* 입력 영역 */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          gap: '8px',
          background: 'white',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="궁금한 점을 물어보세요..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            padding: '10px 18px',
            background: input.trim() && !isLoading 
              ? 'linear-gradient(135deg, #1e40af, #3b82f6)' 
              : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          전송
        </button>
      </div>
    </div>
  )
}

export default ChatBot