import { useState, useRef, useEffect } from 'react'

const API_KEY = "AIzaSyBhviEdSHkit5GwQ443sCWWl32HXeQkSsE"

const SYSTEM_PROMPT = `당신은 강원도 지반안정 모니터링 서비스 강산지킴이의 AI 안내 도우미입니다.
- 답변은 3문장 이내, 짧고 명확하게
- 마크다운 형식 절대 금지 (**, *, ##, ---, ⚠️ 등)
- GSI는 0~10점, 낮을수록 위험, 높을수록 안전
- 현재 선택된 지역 데이터 기반으로 구체적으로 답변
- 참고 자료임을 딱 한 번만 간단히 언급
- 친근하고 쉬운 말로`

function buildSystemWithContext(region, gsi, grade, velocity) {
  if (!region) return SYSTEM_PROMPT
  return (
    SYSTEM_PROMPT +
    `\n\n현재 사용자가 선택한 지역:\n지역명: ${region.name}\nGSI: ${gsi} / 10\n등급: ${grade}\n연간 변위 속도: ${velocity} mm/yr`
  )
}

export default function DashboardChat({ region, gsi, grade, velocity }) {
  const [isOpen, setIsOpen]     = useState(false)
  const [messages, setMessages] = useState([]) // { role: 'user'|'model', text }
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const contents = next.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }))

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: buildSystemWithContext(region, gsi, grade, velocity) }],
            },
            contents,
          }),
        }
      )

      const data = await res.json()
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        '응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.'
      setMessages((prev) => [...prev, { role: 'model', text: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* FAB 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="AI 도우미 열기"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(30,64,175,0.4)',
            zIndex: 1100,
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          💬
        </button>
      )}

      {/* 챗 패널 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '360px',
            height: '520px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>
                🛰️ 강산지킴이 AI
              </div>
              <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '11px', marginTop: '2px' }}>
                Gemini 기반 · 참고용 안내
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: '28px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* 선택된 지역 컨텍스트 배지 */}
          {region && (
            <div
              style={{
                background: '#f0f9ff',
                borderBottom: '1px solid #e0f2fe',
                padding: '7px 14px',
                fontSize: '11px',
                color: '#0369a1',
                fontWeight: '600',
                flexShrink: 0,
              }}
            >
              📍 {region.name} · GSI {gsi} / 10 · {grade} · {velocity} mm/yr
            </div>
          )}

          {/* 메시지 영역 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  color: '#9ca3af',
                  fontSize: '13px',
                  textAlign: 'center',
                  marginTop: '48px',
                  lineHeight: '1.9',
                }}
              >
                안녕하세요! 강산지킴이 AI입니다.
                <br />
                강원도 지반 안전에 관해
                <br />
                궁금한 점을 물어보세요.
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '9px 13px',
                    borderRadius:
                      m.role === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    background: m.role === 'user' ? '#3b82f6' : '#f3f4f6',
                    color: m.role === 'user' ? 'white' : '#111827',
                    fontSize: '13px',
                    lineHeight: '1.65',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '9px 14px',
                    borderRadius: '14px 14px 14px 2px',
                    background: '#f3f4f6',
                    color: '#9ca3af',
                    fontSize: '18px',
                    letterSpacing: '4px',
                  }}
                >
                  ●●●
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* 입력창 */}
          <div
            style={{
              borderTop: '1px solid #f3f4f6',
              padding: '10px',
              display: 'flex',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력... (Enter 전송, Shift+Enter 줄바꿈)"
              rows={2}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1.5px solid #e5e7eb',
                fontSize: '13px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: loading || !input.trim() ? '#e5e7eb' : '#3b82f6',
                color: loading || !input.trim() ? '#9ca3af' : 'white',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                alignSelf: 'flex-end',
                transition: 'background 0.15s',
              }}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </>
  )
}
