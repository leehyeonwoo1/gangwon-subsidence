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
  const q = question.toLowerCase().replace(/\s+/g, ' ').trim()

  // 키워드 매칭 헬퍼: 여러 키워드 중 하나라도 포함되면 true
  const matches = (keywords) => keywords.some(k => q.includes(k))

  // === 의도별 키워드 그룹 ===
  const intents = {
    // "가장 위험한 곳" 류
    mostDangerous: [
      '가장 위험', '제일 위험', '가장 조심', '제일 조심',
      '가장 나쁘', '제일 나쁘', '가장 심각', '제일 심각',
      '가장 안 좋', '제일 안 좋', '위험한 지역', '위험한 곳',
      '조심할 곳', '조심할 지역', '심한 곳', '심한 지역',
      '문제 지역', '문제 있는', 'top 3', 'top3', '최악',
      '레드', '빨강', '빨간 곳', '제일 빨', '가장 빨',
    ],
    
    // "안전한 곳" 류
    safest: [
      '안전한 지역', '안전한 곳', '괜찮은 곳', '괜찮은 지역',
      '안정', '문제 없', '걱정 없', '가장 안전', '제일 안전',
      '좋은 곳', '좋은 지역', '초록',
    ],
    
    // "전체 통계" 류
    statistics: [
      '전체', '통계', '얼마나', '몇 개', '몇 곳', '몇 군데',
      '분포', '현황', '전반', '종합', '요약', '정리',
      '강원도 전체', '전부', '다 보여',
    ],
    
    // "뭘 해야 해" 류
    actionGuide: [
      '뭘 해', '뭘 하', '어떻게 해', '어떻게 하', '뭐 하',
      '조치', '대처', '대응', '행동', '대비', '준비',
      '예방', '주의사항', '주의 사항', '점검', '확인',
      '발견하면', '발견 시', '균열', '함몰', '싱크홀',
    ],
    
    // "신고" 류
    report: [
      '신고', '제보', '연락', '전화', '문의',
      '어디로', '어디에', '119', '1670',
      '관할', '담당', '구청', '시청', '도청',
    ],
    
    // "땅이 가라앉으면" 류 (행동 가이드와 비슷하지만 다른 어감)
    sinking: [
      '가라앉', '내려앉', '내려가', '꺼지', '함몰',
      '땅이 움직', '지반', '균열 생기', '갈라',
    ],
    
    // 인사
    greeting: [
      '안녕', '하이', 'hi', 'hello', '안녕하세', '반가',
      '시작', '처음', '뭐야', '뭐 하는', '무엇',
    ],
    
    // 도움말
    help: [
      '도움', '도움말', '메뉴', '뭐 할 수', '할 수 있',
      '기능', '사용법', '어떻게 써', '가이드',
    ],
    
    // 우리 동네 (내 위치)
    myArea: [
      '우리 동네', '우리 지역', '내 동네', '내 지역',
      '여기', '이 동네', '이 지역', '내가 사는',
    ],
  }

  // === 1. 가장 위험한 곳 ===
  if (matches(intents.mostDangerous)) {
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
  if (matches(intents.safest)) {
    const sorted = [...gangwonRegions].sort((a, b) => b.velocity - a.velocity)
    const top3 = sorted.slice(0, 3)
    return `🟢 강원도 안정 지역 TOP 3\n\n` +
      top3.map((r, i) => {
        const s = getSafetyIndex(r.velocity)
        return `${i + 1}. **${r.name}** — 안전 지수 ${s.score}/10 (${s.level.label})`
      }).join('\n') +
      `\n\n💡 이 지역들도 갑작스러운 굴착 공사나 지하수 변화 시 상황이 바뀔 수 있어요. 정기 모니터링은 권장됩니다.`
  }

  // === 3. 전체 통계 ===
  if (matches(intents.statistics)) {
    const counts = { 위험: 0, 경고: 0, 주의: 0, 양호: 0, 안전: 0 }
    gangwonRegions.forEach(r => {
      const s = getSafetyIndex(r.velocity)
      const label = s.level.label === '매우 안전' ? '안전' : s.level.label
      counts[label]++
    })
    
    return `📊 강원도 18개 시·군 안전 현황\n\n` +
      `🔴 위험: ${counts['위험']}곳\n` +
      `🟠 경고: ${counts['경고']}곳\n` +
      `🟡 주의: ${counts['주의']}곳\n` +
      `🟢 양호: ${counts['양호']}곳\n` +
      `🟢 안전: ${counts['안전']}곳\n\n` +
      `💡 **패턴 분석:**\n` +
      `동남부의 태백시, 정선군 일대는 과거 폐광 활동으로 땅이 조금씩 가라앉고 있어요.\n\n` +
      `💬 본인 거주 지역 이름을 알려주시면 자세히 분석해 드려요!`
  }

  // === 4. 행동 가이드 (뭘 해야 해?) ===
  if (matches(intents.actionGuide) || matches(intents.sinking)) {
    return `🛡️ 땅이 가라앉을 때 뭐해야 할까요?\n\n` +
      `**🚨 즉시 조치 (위험 발견 시)**\n` +
      `• 도로 함몰이나 큰 균열 발견 → **119에 신고**\n` +
      `• 가스 누출 의심 → 가스 차단 후 대피\n` +
      `• 건물이 기울어 보이면 → 즉시 119\n\n` +
      `**👀 일상에서 체크할 것**\n` +
      `• 집 바닥/벽에 새 균열 생겼나요?\n` +
      `• 문이 잘 안 닫히거나 창문이 뒤틀려 보이나요?\n` +
      `• 마당이나 길에 갑자기 움푹 들어간 곳 있나요?\n\n` +
      `**📞 어디로 연락해야 하나요?**\n` +
      `• 국토안전관리원: **1670-9090** (지반 침하 전문)\n` +
      `• 강원도청 재난안전실: **033-249-3500**\n` +
      `• 응급 상황: **119**\n\n` +
      `💬 본인 지역 이름을 알려주시면 그 지역 맞춤 안내를 드려요.`
  }

  // === 5. 신고 채널 ===
  if (matches(intents.report)) {
    return `📞 어디로 신고하면 되나요?\n\n` +
      `**🚨 위급 상황**\n` +
      `**119** — 도로 함몰, 건물 붕괴 위험 등\n\n` +
      `**🏛️ 일반 신고 / 문의**\n` +
      `• 국토안전관리원: **1670-9090**\n` +
      `  (지반 침하 전문 기관)\n` +
      `• 강원도청 재난안전실: **033-249-3500**\n` +
      `• 안전신문고 앱 또는 www.safetyreport.go.kr\n\n` +
      `**📝 신고할 때 알려주면 좋은 것**\n` +
      `• 정확한 위치 (주소나 좌표)\n` +
      `• 어떤 모습인지 (크기, 깊이)\n` +
      `• 가능하면 사진/영상\n` +
      `• 언제 발견했는지`
  }

  // === 6. 우리 동네 (위치 명시 안 함) ===
  if (matches(intents.myArea)) {
    return `📍 본인이 사는 지역 이름을 알려주세요!\n\n` +
      `예시:\n` +
      `• "춘천시 어때?"\n` +
      `• "태백시 자세히"\n` +
      `• "토성면은요?"\n\n` +
      `강원도 18개 시·군과 188개 읍·면·동 분석이 가능해요.\n\n` +
      `🗺️ 또는 지도에서 직접 클릭하시면 그 지역 정보가 우측에 나와요!`
  }

  // === 7. 인사 ===
  if (matches(intents.greeting)) {
    return `안녕하세요! 🛰️ 강원도 지반침하 모니터링 AI예요.\n\n` +
      `위성 데이터를 기반으로 강원도 18개 시·군의 땅 상태를 안내해 드려요.\n\n` +
      `**이렇게 물어보세요:**\n` +
      `• "가장 조심할 곳은?"\n` +
      `• "춘천시 어때?"\n` +
      `• "신고는 어디로?"\n` +
      `• "전체 통계"\n\n` +
      `또는 지도에서 직접 지역을 클릭해 보세요!`
  }

  // === 8. 도움말 ===
  if (matches(intents.help)) {
    return `💡 이렇게 사용해 보세요!\n\n` +
      `**📊 데이터 조회**\n` +
      `• "가장 조심할 곳은?"\n` +
      `• "안전한 지역은?"\n` +
      `• "전체 통계"\n` +
      `• "춘천시 자세히"\n\n` +
      `**🛡️ 안전 정보**\n` +
      `• "땅이 가라앉으면?"\n` +
      `• "신고는 어디로?"\n\n` +
      `**🗺️ 지도 활용**\n` +
      `• 지도에서 지역 클릭 → 안전 지수 + 그래프\n` +
      `• 확대(줌인) → 읍·면·동 단위 분석\n\n` +
      `💬 자연스럽게 물어보세요. "우리 춘천 어때?" 같은 식으로도 답해드려요!`
  }

  // === 9. 특정 시·군 ===
  const matchedRegion = gangwonRegions.find(r => 
    question.includes(r.name.replace('시', '').replace('군', ''))
  )

  if (matchedRegion) {
    const safety = getSafetyIndex(matchedRegion.velocity)
    const civic = getCivicExplanation(matchedRegion.velocity)
    const guide = getRiskGuide(matchedRegion.velocity)
    const isDetailed = q.includes('자세히') || q.includes('상세') || q.includes('더') || q.includes('알려')

    let response = `${safety.level.emoji} **${matchedRegion.name}** 분석\n\n` +
      `🎯 **안전 지수: ${safety.score} / 10점** (${safety.level.label})\n\n` +
      `💬 **쉽게 설명하면:**\n${safety.level.description}.\n` +
      `${civic.speedDescription} 정도예요.\n\n` +
      `📣 **${matchedRegion.name} 거주민이라면:**\n${safety.level.civicMessage}\n\n`

    if (isDetailed || matchedRegion.velocity <= -5) {
      response += `🔧 **권장 조치:**\n` +
        guide.actions.slice(0, 3).map(a => `• ${a}`).join('\n') + `\n\n` +
        `📞 **연락처:**\n` +
        guide.contacts.slice(0, 2).map(c => `• ${c.name}: ${c.phone}`).join('\n')
    } else {
      response += `💬 더 자세한 정보는 "${matchedRegion.name} 자세히" 라고 물어봐 주세요.`
    }

    return response
  }

  // === 10. 특정 읍·면·동 ===
  const matchedSub = gangwonSubmunicipalities.features.find(f => {
    const name = f.properties.name
    const shortName = name.replace(/(동|면|읍)$/, '')
    return question.includes(name) || (shortName.length >= 2 && question.includes(shortName))
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

      if (subData.reason) {
        response += `📍 **지질학적 요인:**\n${subData.reason}\n\n`
      }

      if (subData.velocity <= -5) {
        response += `🔧 **권장 조치:**\n` +
          guide.actions.slice(0, 3).map(a => `• ${a}`).join('\n') + `\n\n` +
          `📞 **연락처:**\n` +
          `• ${guide.contacts[0].name}: ${guide.contacts[0].phone}`
      } else {
        response += `💬 "${subData.parentRegion} 자세히"로 상위 지역 분석도 가능해요.`
      }

      return response
    }
  }

  // === 기본 응답 (이해 못 한 경우) ===
  return `질문을 정확히 이해하지 못했어요. 😅\n\n` +
    `**이런 식으로 물어봐 주세요:**\n\n` +
    `🚨 **위험 정보**\n` +
    `• "가장 조심할 곳은?"\n` +
    `• "어디가 위험해?"\n` +
    `• "태백시 어때?"\n\n` +
    `🛡️ **안전 정보**\n` +
    `• "땅이 가라앉으면 어떻게 해?"\n` +
    `• "어디로 신고해?"\n\n` +
    `💬 또는 **"도움말"** 이라고 입력해 보세요!`
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