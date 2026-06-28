# 강산지킴이 — 강원도 지반침하 모니터링 플랫폼

## 서비스 소개

Sentinel-1 SAR 위성 InSAR 분석으로 강원도 전역 지반 변위를 모니터링하고, 시민에게는 안전지수를, 공공기관에게는 점검 우선순위를 제공하는 플랫폼입니다.

## 데모

- **서비스 URL**: https://gangwon-subsidence.vercel.app
- **GitHub**: https://github.com/leehyeonwoo1/gangwon-subsidence

## 주요 기능

- 강원도 전역 250만 픽셀 GSI(지반안정지수) 지도
- 픽셀 단위 위험도 히트맵 (Sentinel-1 4년치 InSAR 기반)
- AI 챗봇 (Gemini 2.5 Flash)
- 공공기관용 점검 우선순위 대시보드
- 위험 픽셀 데이터 xlsx 다운로드

## 기술 스택

- **프론트엔드**: React 19 + Vite + Leaflet + Chart.js
- **InSAR 처리**: ISCE2 (topsStack) + MintPy (SBAS)
- **AI/ML**: Gemini 2.5 Flash API, Random Forest (scikit-learn)
- **데이터**: Sentinel-1 SAR 4년치 (2022~2026), 294 interferogram pairs
- **배포**: Vercel (자동 CI/CD)

## 실행 방법

```bash
git clone https://github.com/leehyeonwoo1/gangwon-subsidence
cd gangwon-subsidence
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 환경변수 설정

`.env.local` 파일을 생성하고 Gemini API 키를 설정하세요.

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Google AI Studio(https://aistudio.google.com)에서 API 키를 발급받을 수 있습니다.

## 팀

팀 공지천 — 강원대학교 X+AI·SW 융합 해커톤
