import { useState, useRef, useEffect } from 'react'
import { gangwonRegions, getRiskLevel, getRiskGuide, getSafetyIndex, getCivicExplanation } from './regions'
import { gangwonSubmunicipalities, getSubmunicipalityData } from './submunicipalities'

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

  // === 1. 가장 위험한 지역 ===
 if (q.includes('가장 위험') || q.includes('제일 위험') || q.includes('위험한 지역')) {
  const sorted = [...gangwonRegions].sort((a, b) => a.velocity - b.velocity)
  const top3 = sorted.slice(0, 3)
  const top = top3[0]
  const topSafety = getSafetyIndex(top.velocity)

  return `🚨 강원도에서 가장 조심해야 할 지역 TOP 3\n\n` +
    top3.map((r, i) => {
      const s = getSafetyIndex(r.velocity)
      return `${i + 1}. ${s.level.emoji} **${r.name}** — 안전 지수 ${s.score}/10 (${s.level.label})`
    }).join('\n') +
    `\n\n📍 **${top.name}은요:**\n${topSafety.level.description}.\n\n` +
    `💡 ${topSafety.level.civicMessage}\n\n` +
    `💬 "${top.name} 자세히"라고 물어보면 더 자세히 알려드려요.`
}

  // === 2. 안전한 지역 ===
  if (q.includes('안전한 지역') || q.includes('안정')) {
    const sorted = [...gangwonRegions].sort((a, b) => b.velocity - a.velocity)
    const top3 = sorted.slice(0, 3)
    return `🟢 강원도 안정 지역 TOP 3\n\n` +
      top3.map((r, i) => `${i + 1}. **${r.name}**: ${r.velocity} mm/year`).join('\n') +
      `\n\n💡 이들 지역도 정기 모니터링은 권장됩니다. 갑작스러운 굴착 공사나 지하수 변화 시 상황이 바뀔 수 있습니다.`
  }

  // === 3. 전체 통계 ===
  if (q.includes('전체') || q.includes('통계') || q.includes('얼마나')) {
  const counts = { 위험: 0, 경고: 0, 주의: 0, 양호: 0, 안전: 0 }
  gangwonRegions.forEach(r => {
    const s = getSafetyIndex(r.velocity)
    counts[s.level.label === '매우 안전' ? '안전' : s.level.label]++
  })
  
  return `📊 강원도 18개 시·군 안전 현황\n\n` +
    `🔴 위험: ${counts['위험']}곳\n` +
    `🟠 경고: ${counts['경고']}곳\n` +
    `🟡 주의: ${counts['주의']}곳\n` +
    `🟢 양호: ${counts['양호']}곳\n` +
    `🟢 안전: ${counts['안전']}곳\n\n` +
    `💡 **위험 패턴:**\n` +
    `동남부의 태백시, 정선군은 과거 폐광 활동으로 땅이 조금씩 가라앉고 있어요.\n\n` +
    `💬 본인 거주 지역 이름을 물어보면 자세히 알려드려요!`
}

  // === 4. 행동 가이드 / 뭘 해야 해 ===
  if (q.includes('뭘 해') || q.includes('어떻게 해') || q.includes('조치') || q.includes('대처') || q.includes('대응')) {
    return `🛡️ 지반침하 발견 시 행동 가이드\n\n` +
      `**1️⃣ 즉시 조치 (위험 발견 시)**\n` +
      `• 도로 함몰, 건물 균열 발견 → 119 신고\n` +
      `• 가스 누출 의심 → 가스 차단 후 대피\n\n` +
      `**2️⃣ 일상 점검**\n` +
      `• 집 바닥/벽 균열 정기 확인\n` +
      `• 문짝 뒤틀림, 창문 안 닫힘 → 침하 의심\n` +
      `• 마당의 갑작스러운 침하 흔적\n\n` +
      `**3️⃣ 주요 연락처**\n` +
      `• 국토안전관리원: 1670-9090\n` +
      `• 강원도청 재난안전실: 033-249-3500\n` +
      `• 소방서: 119\n\n` +
      `💬 지역별 권장 조치를 원하면 시·군 이름을 알려주세요.`
  }

  // === 5. 신고 / 제보 ===
  if (q.includes('신고') || q.includes('제보') || q.includes('연락')) {
    return `📞 지반침하 신고 채널\n\n` +
      `**즉시 신고 (위급)**\n` +
      `🚨 119 — 도로 함몰, 건물 붕괴 위험\n\n` +
      `**일반 신고 / 문의**\n` +
      `🏛️ 국토안전관리원: 1670-9090\n` +
      `🏛️ 강원도청 재난안전실: 033-249-3500\n` +
      `📱 안전신문고 앱 또는 www.safetyreport.go.kr\n\n` +
      `**신고 시 알려주면 좋은 정보**\n` +
      `• 정확한 위치 (주소, 좌표)\n` +
      `• 침하 규모 (크기, 깊이)\n` +
      `• 사진/영상 (가능하면)\n` +
      `• 발견 시점`
  }

  // === 6. 특정 지역 (시·군) ===
const matchedRegion = gangwonRegions.find(r => 
  question.includes(r.name.replace('시', '').replace('군', ''))
)

