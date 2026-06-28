#!/usr/bin/env python3
# ============================================================
# calculate_gsi_v07.py — 강산지킴이 GSI v0.7
#
# 방법론:
#   1. velocity 정규화: 데이터 95%ile 기준 (강원도 분포 자체 기준)
#      → 중국 논문 임계값(20mm) 직접 적용 불가 — 강원도 배경 변형량이 다름
#      → 대신 "강원도 내에서 상대적으로 얼마나 큰 변형인가"로 평가
#   2. infra_proximity 가중 (컨텍스트 확정 공식)
#      GSI = v_norm × (0.5 + 0.5 × infra_proximity) × 10
#   3. 등급: 멘토링 확정 분포 목표
#      안정 60% / 주의 25% / 경계 10% / 위험 5%
#      → 데이터 분포에서 역산한 경계값 사용
#
# 근거:
#   - Yalong River (MDPI 17/18/3210): velocity 중요도 2위, 정규화는 Min-Max
#   - CSDI Landslides 2024: 지역 데이터 분포 기반 Min-Max 정규화 표준
#   - 멘토링 확정: GSI = v_norm × (0.5 + 0.5×infra) × 10, 등급 60/25/10/5%
# ============================================================
import h5py
import numpy as np
import os
import csv

TEMP_COH_MIN = 0.7   # temporal coherence 마스크 기준 (maskTempCoh 사용)
GRADE_NAMES  = ['안정', '주의', '경계', '위험']
TARGET_DIST  = [0.60, 0.25, 0.10, 0.05]  # 멘토링 확정 등급 비율

print("=" * 60)
print("  강산지킴이 GSI v0.7")
print("  (데이터 분포 기반 정규화 + infra_proximity 가중)")
print("=" * 60)

# [1] velocity
print("\n[1] velocity 로드...")
with h5py.File('velocity.h5', 'r') as f:
    v = f['velocity'][:]
v_mm = v * 1000.0
print(f"  범위(mm/yr): {np.nanmin(v_mm):.1f} ~ {np.nanmax(v_mm):.1f}")

# [2] 마스크 (maskTempCoh 이진 마스크 사용)
print("\n[2] 마스크 로드...")
with h5py.File('maskTempCoh.h5', 'r') as f:
    mask = f['mask'][:].astype(bool)
valid = mask & ~np.isnan(v_mm)
print(f"  유효 픽셀: {valid.sum():,} ({valid.sum()/valid.size*100:.1f}%)")

# [3] infra_proximity
print("\n[3] infra_proximity 로드...")
with h5py.File('infra_proximity.h5', 'r') as f:
    key = list(f.keys())[0]
    infra = f[key][:]

# 크기 맞추기 (1년치와 4년치 크기 다를 수 있음)
if infra.shape != v_mm.shape:
    print(f"  ⚠ 크기 불일치: infra={infra.shape}, velocity={v_mm.shape}")
    from scipy.ndimage import zoom
    zoom_r = v_mm.shape[0] / infra.shape[0]
    zoom_c = v_mm.shape[1] / infra.shape[1]
    infra = zoom(infra, (zoom_r, zoom_c), order=1)
    print(f"  리샘플링 완료: {infra.shape}")
else:
    print(f"  크기 일치: {infra.shape}")

# infra 0~1 클리핑
infra = np.clip(infra, 0, 1)
print(f"  infra 평균: {infra[valid].mean():.3f}")

# [4] velocity 정규화 (데이터 95%ile 기준)
print("\n[4] velocity 정규화...")
v_abs = np.abs(v_mm)
v_valid_abs = v_abs[valid]

p95 = np.percentile(v_valid_abs, 95)
print(f"  95%ile = {p95:.1f} mm/yr → 정규화 기준")
v_norm = np.clip(v_abs / p95, 0, 1)

# [5] GSI 계산 (멘토링 확정 공식)
print("\n[5] GSI 계산...")
# GSI = v_norm × (0.5 + 0.5 × infra_proximity) × 10
gsi = v_norm * (0.5 + 0.5 * infra) * 10.0
gsi_masked = np.where(valid, gsi, np.nan)

