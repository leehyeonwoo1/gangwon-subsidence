import json, datetime, collections
import numpy as np
import h5py
from shapely.geometry import shape
import shapely.vectorized

MINTPY = '/mnt/g/InSAR_Work/InSAR_Gangwon_2022_2025/stack_result/mintpy_run'
REPO = '/mnt/c/Users/희종/Desktop/gangwon-subsidence'

ID_MAP = {
    '춘천시':'chuncheon', '원주시':'wonju', '강릉시':'gangneung', '동해시':'donghae',
    '태백시':'taebaek', '속초시':'sokcho', '삼척시':'samcheok',
    '홍천군':'hongcheon', '횡성군':'hoengseong', '영월군':'yeongwol', '평창군':'pyeongchang',
    '정선군':'jeongseon', '철원군':'cheorwon', '화천군':'hwacheon', '양구군':'yanggu',
    '인제군':'inje', '고성군':'goseong', '양양군':'yangyang',
}

print("=== timeseries.h5 로드 ===")
with h5py.File(f'{MINTPY}/timeseries.h5', 'r') as f:
    dates = [d.decode() for d in f['date'][:]]
    ts = f['timeseries'][:] * 1000  # (n_date, ny, nx) mm

with h5py.File(f'{MINTPY}/inputs/geometryRadar.h5', 'r') as f:
    lat = f['latitude'][:]
    lon = f['longitude'][:]
with h5py.File(f'{MINTPY}/maskTempCoh.h5', 'r') as f:
    mask = f['mask'][:].astype(bool)

print(f"날짜 {len(dates)}개: {dates[0]} ~ {dates[-1]}")

# ---- 월별 그룹화 ----
month_to_idx = collections.OrderedDict()
for i, d in enumerate(dates):
    ym = f"{d[:4]}-{d[4:6]}"
    month_to_idx.setdefault(ym, []).append(i)
months_sorted = list(month_to_idx.keys())
print(f"월별 그룹: {len(months_sorted)}개월 ({months_sorted[0]} ~ {months_sorted[-1]})")

# 월별 평균 누적변위 맵(전체 그리드, 메모리 절약 위해 한달씩 계산)
monthly_ts = np.full((len(months_sorted), ts.shape[1], ts.shape[2]), np.nan, dtype=np.float32)
for mi, ym in enumerate(months_sorted):
    idxs = month_to_idx[ym]
    monthly_ts[mi] = np.nanmean(ts[idxs], axis=0)
del ts
print("월별 평균 계산 완료")

valid = mask & np.isfinite(monthly_ts[0])
# 일부 픽셀이 특정 월에 NaN일 수 있으니 valid는 mask만 기준으로 하고 집계시 nanmean 사용
flat_lat = lat[mask]; flat_lon = lon[mask]
flat_monthly = monthly_ts[:, mask]  # (n_month, n_valid_pixel)
print(f"유효 픽셀: {flat_lat.size:,}")

def aggregate_series(inside_idx):
    if inside_idx.sum() == 0:
        return None
    series = np.nanmean(flat_monthly[:, inside_idx], axis=1)
    return [round(float(v), 2) if np.isfinite(v) else None for v in series]

result = {}

# ---- 1) 시군 ----
print("\n=== 시군 집계 ===")
with open(f'{REPO}/src/korea-municipalities.json', encoding='utf-8') as f:
    muni = json.load(f)
gw_muni = [ft for ft in muni['features'] if ft['properties']['code'].startswith('32') and ft['properties']['name'] in ID_MAP]

for ft in gw_muni:
    name = ft['properties']['name']
    poly = shape(ft['geometry'])
    minx, miny, maxx, maxy = poly.bounds
    bbox_sel = (flat_lon>=minx)&(flat_lon<=maxx)&(flat_lat>=miny)&(flat_lat<=maxy)
    if bbox_sel.sum() == 0:
        continue
    bbox_idx = np.where(bbox_sel)[0]
    inside_local = shapely.vectorized.contains(poly, flat_lon[bbox_idx], flat_lat[bbox_idx])
    inside_idx = bbox_idx[inside_local]
    inside_mask_full = np.zeros(flat_lat.size, dtype=bool)
    inside_mask_full[inside_idx] = True
    series = aggregate_series(inside_mask_full)
    if series is None:
        print(f"  {name}: 데이터 없음"); continue
    result[ID_MAP[name]] = {'months': months_sorted, 'data': series}
    print(f"  {name}: N_month={len(series)}  range=[{min(v for v in series if v is not None):.1f},{max(v for v in series if v is not None):.1f}]")

# ---- 2) 읍면동 ----
print("\n=== 읍면동 집계 ===")
with open(f'{REPO}/src/korea-submunicipalities.json', encoding='utf-8') as f:
    sub = json.load(f)
gw_sub = [ft for ft in sub['features'] if ft['properties'].get('code','').startswith('32')]

n_ok, n_no = 0, 0
for ft in gw_sub:
    code = ft['properties']['code']
    poly = shape(ft['geometry'])
    minx, miny, maxx, maxy = poly.bounds
    bbox_sel = (flat_lon>=minx)&(flat_lon<=maxx)&(flat_lat>=miny)&(flat_lat<=maxy)
    if bbox_sel.sum() == 0:
        n_no += 1; continue
    bbox_idx = np.where(bbox_sel)[0]
    inside_local = shapely.vectorized.contains(poly, flat_lon[bbox_idx], flat_lat[bbox_idx])
    inside_idx = bbox_idx[inside_local]
    inside_mask_full = np.zeros(flat_lat.size, dtype=bool)
    inside_mask_full[inside_idx] = True
    series = aggregate_series(inside_mask_full)
    if series is None:
        n_no += 1; continue
    result[code] = {'months': months_sorted, 'data': series}
    n_ok += 1

print(f"읍면동 실측: {n_ok} / {len(gw_sub)}  (데이터없음 {n_no})")

out_path = f'{REPO}/src/realTimeSeriesData.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False)
print(f"\n✓ {out_path}  (entry 수: {len(result)})")
