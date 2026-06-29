# 백엔드 처리 파이프라인

## InSAR 처리
- 도구: ISCE2 (topsStack) + MintPy (SBAS)
- 데이터: Sentinel-1 SAR 4년치 (2022~2026)
- 간섭쌍: 294개
- 픽셀: 250만개

## 파일 설명
- calculate_gsi_v07.py: GSI 계산 스크립트
- build_real_data.py: 시군/읍면동 집계 데이터 생성
- build_real_timeseries.py: 시계열 데이터 생성

## 실행 환경
- Python 3.10+
- 필요 패키지: h5py, numpy, pandas, geopandas, pyproj