gv = gsi_masked[valid]
print(f"  GSI 범위: {gv.min():.2f} ~ {gv.max():.2f}")
print(f"  GSI 평균: {gv.mean():.2f}")

# [6] 등급화 — 멘토링 확정 분포(60/25/10/5%)로 경계값 역산
print("\n[6] 등급화 (목표: 안정60%/주의25%/경계10%/위험5%)...")
# 누적분포에서 경계값 역산
t1 = np.percentile(gv, 60)   # 하위 60% = 안정 상한
t2 = np.percentile(gv, 85)   # 하위 85% = 주의 상한 (60+25)
t3 = np.percentile(gv, 95)   # 하위 95% = 경계 상한 (60+25+10)
print(f"  등급 경계: 안정<{t1:.2f} / 주의<{t2:.2f} / 경계<{t3:.2f} / 위험>={t3:.2f}")

grade = np.full(gsi.shape, -1, dtype=np.int8)
grade[valid & (gsi < t1)] = 0
grade[valid & (gsi >= t1) & (gsi < t2)] = 1
grade[valid & (gsi >= t2) & (gsi < t3)] = 2
grade[valid & (gsi >= t3)] = 3

for g in range(4):
    cnt = (grade == g).sum()
    pct = cnt / valid.sum() * 100
    print(f"  {GRADE_NAMES[g]}: {cnt:,}px ({pct:.1f}%)")

# [7] 저장
print("\n[7] 저장...")
with h5py.File('gsi_map.h5', 'w') as f:
    f.create_dataset('gsi', data=gsi_masked.astype(np.float32))
    f.attrs['method'] = 'v_norm*(0.5+0.5*infra)*10, v_norm=|v|/p95'
    f.attrs['p95_mm_yr'] = p95
    f.attrs['thresholds'] = f'{t1:.3f},{t2:.3f},{t3:.3f}'
print("  ✓ gsi_map.h5")

with h5py.File('gsi_grade.h5', 'w') as f:
    f.create_dataset('grade', data=grade)
print("  ✓ gsi_grade.h5")

# [8] CSV
print("\n[8] CSV 생성...")
geom = 'inputs/geometryRadar.h5'
if os.path.exists(geom):
    with h5py.File(geom, 'r') as f:
        lat = f['latitude'][:]
        lon = f['longitude'][:]
    ys, xs = np.where(valid)
    rows = []
    step = 20
    for i in range(len(ys)):
        y, x = ys[i], xs[i]
        g = grade[y, x]
        if g >= 2 or (i % step == 0):
            rows.append([
                round(float(lat[y, x]), 6),
                round(float(lon[y, x]), 6),
                round(float(gsi[y, x]), 3),
                int(g),
                GRADE_NAMES[g],
                round(float(v_mm[y, x]), 2),
                round(float(infra[y, x]), 3),
            ])
    with open('gsi_pixels.csv', 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(['lat', 'lon', 'gsi', 'grade', 'grade_name',
                    'velocity_mm_yr', 'infra_proximity'])
        w.writerows(rows)
    print(f"  ✓ gsi_pixels.csv ({len(rows):,}행)")

# [9] 요약
with open('gsi_summary.txt', 'w', encoding='utf-8') as f:
    f.write("GSI v0.7 요약\n")
    f.write("=" * 40 + "\n")
    f.write("공식: v_norm*(0.5+0.5*infra)*10\n")
    f.write(f"정규화 기준: 95%ile = {p95:.1f} mm/yr\n")
    f.write(f"등급 경계: {t1:.2f}/{t2:.2f}/{t3:.2f}\n")
    f.write("근거: CSDI Landslides2024 Min-Max, 멘토링 확정 공식\n\n")
    for g in range(4):
        cnt = (grade == g).sum()
        pct = cnt / valid.sum() * 100
        f.write(f"  {GRADE_NAMES[g]}: {cnt:,}px ({pct:.1f}%)\n")
print("  ✓ gsi_summary.txt")

print("\n" + "=" * 60)
print("  완료!")
print("=" * 60)
