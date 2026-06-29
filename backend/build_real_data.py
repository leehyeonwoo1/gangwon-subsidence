import json, datetime
import numpy as np
import h5py
from shapely.geometry import shape
import shapely.vectorized

MINTPY = '/mnt/g/InSAR_Work/InSAR_Gangwon_2022_2025/stack_result/mintpy_run'
REPO = '/mnt/c/Users/희종/Desktop/gangwon-subsidence'
TODAY = datetime.date.today().isoformat()

print("=== raster 로드 ===")
with h5py.File(f'{MINTPY}/inputs/geometryRadar.h5','r') as f:
    lat = f['latitude'][:]
    lon = f['longitude'][:]
with h5py.File(f'{MINTPY}/velocity.h5','r') as f:
    vel = f['velocity'][:] * 1000  # mm/yr
with h5py.File(f'{MINTPY}/gsi_map.h5','r') as f:
    gsi = f['gsi'][:]
with h5py.File(f'{MINTPY}/maskTempCoh.h5','r') as f:
    mask = f['mask'][:].astype(bool)
with h5py.File(f'{MINTPY}/infra_proximity.h5','r') as f:
    key = list(f.keys())[0]
    infra_raw = f[key][:]
if infra_raw.shape != vel.shape:
    from scipy.ndimage import zoom
    zr = vel.shape[0]/infra_raw.shape[0]; zc = vel.shape[1]/infra_raw.shape[1]
    infra = np.clip(zoom(infra_raw, (zr,zc), order=1), 0, 1)
else:
    infra = np.clip(infra_raw, 0, 1)

valid = mask & np.isfinite(vel) & np.isfinite(gsi)
print(f"유효 픽셀: {valid.sum():,}")

# id 매핑 (기존 patch의 18개 id-name)
ID_MAP = {
    '춘천시':'chuncheon', '원주시':'wonju', '강릉시':'gangneung', '동해시':'donghae',
    '태백시':'taebaek', '속초시':'sokcho', '삼척시':'samcheok',
    '홍천군':'hongcheon', '횡성군':'hoengseong', '영월군':'yeongwol', '평창군':'pyeongchang',
    '정선군':'jeongseon', '철원군':'cheorwon', '화천군':'hwacheon', '양구군':'yanggu',
    '인제군':'inje', '고성군':'goseong', '양양군':'yangyang',
}

def aggregate(lon_pts, lat_pts, vel_pts, gsi_pts, infra_pts):
    n = len(vel_pts)
    if n == 0:
        return None
    return {
        'velocity': round(float(np.mean(vel_pts)), 1),
        'gsi': round(float(np.mean(gsi_pts)), 1),
        'infra': round(float(np.mean(infra_pts)), 2),
        'pixelCount': int(n),
    }

# ---- 1) 시군 단위: korea-municipalities.json ----
print("\n=== 시군(realRegionsData.json) 집계 ===")
with open(f'{REPO}/src/korea-municipalities.json', encoding='utf-8') as f:
    muni = json.load(f)

gw_muni = [ft for ft in muni['features'] if ft['properties']['code'].startswith('32') and ft['properties']['name'] in ID_MAP]
print(f"강원 시군 polygon 개수: {len(gw_muni)}")

regions_out = []
flat_lat = lat[valid]; flat_lon = lon[valid]; flat_vel = vel[valid]; flat_gsi = gsi[valid]; flat_infra = infra[valid]

for ft in gw_muni:
    name = ft['properties']['name']
    poly = shape(ft['geometry'])
    minx, miny, maxx, maxy = poly.bounds
    bbox_sel = (flat_lon>=minx)&(flat_lon<=maxx)&(flat_lat>=miny)&(flat_lat<=maxy)
    if bbox_sel.sum() == 0:
        print(f"  {name}: bbox 내 픽셀 없음")
        continue
    inside = shapely.vectorized.contains(poly, flat_lon[bbox_sel], flat_lat[bbox_sel])
    agg = aggregate(flat_lon[bbox_sel][inside], flat_lat[bbox_sel][inside],
                     flat_vel[bbox_sel][inside], flat_gsi[bbox_sel][inside], flat_infra[bbox_sel][inside])
    centroid = poly.centroid
    if agg is None:
        print(f"  {name}: polygon 내 유효픽셀 없음")
        continue
    regions_out.append({
        'id': ID_MAP[name], 'name': name,
        'lat': round(centroid.y, 4), 'lng': round(centroid.x, 4),
        'velocity': agg['velocity'], 'gsi': agg['gsi'], 'infra': agg['infra'],
        'pixelCount': agg['pixelCount'], 'lastUpdated': TODAY,
    })
    print(f"  {name}: N={agg['pixelCount']:,} vel={agg['velocity']} gsi={agg['gsi']} infra={agg['infra']}")

with open(f'{REPO}/src/realRegionsData.json', 'w', encoding='utf-8') as f:
    json.dump(regions_out, f, ensure_ascii=False, indent=2)
print(f"✓ realRegionsData.json ({len(regions_out)}개 시군)")

# ---- 2) 읍면동 단위: korea-submunicipalities.json ----
print("\n=== 읍면동(realSubmunicipalityData.json) 집계 ===")
with open(f'{REPO}/src/korea-submunicipalities.json', encoding='utf-8') as f:
    sub = json.load(f)
gw_sub = [ft for ft in sub['features'] if ft['properties'].get('code','').startswith('32')]
print(f"강원 읍면동 polygon 개수: {len(gw_sub)}")

sub_out = {}
n_no_data = 0
for ft in gw_sub:
    code = ft['properties']['code']
    name = ft['properties']['name']
    poly = shape(ft['geometry'])
    minx, miny, maxx, maxy = poly.bounds
    bbox_sel = (flat_lon>=minx)&(flat_lon<=maxx)&(flat_lat>=miny)&(flat_lat<=maxy)
    if bbox_sel.sum() == 0:
        n_no_data += 1
        continue
    inside = shapely.vectorized.contains(poly, flat_lon[bbox_sel], flat_lat[bbox_sel])
    agg = aggregate(flat_lon[bbox_sel][inside], flat_lat[bbox_sel][inside],
                     flat_vel[bbox_sel][inside], flat_gsi[bbox_sel][inside], flat_infra[bbox_sel][inside])
    if agg is None:
        n_no_data += 1
        continue
    sub_out[code] = {
        'velocity': agg['velocity'], 'gsi': agg['gsi'], 'infra': agg['infra'],
        'pixelCount': agg['pixelCount'], 'lastUpdated': TODAY,
    }

print(f"실측 데이터 있는 읍면동: {len(sub_out)} / {len(gw_sub)}  (데이터 없음: {n_no_data})")
with open(f'{REPO}/src/realSubmunicipalityData.json', 'w', encoding='utf-8') as f:
    json.dump(sub_out, f, ensure_ascii=False, indent=2)
print(f"✓ realSubmunicipalityData.json ({len(sub_out)}개 읍면동)")
