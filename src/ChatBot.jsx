import { useState, useRef, useEffect } from 'react'
import { gangwonRegions, getSafetyIndex } from './regions'

const API_KEY = "AIzaSyBhviEdSHkit5GwQ443sCWWl32HXeQkSsE"

const SYSTEM_PROMPT = `당신은 강원도 지반안정 모니터링 서비스 강산지킴이의 AI 안내 도우미입니다.
- 답변은 3문장 이내, 짧고 명확하게
- 마크다운 형식 절대 금지 (**, *, ##, ---, ⚠️ 등)
- 안전 지수는 0~10점, 낮을수록 위험, 높을수록 안전
- 현재 선택된 지역 데이터 기반으로 구체적으로 답변
- 참고 자료임을 딱 한 번만 간단히 언급
- 친근하고 쉬운 말로`

function buildSystemWithContext(region) {
  if (!region) return SYSTEM_PROMPT
  const dir = region.velocity < 0 ? '침하' : region.velocity > 0 ? '융기' : '안정'
  const safety = getSafetyIndex(region.velocity)
  return (
    SYSTEM_PROMPT +
    `\n\n현재 사용자가 선택한 지역:\n지역명: ${region.name}\n연간 변위 속도: ${region.velocity} mm/yr (${dir})\n안전 지수: ${safety.score} / 10 (${safety.level.label})`
  )
}

function ChatBot({ isOpen, onClose, onRegionSelect, selectedRegion }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '안녕하세요! 강원도 지반침하 모니터링 AI 어시스턴트입니다. 🛰️\n\n궁금한 점을 물어보세요. 예: "가장 위험한 지역은?" "태백시는 어때?"',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim() }
    const next = [...messages, userMessage]
    setMessages(next)
    setInput('')
    setIsLoading(true)

    // 지도 확대 + contextRegion 동기화
    let contextRegion = selectedRegion
    if (onRegionSelect) {
      if (
        userMessage.content.includes('가장 위험') ||
        userMessage.content.includes('제일 위험') ||
        userMessage.content.includes('가장 조심') ||
        userMessage.content.includes('제일 조심')
      ) {
        const most = [...gangwonRegions].sort((a, b) => Math.abs(b.velocity) - Math.abs(a.velocity))[0]
        onRegionSelect(most)
        contextRegion = most
      } else {
        const mentioned = gangwonRegions.find((r) =>
          userMessage.content.includes(r.name.replace('시', '').replace('군', ''))
        )
        if (mentioned) {
          onRegionSelect(mentioned)
          contextRegion = mentioned
        }
      }
    }

    try {
      const firstUserIdx = next.findIndex((m) => m.role === 'user')
      const contents = next.slice(firstUserIdx).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: buildSystemWithContext(contextRegion) }],
            },
            contents,
          }),
        }
      )

      const data = await res.json()
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

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
        top: '140px',
        left: '20px',
        width: '380px',
        maxHeight: 'calc(100vh - 240px)',
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
            Gemini 기반 · 참고용 안내
          </div>
        </div>
        {selectedRegion && (
          <div
            style={{
              fontSize: '11px',
              background: 'rgba(255,255,255,0.18)',
              padding: '4px 8px',
              borderRadius: '6px',
              maxWidth: '120px',
              textAlign: 'right',
              lineHeight: '1.4',
            }}
          >
            📍 {selectedRegion.name}
            <br />
            안전지수 {getSafetyIndex(selectedRegion.velocity).score ?? '-'}
          </div>
        )}
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

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'white',
                border: '1px solid #e5e5e5',
                fontSize: '18px',
                color: '#9ca3af',
                letterSpacing: '4px',
              }}
            >
              ●●●
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
        {['가장 조심할 곳?', '이 지역 안전한가요?', '땅이 가라앉으면?', '신고는 어디로?'].map((q) => (
          <button
            key={q}
            onClick={() => {
              setInput(q)
              setTimeout(handleSend, 50)
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