if (matchedRegion) {
  const safety = getSafetyIndex(matchedRegion.velocity)
  const civic = getCivicExplanation(matchedRegion.velocity)
  const guide = getRiskGuide(matchedRegion.velocity)
  const isDetailed = q.includes('자세히') || q.includes('상세') || q.includes('더')
  
  let response = `${safety.level.emoji} **${matchedRegion.name}** 분석\n\n` +
    `🎯 **안전 지수: ${safety.score} / 10점** (${safety.level.label})\n\n` +
    `💬 **쉽게 설명하면:**\n${safety.level.description}.\n` +
    `${civic.speedDescription} 정도예요.\n\n` +
    `📣 **${matchedRegion.name} 거주민이라면:**\n${safety.level.civicMessage}\n\n`
  
  if (isDetailed || matchedRegion.velocity <= -5) {
    response += `🔧 **권장 조치:**\n` +
      guide.actions.map(a => `• ${a}`).join('\n') + `\n\n`
    
    if (guide.precautions.length > 0) {
      response += `⚠️ **주의 사항:**\n` +
        guide.precautions.map(p => `• ${p}`).join('\n') + `\n\n`
    }
    
    response += `📞 **연락처:**\n` +
      guide.contacts.map(c => `• ${c.name} (${c.desc}): ${c.phone}`).join('\n')
  } else {
    response += `💬 더 자세한 정보는 "${matchedRegion.name} 자세히" 라고 물어보세요.`
  }
  
  return response
}

// === 7. 특정 읍·면·동 ===
// 강원도 188개 읍·면·동에서 검색
const matchedSub = gangwonSubmunicipalities.features.find(f => {
  const name = f.properties.name
  // 동/면/읍 글자 제외하고 검색
  const shortName = name.replace(/(동|면|읍)$/, '')
  return question.includes(name) || question.includes(shortName)
})

if (matchedSub) {
  const subData = getSubmunicipalityData(matchedSub)
  if (subData) {
    const safety = getSafetyIndex(subData.velocity)
    const civic = getCivicExplanation(subData.velocity)
    const guide = getRiskGuide(subData.velocity)
    
    let response = `${safety.level.emoji} **${subData.name}** 분석\n\n` +
      `🗺️ ${subData.parentRegion} 소속\n\n` +
      `🎯 **안전 지수: ${safety.score} / 10점** (${safety.level.label})\n\n` +
      `💬 **쉽게 설명하면:**\n${safety.level.description}.\n` +
      `${civic.speedDescription} 정도예요.\n\n` +
      `📣 **여기 거주민이라면:**\n${safety.level.civicMessage}\n\n`
    
    // 특별 사유가 있으면 표시 (황지동, 사북읍 등)
    if (subData.reason) {
      response += `📍 **지질학적 요인:**\n${subData.reason}\n\n`
    }
    
    // 위험 수준이면 자세한 조치 안내
    if (subData.velocity <= -5) {
      response += `🔧 **권장 조치:**\n` +
        guide.actions.slice(0, 3).map(a => `• ${a}`).join('\n') + `\n\n` +
        `📞 **연락처:**\n` +
        `• ${guide.contacts[0].name}: ${guide.contacts[0].phone}`
    } else {
      response += `✅ 안정 범위 내이지만 정기 관찰을 권장합니다.\n\n` +
        `💬 "${subData.parentRegion} 자세히"로 상위 지역 분석도 가능합니다.`
    }
    
    return response
  }
}

  // === 7. 인사 ===
  if (q.includes('안녕') || q.includes('hi') || q.includes('hello')) {
    return `안녕하세요! 🛰️ 강원도 지반침하 모니터링 AI입니다.\n\n` +
      `Sentinel-1 위성 SAR 데이터를 기반으로 강원도 18개 시·군의 침하 현황을 안내해 드립니다.\n\n` +
      `**자주 묻는 질문:**\n` +
      `• "가장 위험한 지역은?"\n` +
      `• "○○시 자세히"\n` +
      `• "신고는 어떻게?"\n` +
      `• "전체 통계"`
  }

  // === 8. 도움말 ===
  if (q.includes('도움') || q.includes('뭐 할 수') || q.includes('할 수 있') || q.includes('메뉴')) {
    return `💡 이용 가이드\n\n` +
      `**📊 데이터 조회**\n` +
      `• "가장 위험한 지역?" — TOP 3\n` +
      `• "안전한 지역?" — 안정 지역\n` +
      `• "전체 통계" — 등급별 분포\n` +
      `• "춘천시 자세히" — 시·군 상세\n\n` +
      `**🛡️ 안전 정보**\n` +
      `• "뭘 해야 해?" — 행동 가이드\n` +
      `• "신고 채널" — 연락처\n\n` +
      `**🗺️ 지도 활용**\n` +
      `• 지도에서 지역 클릭 → 상세 그래프\n` +
      `• 확대(줌인) → 읍·면·동 단위 분석`
  }

  // === 기본 응답 ===
  return `질문을 이해하지 못했어요. 😅\n\n` +
    `**이런 식으로 물어봐 주세요:**\n\n` +
    `🚨 위험 정보\n` +
    `• "가장 위험한 지역?"\n` +
    `• "태백시 자세히"\n\n` +
    `🛡️ 안전 정보\n` +
    `• "뭘 해야 해?"\n` +
    `• "신고는 어떻게?"\n\n` +
    `💬 "도움말" 이라고 입력하면 전체 메뉴를 확인할 수 있습니다.`
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
        {['가장 조심할 곳?', '우리 동네 안전한가요?', '땅이 가라앉으면?', '신고는 어디로?'].map((q) => (
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