"""
gen_weather_map.py — Cloud + Wind + Isobars Layer Pipeline v1.5

Generates zoom-aware cloud profiles, wind vector frames, and pressure isobar overlays:
  - sites/staging/data/clouds/{profile_id}/cloud_NNN.webp   (121 frames × 3 profiles)
  - sites/staging/data/wind/{profile_id}/wind_NNN.json      (121 frames × 3 profiles)
  - sites/staging/data/isobars/{profile_id}/isobar_NNN.webp (121 frames × 3 profiles)
  - sites/staging/data/weather_map_now.json   (data contract v1.5)

Cloud architecture:
  eu_wide    — zoom 6–8  — internal raster, lat 30–72°N, lon −15–50°E
  eu_central — zoom 9–11 — internal raster, lat 45–60°N, lon   5–35°E
  local      — zoom 12+  — internal raster, lat 48–57°N, lon  12–30°E

All profiles share the same 121-frame timeline (identical indexes, t_utc values).
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from PIL import Image, ImageFilter
    import numpy as np
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAS_MPL = True
except ImportError:
    HAS_MPL = False

# ── Paths ─────────────────────────────────────────────────────────────────────

REPO_ROOT    = Path(__file__).resolve().parents[3]
STAGING      = REPO_ROOT / "sites" / "staging"
DATA_DIR     = STAGING / "data"
CLOUDS_DIR   = DATA_DIR / "clouds"
WIND_DIR     = DATA_DIR / "wind"
ISOBARS_DIR  = DATA_DIR / "isobars"
OUT_JSON     = DATA_DIR / "weather_map_now.json"
OM_CACHE_DIR = DATA_DIR / "_cache" / "open_meteo"

# How long a cached batch response is considered fresh (seconds)
OM_CACHE_TTL = 3 * 3600  # 3 hours

# When set to "1", skip cloud WebP rendering (manifest-only mode).
# Used by cron-weather-map.yml which only commits JSON — WebP frames are
# never deployed from that workflow (no CF Pages deploy there).
# Full rendering still happens in cron-grib-tiles.yml before the unified deploy.
SKIP_RENDER = os.environ.get("WEATHER_MAP_SKIP_RENDER", "0") == "1"

# When set to "1", skip wind vector generation entirely and preserve the wind
# section from the existing manifest (written by the last cron-grib-tiles run).
# Wind JSON files are .gitignored and never committed/deployed from cron-weather-map,
# so regenerating them there only adds Open-Meteo dependency risk for no benefit.
# isobar data still fetched (pressure_msl only — lighter request).
SKIP_WIND = os.environ.get("WEATHER_MAP_SKIP_WIND", "0") == "1"

# ── Profile definitions ───────────────────────────────────────────────────────

# Internal raster profiles (pipeline generates WebP frames for these)
PROFILES: list[dict] = [
    {
        "id":               "world",
        "zoom_min":         0,
        "zoom_max":         5,
        "bbox":             {"lat_min": -80.0, "lat_max": 80.0, "lon_min": -180.0, "lon_max": 180.0},
        "grid_lat_n":       5,   # placeholder — not used (skip_clouds=True)
        "grid_lon_n":       10,  # placeholder
        # Wind/isobar grid: 10° steps → 17 lat × 37 lon = 629 points
        "wind_grid_lat_n":  17,
        "wind_grid_lon_n":  37,
        "render_size":      256,
        "blur_radius":      14,  # heavy blur for global scale
        "isobar_render_size": 512,
        "isobar_step":      5,     # 5 hPa for global view
        "skip_clouds":      True,  # world_tiles handles clouds; only wind+isobars generated
    },
    {
        "id":               "eu_wide",
        "zoom_min":         6,
        "zoom_max":         8,
        "bbox":             {"lat_min": 30.0, "lat_max": 72.0, "lon_min": -15.0, "lon_max": 50.0},
        "grid_lat_n":       6,
        "grid_lon_n":       8,   # wider bbox → more lon samples
        # Wind uses a denser grid (step ~2°lat × 4°lon) → ~20 arrows visible at zoom 7
        "wind_grid_lat_n":  22,
        "wind_grid_lon_n":  18,
        "render_size":      256,
        "blur_radius":      4,
        "isobar_render_size": 512,
        "isobar_step":      2,     # 2 hPa for full Europe view
    },
    {
        "id":               "eu_central",
        "zoom_min":         9,
        "zoom_max":         11,
        "bbox":             {"lat_min": 45.0, "lat_max": 60.0, "lon_min":  5.0, "lon_max": 35.0},
        "grid_lat_n":       6,
        "grid_lon_n":       6,
        # Wind: step ~0.75°lat × 1.5°lon → fine enough for zoom 9-11
        "wind_grid_lat_n":  21,
        "wind_grid_lon_n":  21,
        "render_size":      256,
        "blur_radius":      3,
        "isobar_render_size": 512,
        "isobar_step":      1,     # 1 hPa for regional view
    },
    {
        "id":               "local",
        "zoom_min":         12,
        "zoom_max":         18,
        "bbox":             {"lat_min": 48.0, "lat_max": 57.0, "lon_min": 12.0, "lon_max": 30.0},
        "grid_lat_n":       6,
        "grid_lon_n":       6,
        # Wind: step ~0.5°lat × 1°lon → detailed for zoom 12+
        "wind_grid_lat_n":  19,
        "wind_grid_lon_n":  19,
        "render_size":      256,
        "blur_radius":      2,
        "isobar_render_size": 512,
        "isobar_step":      1,     # 1 hPa for local view
    },
]

# ── Timeline ──────────────────────────────────────────────────────────────────

TOTAL_FRAMES   = 169
HISTORY_SLOTS  = 48    # indices 0..47
CURRENT_IDX    = 48    # index 48 = now
FORECAST_SLOTS = 120   # indices 49..168

# ── Alpha mapping (non-linear) ────────────────────────────────────────────────

ALPHA_MAP = [
    (0,   10,  0,    15),
    (10,  30,  15,   60),
    (30,  60,  60,   140),
    (60,  80,  140,  200),
    (80,  100, 200,  242),
]

# ── Open-Meteo fetch ──────────────────────────────────────────────────────────

OM_BASE = "https://api.open-meteo.com/v1/forecast"


def build_grid(
    bbox: dict, lat_n: int, lon_n: int, hexagonal: bool = False
) -> list[tuple[float, float]]:
    """Return (lat, lon) sample points for given bbox and grid dimensions.

    hexagonal=True shifts every odd latitude row by half a longitude step,
    producing a hex-packing layout instead of a regular square grid.
    Odd rows may have one fewer point where the shift would exceed lon_max.
    """
    lats = [bbox["lat_min"] + i * (bbox["lat_max"] - bbox["lat_min"]) / (lat_n - 1)
            for i in range(lat_n)]
    lon_step = (bbox["lon_max"] - bbox["lon_min"]) / (lon_n - 1)
    points: list[tuple[float, float]] = []
    for i, lat in enumerate(lats):
        offset = lon_step * 0.5 if (hexagonal and i % 2 == 1) else 0.0
        for j in range(lon_n):
            lon = bbox["lon_min"] + j * lon_step + offset
            if lon <= bbox["lon_max"] + 1e-9:
                points.append((lat, lon))
    return points


def _om_cache_path(url: str) -> Path:
    key = hashlib.sha1(url.encode()).hexdigest()[:16]
    return OM_CACHE_DIR / f"{key}.json"


def _om_cache_load(url: str) -> tuple[list | None, bool]:
    """Return (data, is_fresh). data=None if no cache exists."""
    path = _om_cache_path(url)
    if not path.exists():
        return None, False
    try:
        cached = json.loads(path.read_text())
        age = time.time() - cached.get("_cached_at", 0)
        return cached["data"], age < OM_CACHE_TTL
    except Exception:
        return None, False


def _om_cache_save(url: str, data: list) -> None:
    OM_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = _om_cache_path(url)
    path.write_text(json.dumps({"_cached_at": time.time(), "data": data}))


def fetch_open_meteo(
    points: list[tuple[float, float]],
    past_days: int = 2,
    forecast_days: int = 6,
    variables: str = "cloud_cover,precipitation,pressure_msl,wind_speed_10m,wind_direction_10m,temperature_2m",
) -> list[dict]:
    """Fetch hourly fields for all grid points in batches of 10.

    Responses are cached on disk (TTL=3h). On 429 / network error, stale cache
    is used if available so the pipeline can still produce output.

    variables: comma-separated Open-Meteo hourly fields to request.
    Returns list of dicts with keys: lat, lon, times, cloud_cover, pressure_msl,
    wind_speed, wind_direction. Missing variables are returned as empty lists.
    """
    results = []
    BATCH = 10
    for i in range(0, len(points), BATCH):
        batch = points[i:i + BATCH]
        params = {
            "latitude":        ",".join(f"{p[0]:.4f}" for p in batch),
            "longitude":       ",".join(f"{p[1]:.4f}" for p in batch),
            "hourly":          variables,
            "past_days":       str(past_days),
            "forecast_days":   str(forecast_days),
            "timeformat":      "unixtime",
            "timezone":        "UTC",
            "wind_speed_unit": "ms",
        }
        url = OM_BASE + "?" + urllib.parse.urlencode(params)
        batch_idx = i // BATCH

        # Try fresh cache first
        cached_data, is_fresh = _om_cache_load(url)
        if is_fresh:
            data = cached_data
        else:
            try:
                with urllib.request.urlopen(url, timeout=30) as resp:
                    data = json.loads(resp.read())
                _om_cache_save(url, data)
            except Exception as e:
                print(f"  [warn] Open-Meteo batch {batch_idx} failed: {e}", flush=True)
                if cached_data is not None:
                    print(f"  [cache] batch {batch_idx}: using stale cache", flush=True)
                    data = cached_data
                else:
                    for lat, lon in batch:
                        results.append({
                            "lat": lat, "lon": lon, "times": [],
                            "cloud_cover": [], "precipitation": [], "pressure_msl": [],
                            "wind_speed": [], "wind_direction": [], "temperature": [],
                        })
                    continue

        if isinstance(data, dict):
            data = [data]
        for j, point_data in enumerate(data):
            lat, lon = batch[j]
            hourly = point_data.get("hourly", {})
            results.append({
                "lat":            lat,
                "lon":            lon,
                "times":          hourly.get("time", []),
                "cloud_cover":    hourly.get("cloud_cover", []),
                "precipitation":  hourly.get("precipitation", []),
                "pressure_msl":   hourly.get("pressure_msl", []),
                "wind_speed":     hourly.get("wind_speed_10m", []),
                "wind_direction": hourly.get("wind_direction_10m", []),
                "temperature":    hourly.get("temperature_2m", []),
            })
        time.sleep(0.2)

    return results


# ── Timeline building ──────────────────────────────────────────────────────────

def floor_to_hour(dt: datetime) -> datetime:
    return dt.replace(minute=0, second=0, microsecond=0)


def build_timeline(anchor: datetime) -> list[datetime]:
    """Return 121 UTC datetimes: anchor−48h … anchor+72h."""
    return [anchor + timedelta(hours=h - HISTORY_SLOTS) for h in range(TOTAL_FRAMES)]


def slot_phase(idx: int) -> str:
    if idx < CURRENT_IDX:  return "history"
    if idx == CURRENT_IDX: return "current"
    return "forecast"


def slot_confidence(idx: int) -> str:
    if idx <= CURRENT_IDX:      return "high"
    if idx - CURRENT_IDX <= 36: return "medium"
    return "low"


# ── Wind vector builder ────────────────────────────────────────────────────────

def build_wind_timeseries(
    grid_data: list[dict],
    timeline:  list[datetime],
) -> list[list[dict | None]]:
    """
    Build matrix[frame_idx][point_idx] = {dir_deg, speed_ms} or None.
    Uses same time-matching logic as cloud timeseries.
    """
    spd_lookups: list[dict[int, float]] = []
    dir_lookups: list[dict[int, float]] = []
    for pd in grid_data:
        spd_lut: dict[int, float] = {}
        dir_lut: dict[int, float] = {}
        for t, s, d in zip(pd["times"], pd.get("wind_speed", []), pd.get("wind_direction", [])):
            if s is not None:
                spd_lut[int(t)] = float(s)
            if d is not None:
                dir_lut[int(t)] = float(d)
        spd_lookups.append(spd_lut)
        dir_lookups.append(dir_lut)

    matrix: list[list[dict | None]] = []
    for slot_dt in timeline:
        unix = int(slot_dt.timestamp())
        row: list[dict | None] = []
        for pi in range(len(grid_data)):
            spd = spd_lookups[pi].get(unix)
            dir_ = dir_lookups[pi].get(unix)
            if spd is None or dir_ is None:
                for delta in range(1, 31):
                    if spd is None:
                        spd = spd_lookups[pi].get(unix + delta * 60) or spd_lookups[pi].get(unix - delta * 60)
                    if dir_ is None:
                        dir_ = dir_lookups[pi].get(unix + delta * 60) or dir_lookups[pi].get(unix - delta * 60)
                    if spd is not None and dir_ is not None:
                        break
            row.append({"dir_deg": round(dir_, 1), "speed_ms": round(spd, 1)} if spd is not None and dir_ is not None else None)
        matrix.append(row)
    return matrix


def build_wind_frame_json(
    wind_row:   list[dict | None],
    points:     list[tuple[float, float]],
    idx:        int,
    slot_dt:    datetime,
) -> dict:
    """Build a single wind frame dict with vector list."""
    vectors = []
    for i, (lat, lon) in enumerate(points):
        w = wind_row[i]
        if w is not None:
            vectors.append({
                "lat":      round(lat, 4),
                "lon":      round(lon, 4),
                "dir_deg":  w["dir_deg"],
                "speed_ms": w["speed_ms"],
            })
    return {
        "index":    idx,
        "t_utc":    slot_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "available": len(vectors) > 0,
        "vectors":  vectors,
    }


# ── Grid → raster ─────────────────────────────────────────────────────────────

def build_point_timeseries(
    grid_data: list[dict],
    timeline:  list[datetime],
) -> list[list[float | None]]:
    """Build matrix[frame_idx][point_idx] = cloud_opacity (0–100) or None."""
    return build_scalar_timeseries(grid_data, timeline, "cloud_cover")


def build_scalar_timeseries(
    grid_data: list[dict],
    timeline:  list[datetime],
    field:     str,
) -> list[list[float | None]]:
    """Build matrix[frame_idx][point_idx] = scalar value or None for given field name."""
    lookups: list[dict[int, float]] = []
    for pd in grid_data:
        lut: dict[int, float] = {}
        for t, c in zip(pd["times"], pd.get(field, [])):
            if c is not None:
                lut[int(t)] = float(c)
        lookups.append(lut)

    matrix: list[list[float | None]] = []
    for slot_dt in timeline:
        unix = int(slot_dt.timestamp())
        row: list[float | None] = []
        for pi in range(len(grid_data)):
            val = lookups[pi].get(unix)
            if val is None:
                for delta in range(1, 31):
                    val = lookups[pi].get(unix + delta * 60)
                    if val is not None: break
                    val = lookups[pi].get(unix - delta * 60)
                    if val is not None: break
            row.append(val)
        matrix.append(row)
    return matrix


def interpolate_frame(
    values:      list[float | None],
    points:      list[tuple[float, float]],
    bbox:        dict,
    lat_n:       int,
    lon_n:       int,
    render_size: int,
) -> "np.ndarray | None":
    """Bilinear interpolation of grid values → render_size×render_size float32."""
    if not HAS_PIL:
        return None

    valid = [(points[i], v) for i, v in enumerate(values) if v is not None]
    if not valid:
        return None

    coarse = np.full((lat_n, lon_n), np.nan, dtype=np.float32)
    for (lat, lon), v in valid:
        li = round((lat - bbox["lat_min"]) / (bbox["lat_max"] - bbox["lat_min"]) * (lat_n - 1))
        lj = round((lon - bbox["lon_min"]) / (bbox["lon_max"] - bbox["lon_min"]) * (lon_n - 1))
        coarse[max(0, min(lat_n - 1, li)), max(0, min(lon_n - 1, lj))] = v

    mask = np.isnan(coarse)
    if mask.all():
        return None
    if mask.any():
        filled = coarse.copy()
        rows, cols = np.where(~mask)
        for r, c in zip(*np.where(mask)):
            dists   = (rows - r) ** 2 + (cols - c) ** 2
            nearest = int(np.argmin(dists))
            filled[r, c] = coarse[rows[nearest], cols[nearest]]
        coarse = filled

    img_coarse = Image.fromarray(np.flipud(coarse).astype(np.float32), mode="F")
    img_large  = img_coarse.resize((render_size, render_size), Image.BILINEAR)
    return np.array(img_large, dtype=np.float32)


def make_edge_feather(h: int, w: int, margin_frac: float = 0.12) -> "np.ndarray":
    """
    Return a float32 mask [h, w] in [0, 1] that fades smoothly to 0 near each edge.
    Uses a cosine ramp over `margin_frac` of the image width/height on each side.
    """
    mx = max(1, int(w * margin_frac))
    my = max(1, int(h * margin_frac))

    ramp_x = np.ones(w, dtype=np.float32)
    ramp_y = np.ones(h, dtype=np.float32)

    for i in range(mx):
        v = 0.5 - 0.5 * np.cos(np.pi * i / mx)   # 0 → 1
        ramp_x[i]         = v
        ramp_x[w - 1 - i] = v

    for i in range(my):
        v = 0.5 - 0.5 * np.cos(np.pi * i / my)
        ramp_y[i]         = v
        ramp_y[h - 1 - i] = v

    return np.outer(ramp_y, ramp_x)   # 2-D mask via outer product


def render_frame_webp(grid_values: "np.ndarray", dest: Path, blur_radius: int = 3) -> bool:
    """Render cloud opacity grid to RGBA WebP (white clouds, non-linear alpha, feathered edges)."""
    if not HAS_PIL:
        return False

    h, w   = grid_values.shape
    rgba   = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = 255  # white clouds

    alpha = np.zeros((h, w), dtype=np.float32)
    v = grid_values
    for lo, hi, a_lo, a_hi in ALPHA_MAP:
        seg = (v >= lo) & (v <= hi)
        if not seg.any(): continue
        t = np.clip((v[seg] - lo) / (hi - lo), 0, 1)
        alpha[seg] = a_lo + t * (a_hi - a_lo)

    # Feather edges so the domain boundary fades to transparent instead of cutting hard
    feather = make_edge_feather(h, w, margin_frac=0.12)
    alpha   = alpha * feather

    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)

    img = Image.fromarray(rgba, "RGBA")
    if blur_radius > 0:
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=85)
    return True


# ── Isobar renderer ───────────────────────────────────────────────────────────

def render_isobar_frame_json(
    values:      list[float | None],
    points:      list[tuple[float, float]],
    bbox:        dict,
    lat_n:       int,
    lon_n:       int,
    render_size: int,
    dest:        Path,
    isobar_step: int = 1,
) -> bool:
    """Extract pressure isobar contour lines as lat/lon JSON for Leaflet L.polyline.

    Output: {"isobars": [{"level": 1010, "paths": [[[lat,lon], ...], ...]}, ...]}
    Polylines rendered by Leaflet always use screen-pixel stroke width — no
    pixelation or scaling issues at any zoom level.
    """
    if not HAS_MPL or not HAS_PIL:
        return False

    import warnings

    # Build pressure grid (same interpolation + smoothing as SVG renderer)
    coarse = np.full((lat_n, lon_n), np.nan, dtype=np.float32)
    for i, (lat, lon) in enumerate(points):
        if i < len(values) and values[i] is not None:
            li = round((lat - bbox["lat_min"]) / (bbox["lat_max"] - bbox["lat_min"]) * (lat_n - 1))
            lj = round((lon - bbox["lon_min"]) / (bbox["lon_max"] - bbox["lon_min"]) * (lon_n - 1))
            coarse[max(0, min(lat_n - 1, li)), max(0, min(lon_n - 1, lj))] = values[i]

    mask = np.isnan(coarse)
    if mask.all():
        return False
    if mask.any():
        filled = coarse.copy()
        rows, cols = np.where(~mask)
        for r, c in zip(*np.where(mask)):
            dists   = (rows - r) ** 2 + (cols - c) ** 2
            nearest = int(np.argmin(dists))
            filled[r, c] = coarse[rows[nearest], cols[nearest]]
        coarse = filled

    img_coarse = Image.fromarray(np.flipud(coarse).astype(np.float32), mode="F")
    img_large  = img_coarse.resize((render_size, render_size), Image.BICUBIC)
    grid = np.array(img_large, dtype=np.float32)

    p_min, p_max = float(grid.min()), float(grid.max())
    if p_max > p_min:
        scaled  = ((grid - p_min) / (p_max - p_min) * 255).astype(np.uint8)
        blur_r  = max(4, render_size // 50)
        blurred = Image.fromarray(scaled, mode="L").filter(ImageFilter.GaussianBlur(radius=blur_r))
        grid    = np.array(blurred, dtype=np.float32) / 255.0 * (p_max - p_min) + p_min

    xs = np.arange(render_size, dtype=np.float32)
    X, Y = np.meshgrid(xs, xs)

    # Extract contour paths (no rendering — data only)
    fig = plt.figure(figsize=(1, 1))
    ax  = fig.add_subplot(111)
    levels = list(range(950, 1061, isobar_step))
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")      # suppress allsegs deprecation warning
        cs = ax.contour(X, Y, grid, levels=levels)
        all_segs = cs.allsegs
    plt.close(fig)

    lat_range = bbox["lat_max"] - bbox["lat_min"]
    lon_range = bbox["lon_max"] - bbox["lon_min"]
    MAX_PTS   = 150   # max points per path segment (Douglas-Peucker would be better but this is fast)

    isobars: list[dict] = []
    for i, level in enumerate(levels):
        paths: list[list] = []
        for seg in all_segs[i]:
            if len(seg) < 2:
                continue
            lons = bbox["lon_min"] + seg[:, 0] / render_size * lon_range
            lats = bbox["lat_max"] - seg[:, 1] / render_size * lat_range  # y=0 → lat_max (flipud)
            step = max(1, len(lons) // MAX_PTS)
            path = [[round(float(lats[k]), 3), round(float(lons[k]), 3)]
                    for k in range(0, len(lons), step)]
            if len(path) >= 2:
                paths.append(path)
        if paths:
            isobars.append({"level": int(level), "paths": paths})

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps({"isobars": isobars}, separators=(",", ":")), encoding="utf-8")
    return True


def render_isobar_frame_svg(
    values:      list[float | None],
    points:      list[tuple[float, float]],
    bbox:        dict,
    lat_n:       int,
    lon_n:       int,
    render_size: int,
    dest:        Path,
) -> bool:
    """Render pressure isobars as a scalable vector SVG (infinite resolution).

    Output is a transparent SVG with contour lines at 950–1060 hPa, step 5 hPa.
    Fonts embedded as paths so there are no external font dependencies.
    L.imageOverlay handles SVG natively — no pixelation at any zoom level.
    """
    if not HAS_MPL or not HAS_PIL:
        return False

    import io, re

    # Interpolate sparse pressure grid → render_size × render_size float32
    coarse = np.full((lat_n, lon_n), np.nan, dtype=np.float32)
    for i, (lat, lon) in enumerate(points):
        if i < len(values) and values[i] is not None:
            li = round((lat - bbox["lat_min"]) / (bbox["lat_max"] - bbox["lat_min"]) * (lat_n - 1))
            lj = round((lon - bbox["lon_min"]) / (bbox["lon_max"] - bbox["lon_min"]) * (lon_n - 1))
            coarse[max(0, min(lat_n - 1, li)), max(0, min(lon_n - 1, lj))] = values[i]

    mask = np.isnan(coarse)
    if mask.all():
        return False
    if mask.any():
        filled = coarse.copy()
        rows, cols = np.where(~mask)
        for r, c in zip(*np.where(mask)):
            dists   = (rows - r) ** 2 + (cols - c) ** 2
            nearest = int(np.argmin(dists))
            filled[r, c] = coarse[rows[nearest], cols[nearest]]
        coarse = filled

    img_coarse = Image.fromarray(np.flipud(coarse).astype(np.float32), mode="F")
    img_large  = img_coarse.resize((render_size, render_size), Image.BICUBIC)
    grid = np.array(img_large, dtype=np.float32)

    # Gaussian smooth to eliminate sharp kinks from the coarse grid
    p_min, p_max = float(grid.min()), float(grid.max())
    if p_max > p_min:
        scaled  = ((grid - p_min) / (p_max - p_min) * 255).astype(np.uint8)
        blur_r  = max(4, render_size // 50)
        blurred = Image.fromarray(scaled, mode="L").filter(ImageFilter.GaussianBlur(radius=blur_r))
        grid    = np.array(blurred, dtype=np.float32) / 255.0 * (p_max - p_min) + p_min

    xs = np.arange(render_size, dtype=np.float32)
    X, Y = np.meshgrid(xs, xs)

    # Embed fonts as paths — no external font dependency in SVG
    plt.rcParams["svg.fonttype"] = "path"

    fig, ax = plt.subplots(figsize=(5.12, 5.12), dpi=100)  # 512pt viewBox
    fig.patch.set_alpha(0.0)
    ax.set_facecolor((0.0, 0.0, 0.0, 0.0))
    ax.set_position([0, 0, 1, 1])
    ax.set_xlim(0, render_size)
    ax.set_ylim(0, render_size)
    ax.axis("off")

    levels = list(range(950, 1061, 5))
    try:
        cs = ax.contour(X, Y, grid, levels=levels, colors="#c8d8e8", linewidths=0.5)
        ax.clabel(cs, levels[::4], inline=True, fontsize=6, colors="#c8d8e8", fmt="%d")
    except Exception as exc:
        plt.close(fig)
        print(f"  [warn] isobar contour failed: {exc}", flush=True)
        return False

    buf = io.BytesIO()
    fig.savefig(buf, format="svg", transparent=True, bbox_inches=None, pad_inches=0)
    plt.close(fig)

    # Make SVG responsive for L.imageOverlay: replace fixed px dims with 100%
    # and add preserveAspectRatio="none" so it fills the overlay bounds exactly
    svg = buf.getvalue().decode("utf-8")
    svg = re.sub(r'(<svg\b[^>]*?)\s+width="[^"]*"',  r'\1 width="100%"',  svg, count=1)
    svg = re.sub(r'(<svg\b[^>]*?)\s+height="[^"]*"', r'\1 height="100%"', svg, count=1)
    svg = svg.replace("<svg ", '<svg preserveAspectRatio="none" ', 1)

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(svg, encoding="utf-8")
    return True


# ── Per-profile pipeline ──────────────────────────────────────────────────────

def run_profile(
    profile:       dict,
    timeline:      list[datetime],
    past_days:     int = 2,
    forecast_days: int = 6,
    skip_render:   bool = False,
    skip_wind:     bool = False,
) -> tuple[list[dict], list[dict], list[dict], int, int]:
    """
    Run full pipeline for one profile.
    Returns (cloud_frame_refs, wind_frame_refs, isobar_frame_refs, rendered_count, skipped_count).
    cloud_frame_refs:  [{index, available, asset_url}]
    wind_frame_refs:   [{index, t_utc, available, asset_type, asset_url}]
    isobar_frame_refs: [{index, available, asset_url}]
    """
    pid               = profile["id"]
    bbox              = profile["bbox"]
    lat_n             = profile["grid_lat_n"]
    lon_n             = profile["grid_lon_n"]
    wind_lat_n        = profile.get("wind_grid_lat_n", lat_n)
    wind_lon_n        = profile.get("wind_grid_lon_n", lon_n)
    render_size       = profile.get("render_size", 256)
    blur_radius       = profile.get("blur_radius", 3)
    isobar_render_size = profile.get("isobar_render_size", 512)
    isobar_step        = profile.get("isobar_step", 1)

    skip_clouds = profile.get("skip_clouds", False)

    print(f"\n[weather-map] Profile: {pid}  zoom {profile['zoom_min']}–{profile['zoom_max']}", flush=True)
    print(f"  bbox: lat {bbox['lat_min']}–{bbox['lat_max']}, lon {bbox['lon_min']}–{bbox['lon_max']}", flush=True)
    if skip_clouds:
        print(f"  skip_clouds=True — wind+isobars only (world_tiles handles clouds)", flush=True)
    if skip_render:
        print(f"  skip_render=True — cloud WebP rendering skipped (manifest-only mode)", flush=True)

    if not skip_clouds:
        # Cloud + pressure grid (coarse — used for raster interpolation and isobars)
        points    = build_grid(bbox, lat_n, lon_n)
        print(f"  Cloud/pressure grid: {len(points)} pts ({lat_n}×{lon_n})", flush=True)
        grid_data = fetch_open_meteo(points, past_days, forecast_days)
        print(f"  Fetched {len(grid_data)} cloud/pressure series", flush=True)
        cloud_matrix  = build_point_timeseries(grid_data, timeline)
        precip_matrix = build_scalar_timeseries(grid_data, timeline, "precipitation")
        temp_matrix   = build_scalar_timeseries(grid_data, timeline, "temperature")
    else:
        points        = []
        grid_data     = []
        cloud_matrix  = [[] for _ in timeline]
        precip_matrix = [[] for _ in timeline]
        temp_matrix   = [[] for _ in timeline]

    # Wind grid (denser — used for particle animation layer AND pressure isobars)
    # When skip_wind=True, fetch only pressure_msl (no wind variables) — lighter
    # request sufficient for isobar generation; wind JSON files are not written.
    _wind_fetch_vars = (
        "pressure_msl" if skip_wind
        else "wind_speed_10m,wind_direction_10m,pressure_msl"
    )
    if skip_clouds:
        # world profile: wind grid is the only data source (also used for isobars)
        wind_points = build_grid(bbox, wind_lat_n, wind_lon_n, hexagonal=True)
        print(f"  {'Isobar' if skip_wind else 'Wind/isobar'} grid: {len(wind_points)} pts ({wind_lat_n}×{wind_lon_n})", flush=True)
        wind_grid_data = fetch_open_meteo(
            wind_points, past_days, forecast_days,
            variables=_wind_fetch_vars,
        )
        print(f"  Fetched {len(wind_grid_data)} {'isobar' if skip_wind else 'wind/pressure'} series", flush=True)
    elif wind_lat_n != lat_n or wind_lon_n != lon_n:
        wind_points = build_grid(bbox, wind_lat_n, wind_lon_n, hexagonal=True)
        print(f"  {'Isobar' if skip_wind else 'Wind'} grid:  {len(wind_points)} pts ({wind_lat_n}×{wind_lon_n})", flush=True)
        wind_grid_data = fetch_open_meteo(
            wind_points, past_days, forecast_days,
            variables=_wind_fetch_vars,
        )
        print(f"  Fetched {len(wind_grid_data)} {'isobar' if skip_wind else 'wind/pressure'} series", flush=True)
    else:
        wind_points    = points
        wind_grid_data = grid_data

    # Skip wind vector building when skip_wind=True — wind_matrix stays empty,
    # all wind frames will be marked available=False (overridden later in run()).
    wind_matrix   = [] if skip_wind else build_wind_timeseries(wind_grid_data, timeline)
    # Isobars reuse the dense wind grid for much better spatial detail
    isobar_matrix = build_scalar_timeseries(wind_grid_data, timeline, "pressure_msl")

    wind_dir    = WIND_DIR / pid
    isobar_dir  = ISOBARS_DIR / pid
    wind_dir.mkdir(parents=True, exist_ok=True)
    isobar_dir.mkdir(parents=True, exist_ok=True)
    if not skip_clouds:
        cloud_dir = CLOUDS_DIR / pid
        cloud_dir.mkdir(parents=True, exist_ok=True)

    cloud_refs:  list[dict] = []
    wind_refs:   list[dict] = []
    isobar_refs: list[dict] = []
    rendered = skipped = 0

    for idx, slot_dt in enumerate(timeline):
        # ── Cloud frame ───────────────────────────────────────────────────────
        if not skip_clouds:
            frame_name = f"cloud_{idx:03d}.webp"
            asset_url  = f"/data/clouds/{pid}/{frame_name}"

            if skip_render:
                # Manifest-only mode: no WebP on disk, frontend will fall back.
                cloud_refs.append({"index": idx, "available": False, "asset_url": None})
                skipped += 1
            else:
                frame_path = cloud_dir / frame_name
                values     = cloud_matrix[idx]
                grid       = interpolate_frame(values, points, bbox, lat_n, lon_n, render_size)
                available  = False
                if grid is not None:
                    ok        = render_frame_webp(grid, frame_path, blur_radius=blur_radius)
                    available = ok
                    if ok: rendered += 1
                    else:  skipped  += 1
                else:
                    skipped += 1
                    if frame_path.exists():
                        frame_path.unlink()
                cloud_refs.append({
                    "index":     idx,
                    "available": available,
                    "asset_url": asset_url if available else None,
                })
        else:
            # No cloud raster for world profile
            cloud_refs.append({"index": idx, "available": False, "asset_url": None})

        # ── Wind frame ────────────────────────────────────────────────────────
        wind_name  = f"wind_{idx:03d}.json"
        wind_path  = wind_dir / wind_name
        wind_url   = f"/data/wind/{pid}/{wind_name}"

        if skip_wind:
            # Wind skipped — placeholder ref; actual data preserved from old manifest in run().
            wind_refs.append({
                "index":      idx,
                "t_utc":      slot_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "available":  False,
                "asset_type": "vector",
                "asset_url":  None,
                "meta":       {"source_name": "open-meteo", "wind_unit": "m/s"},
            })
        else:
            wind_frame = build_wind_frame_json(wind_matrix[idx], wind_points, idx, slot_dt)

            if wind_frame["available"]:
                with open(wind_path, "w", encoding="utf-8") as wf:
                    json.dump(wind_frame, wf, separators=(",", ":"))
            elif wind_path.exists():
                wind_path.unlink()

            wind_refs.append({
                "index":      idx,
                "t_utc":      wind_frame["t_utc"],
                "available":  wind_frame["available"],
                "asset_type": "vector",
                "asset_url":  wind_url if wind_frame["available"] else None,
                "meta": {
                    "source_name":   "open-meteo",
                    "wind_unit":     "m/s",
                    "density_mode":  "full_grid",
                    "vector_count":  len(wind_frame["vectors"]),
                },
            })

        # ── Isobar frame (JSON lat/lon paths → Leaflet L.polyline) ───────────
        iso_name    = f"isobar_{idx:03d}.json"
        iso_path    = isobar_dir / iso_name
        iso_url     = f"/data/isobars/{pid}/{iso_name}"

        if iso_path.exists():
            iso_ok = True   # reuse cached file from previous run / git checkout
        else:
            iso_values = isobar_matrix[idx]
            iso_ok = render_isobar_frame_json(
                iso_values, wind_points, bbox, wind_lat_n, wind_lon_n, isobar_render_size, iso_path,
                isobar_step=isobar_step,
            )
            # never delete an existing file on render failure — stale data is better than no data

        isobar_refs.append({
            "index":     idx,
            "t_utc":     slot_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "available": iso_ok,
            "asset_url": iso_url if iso_ok else None,
        })

        if idx % 20 == 0:
            print(f"  [{pid}][{idx:3d}/{len(timeline)}] {slot_dt.strftime('%Y-%m-%d %H:%M')} UTC", flush=True)

    wind_available   = sum(1 for r in wind_refs   if r["available"])
    isobar_available = sum(1 for r in isobar_refs if r["available"])
    print(
        f"  [{pid}] clouds: rendered={rendered} skipped={skipped}"
        f"  wind: {wind_available}/{len(wind_refs)}"
        f"  isobars: {isobar_available}/{len(isobar_refs)} frames",
        flush=True,
    )
    return cloud_refs, wind_refs, isobar_refs, rendered, skipped, points, cloud_matrix, precip_matrix, temp_matrix


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run() -> None:
    t0 = time.time()
    print("[weather-map] Starting cloud + wind + isobar layer pipeline v1.5", flush=True)

    if not HAS_PIL:
        print("[weather-map] ERROR: Pillow/numpy not installed. Run: pip install Pillow numpy", flush=True)
        sys.exit(1)

    if SKIP_WIND:
        print("[weather-map] SKIP_WIND=1: wind vector fetch disabled; wind section will be preserved from existing manifest", flush=True)
    if SKIP_RENDER:
        print("[weather-map] SKIP_RENDER=1: cloud WebP rendering disabled (manifest-only mode)", flush=True)

    anchor   = floor_to_hour(datetime.now(timezone.utc))
    print(f"[weather-map] Anchor: {anchor.isoformat()}", flush=True)

    timeline = build_timeline(anchor)

    # Shared timeline frame metadata (time only — no asset URLs here)
    timeline_frames: list[dict] = [
        {
            "index":      idx,
            "t_utc":      slot_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "phase":      slot_phase(idx),
            "confidence": slot_confidence(idx),
        }
        for idx, slot_dt in enumerate(timeline)
    ]

    # Run each profile
    profile_manifests: list[dict] = []
    wind_profile_manifests: list[dict] = []
    isobar_profile_manifests: list[dict] = []
    total_rendered = total_skipped = 0

    # Build world_tiles profile entry (owned internal tile pyramid from GRIB pipeline)
    _tile_manifests_dir = DATA_DIR / "tile_manifests"
    _tile_latest = _tile_manifests_dir / "latest.json"
    if _tile_latest.exists():
        try:
            _tl = json.loads(_tile_latest.read_text())
            _run_manifest_path = DATA_DIR / "tile_manifests" / f"{_tl['run_id']}.json"
            _tm = json.loads(_run_manifest_path.read_text()) if _run_manifest_path.exists() else _tl
            world_tiles_manifest = {
                "id":               "world_tiles",
                "kind":             "internal_tiles",
                "zoom_min":         _tm.get("zoom_min", 0),
                "zoom_max":         _tm.get("zoom_max", 3),
                "bbox":             None,
                "bounds":           None,
                "tile_manifest_url": f"/data/tile_manifests/{_tl['run_id']}.json",
                "frames":           None,
                "available":        True,
                "meta": {
                    "source_kind":   "internal_tiles",
                    "source_name":   "nebulacast/gfs-tcdc",
                    "timeline_mode": "time_addressable",
                    "source_owned":  True,
                    "run_id":        _tl.get("run_id"),
                },
            }
            print(f"[weather-map] Tile profile: world_tiles run={_tl.get('run_id')} available=true", flush=True)
        except Exception as _e:
            print(f"[weather-map] Tile profile: world_tiles manifest read failed ({_e}) → available=false", flush=True)
            world_tiles_manifest = {
                "id": "world_tiles", "kind": "internal_tiles",
                "zoom_min": 0, "zoom_max": 3,
                "bbox": None, "bounds": None,
                "tile_manifest_url": None, "frames": None, "available": False,
                "meta": {"source_kind": "internal_tiles", "source_name": "nebulacast/gfs-tcdc",
                         "source_owned": True},
            }
    else:
        world_tiles_manifest = {
            "id": "world_tiles", "kind": "internal_tiles",
            "zoom_min": 0, "zoom_max": 3,
            "bbox": None, "bounds": None,
            "tile_manifest_url": None, "frames": None, "available": False,
            "meta": {"source_kind": "internal_tiles", "source_name": "nebulacast/gfs-tcdc",
                     "source_owned": True},
        }
        print(f"[weather-map] Tile profile: world_tiles (no manifest yet → available=false)", flush=True)
    profile_manifests.insert(0, world_tiles_manifest)

    icon_profile_manifests: list[dict] = []

    for profile in PROFILES:
        cloud_refs, wind_refs, isobar_refs, rendered, skipped, pts, cloud_matrix, precip_matrix, temp_matrix = run_profile(profile, timeline, skip_render=SKIP_RENDER, skip_wind=SKIP_WIND)
        total_rendered += rendered
        total_skipped  += skipped
        bbox = profile["bbox"]
        # Skip cloud manifest entry for profiles that don't generate cloud rasters
        if not profile.get("skip_clouds"):
            profile_manifests.append({
                "id":               profile["id"],
                "kind":             "internal_raster",
                "zoom_min":         profile["zoom_min"],
                "zoom_max":         profile["zoom_max"],
                "bbox":             bbox,
                "bounds":           [[bbox["lat_min"], bbox["lon_min"]], [bbox["lat_max"], bbox["lon_max"]]],
                "tile_url_template": None,
                "width":            profile.get("render_size", 256),
                "height":           profile.get("render_size", 256),
                "available":        rendered > 0,
                "frames":           cloud_refs,
                "meta": {
                    "source_kind":   "internal_raster",
                    "source_name":   "nebulacast/open-meteo",
                    "timeline_mode": "time_addressable",
                    "styling_mode":  "internal_style",
                    "source_owned":  True,
                },
            })
        wind_available = sum(1 for r in wind_refs if r["available"])
        wind_profile_manifests.append({
            "id":        profile["id"],
            "zoom_min":  profile["zoom_min"],
            "zoom_max":  profile["zoom_max"],
            "bbox":      bbox,
            "bounds":    [[bbox["lat_min"], bbox["lon_min"]], [bbox["lat_max"], bbox["lon_max"]]],
            "available": wind_available > 0,
            "frames":    wind_refs,
        })
        isobar_available = sum(1 for r in isobar_refs if r["available"])
        isobar_profile_manifests.append({
            "id":        profile["id"],
            "zoom_min":  profile["zoom_min"],
            "zoom_max":  profile["zoom_max"],
            "bbox":      bbox,
            "bounds":    [[bbox["lat_min"], bbox["lon_min"]], [bbox["lat_max"], bbox["lon_max"]]],
            "width":     profile.get("isobar_render_size", 512),
            "height":    profile.get("isobar_render_size", 512),
            "available": isobar_available > 0,
            "frames":    isobar_refs,
        })

        # ── Cloud icons: export raw grid point values for zoom 11+ icon layer ──
        if not profile.get("skip_clouds") and pts:
            # Icons start 2 zoom levels above raster (raster disappears at zoom 11)
            icon_zoom_min = profile["zoom_min"]
            icon_frames = []
            for idx in range(len(timeline)):
                row        = cloud_matrix[idx]  if idx < len(cloud_matrix)  else []
                precip_row = precip_matrix[idx] if idx < len(precip_matrix) else []
                temp_row   = temp_matrix[idx]   if idx < len(temp_matrix)   else []
                values      = [round(v, 0) if v is not None else None for v in row]
                precip_vals = [round(v, 2) if v is not None else None for v in precip_row]
                temp_vals   = [round(v, 1) if v is not None else None for v in temp_row]
                icon_frames.append({"index": idx, "values": values, "precip": precip_vals, "temp": temp_vals})
            icon_profile_manifests.append({
                "id":       profile["id"],
                "zoom_min": icon_zoom_min,
                "bbox":     bbox,
                "bounds":   [[bbox["lat_min"], bbox["lon_min"]], [bbox["lat_max"], bbox["lon_max"]]],
                "points":   [{"lat": round(lat, 4), "lon": round(lon, 4)} for lat, lon in pts],
                "frames":   icon_frames,
                "available": len(pts) > 0,
            })

    elapsed = time.time() - t0
    print(f"\n[weather-map] Total: rendered={total_rendered} skipped={total_skipped}  ({elapsed:.1f}s)", flush=True)

    now_utc  = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    contract = {
        "schema_version": "1.5",
        "updated_utc":    now_utc,
        "source": {
            "domain":   "weather",
            "dataset":  "weather_map_now",
            "products": ["open-meteo-cloud-cover", "open-meteo-pressure-msl", "open-meteo-wind"],
        },
        "timeline": {
            "anchor_utc":    anchor.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "step_hours":    1,
            "total_frames":  TOTAL_FRAMES,
            "current_index": CURRENT_IDX,
            "frames":        timeline_frames,
        },
        "layers": {
            "clouds": {
                "id":                 "clouds",
                "enabled_by_default": True,
                "available":          total_rendered > 0,
                "render": {
                    "type":       "image_overlay",
                    "opacity":    0.75,
                    "blend_mode": "normal",
                },
                "profiles": profile_manifests,
            },
            "isobars": {
                "id":                 "isobars",
                "enabled_by_default": False,
                "available":          any(pm["available"] for pm in isobar_profile_manifests),
                "render": {
                    "type":    "image_overlay",
                    "opacity": 0.85,
                },
                "profiles": isobar_profile_manifests,
            },
            "wind": {
                "id":                 "wind",
                "enabled_by_default": False,
                "available":          any(pm["available"] for pm in wind_profile_manifests),
                "opacity":            0.80,
                "profiles":           wind_profile_manifests,
                "meta": {
                    "source_name":  "open-meteo",
                    "wind_unit":    "m/s",
                    "asset_type":   "vector",
                },
            },
            "cloud_icons": {
                "id":                 "cloud_icons",
                "enabled_by_default": True,
                "available":          len(icon_profile_manifests) > 0,
                "profiles":           icon_profile_manifests,
            },
        },
        "playback": {
            "player_id":         "global_time_player",
            "shared":            True,
            "recommended_fps":   1,
            "supported_actions": ["play", "pause", "step_forward", "step_back", "scrub"],
        },
        "stats": {
            "rendered_frames": total_rendered,
            "skipped_frames":  total_skipped,
            "elapsed_sec":     round(elapsed, 1),
            "render_size_px":  256,
            "profiles": [
                {
                    "id":          pm["id"],
                    "kind":        pm["kind"],
                    "rendered":    sum(1 for f in pm["frames"] if f["available"]) if pm.get("frames") else 0,
                    "grid_points": (
                        next((p["grid_lat_n"] * p["grid_lon_n"] for p in PROFILES if p["id"] == pm["id"]), None)
                    ),
                }
                for pm in profile_manifests
            ],
        },
    }

    # When SKIP_WIND=1: restore the wind layer from the existing manifest so the
    # frontend keeps serving the last good wind data (generated by cron-grib-tiles).
    # This prevents cron-weather-map from ever overwriting wind availability with
    # all-False entries just because Open-Meteo was unavailable during this run.
    if SKIP_WIND and OUT_JSON.exists():
        try:
            old = json.loads(OUT_JSON.read_text())
            if "layers" in old and "wind" in old["layers"]:
                contract["layers"]["wind"] = old["layers"]["wind"]
                old_wind_avail = sum(
                    sum(1 for f in (p.get("frames") or []) if f.get("available"))
                    for p in old["layers"]["wind"].get("profiles", [])
                )
                print(f"[weather-map] SKIP_WIND: restored wind section from existing manifest ({old_wind_avail} available frames)", flush=True)
            else:
                print("[weather-map] SKIP_WIND: existing manifest has no wind section — leaving empty", flush=True)
        except Exception as e:
            print(f"[weather-map] SKIP_WIND: could not read existing manifest ({e}) — wind section is empty", flush=True)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(contract, f, indent=2, ensure_ascii=False)

    print(f"[weather-map] Written {OUT_JSON}", flush=True)
    print(f"[weather-map] Done in {elapsed:.1f}s", flush=True)


if __name__ == "__main__":
    run()
