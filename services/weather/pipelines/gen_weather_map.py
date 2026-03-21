"""
gen_weather_map.py — Cloud Layer Pipeline v1

Generates:
  - sites/staging/data/clouds/cloud_NNN.webp  (121 frames)
  - sites/staging/data/weather_map_now.json   (data contract)

Architecture:
  Open-Meteo grid (6×6 = 36 pts, ERA5 history + forecast)
      → normalize to cloud_opacity_0_100
      → bilinear interpolate to 256×256
      → non-linear alpha mapping
      → Gaussian blur
      → WebP render (Pillow)
      → weather_map_now.json manifest

Region: lat 45–60°N, lon 5–35°E (Central/Northern Europe)
Timeline: 121 slots, [-48h … +72h], step 1h, current at index 48
"""

from __future__ import annotations

import json
import math
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

# ── Paths ─────────────────────────────────────────────────────────────────────

REPO_ROOT   = Path(__file__).resolve().parents[3]
STAGING     = REPO_ROOT / "sites" / "staging"
DATA_DIR    = STAGING / "data"
CLOUDS_DIR  = DATA_DIR / "clouds"
OUT_JSON    = DATA_DIR / "weather_map_now.json"

# ── Region config ─────────────────────────────────────────────────────────────

# Bounding box for cloud raster (Web Mercator friendly extents)
BBOX = {
    "lat_min": 45.0,
    "lat_max": 60.0,
    "lon_min":  5.0,
    "lon_max": 35.0,
}

# Sampling grid for Open-Meteo (NxM points)
GRID_LAT_N = 6
GRID_LON_N = 6
RENDER_SIZE = 256   # output WebP side (square)
BLUR_RADIUS = 3     # Gaussian blur px (removes grid artifacts)

# ── Timeline ──────────────────────────────────────────────────────────────────

TOTAL_FRAMES  = 121
HISTORY_SLOTS = 48   # indices 0..47
CURRENT_IDX   = 48   # index 48 = now
FORECAST_SLOTS = 72  # indices 49..120

# ── Alpha mapping (non-linear, per spec) ──────────────────────────────────────
# cloud_opacity_0_100 → pixel alpha (0–255)

ALPHA_MAP = [
    (0,   10,  0,    15),   # 0–10  → alpha 0–15   (nearly invisible)
    (10,  30,  15,   60),   # 10–30 → alpha 15–60  (thin cloud)
    (30,  60,  60,   140),  # 30–60 → alpha 60–140 (moderate)
    (60,  80,  140,  200),  # 60–80 → alpha 140–200 (thick)
    (80,  100, 200,  242),  # 80–100 → alpha 200–242 (overcast)
]


def opacity_to_alpha(v: float) -> int:
    """Map cloud_opacity_0_100 to pixel alpha 0–255 (non-linear)."""
    v = max(0.0, min(100.0, v))
    for lo, hi, a_lo, a_hi in ALPHA_MAP:
        if lo <= v <= hi:
            t = (v - lo) / (hi - lo) if hi > lo else 0
            return int(a_lo + t * (a_hi - a_lo))
    return 242


# ── Open-Meteo fetch ──────────────────────────────────────────────────────────

OM_BASE = "https://api.open-meteo.com/v1/forecast"


def build_grid() -> list[tuple[float, float]]:
    """Return list of (lat, lon) grid sample points."""
    lats = [BBOX["lat_min"] + i * (BBOX["lat_max"] - BBOX["lat_min"]) / (GRID_LAT_N - 1)
            for i in range(GRID_LAT_N)]
    lons = [BBOX["lon_min"] + j * (BBOX["lon_max"] - BBOX["lon_min"]) / (GRID_LON_N - 1)
            for j in range(GRID_LON_N)]
    return [(lat, lon) for lat in lats for lon in lons]


def fetch_open_meteo(points: list[tuple[float, float]], past_days: int = 2, forecast_days: int = 3) -> list[dict]:
    """
    Fetch hourly cloud_cover for all grid points.
    Returns list of dicts: { lat, lon, times: [...], cloud_cover: [...] }
    """
    results = []
    # Batch up to 10 points per request to stay within URL limits
    BATCH = 10
    for i in range(0, len(points), BATCH):
        batch = points[i:i + BATCH]
        lats = ",".join(f"{p[0]:.4f}" for p in batch)
        lons = ",".join(f"{p[1]:.4f}" for p in batch)
        params = {
            "latitude":       lats,
            "longitude":      lons,
            "hourly":         "cloud_cover",
            "past_days":      str(past_days),
            "forecast_days":  str(forecast_days),
            "timeformat":     "unixtime",
            "timezone":       "UTC",
            "wind_speed_unit": "ms",
        }
        url = OM_BASE + "?" + urllib.parse.urlencode(params)
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            print(f"  [warn] Open-Meteo batch {i//BATCH} failed: {e}", flush=True)
            for lat, lon in batch:
                results.append({"lat": lat, "lon": lon, "times": [], "cloud_cover": []})
            continue

        # API returns list if multiple points, dict if single
        if isinstance(data, dict):
            data = [data]
        for j, point_data in enumerate(data):
            lat, lon = batch[j]
            hourly = point_data.get("hourly", {})
            results.append({
                "lat":         lat,
                "lon":         lon,
                "times":       hourly.get("time", []),
                "cloud_cover": hourly.get("cloud_cover", []),
            })
        time.sleep(0.1)  # polite rate limiting

    return results


# ── Timeline building ──────────────────────────────────────────────────────────

def floor_to_hour(dt: datetime) -> datetime:
    return dt.replace(minute=0, second=0, microsecond=0)


def build_timeline(anchor: datetime) -> list[datetime]:
    """Return list of 121 UTC datetimes: anchor-48h … anchor+72h."""
    return [anchor + timedelta(hours=h - HISTORY_SLOTS) for h in range(TOTAL_FRAMES)]


def slot_phase(idx: int) -> str:
    if idx < CURRENT_IDX:
        return "history"
    if idx == CURRENT_IDX:
        return "current"
    return "forecast"


def slot_confidence(idx: int) -> str:
    if idx <= CURRENT_IDX:
        return "high"
    offset = idx - CURRENT_IDX
    if offset <= 12:
        return "medium"
    if offset <= 36:
        return "medium"
    return "low"


# ── Grid → raster ─────────────────────────────────────────────────────────────

def build_point_timeseries(
    grid_data: list[dict],
    timeline: list[datetime],
) -> list[list[float | None]]:
    """
    For each timeline slot, for each grid point: look up cloud_cover value.
    Returns matrix[frame_idx][point_idx] = cloud_opacity (0–100) or None.
    """
    n_pts = len(grid_data)
    n_frames = len(timeline)

    # Build lookup: point_idx → {unix_time: cloud_cover}
    lookups: list[dict[int, float]] = []
    for pd in grid_data:
        lut: dict[int, float] = {}
        for t, c in zip(pd["times"], pd["cloud_cover"]):
            if c is not None:
                lut[int(t)] = float(c)
        lookups.append(lut)

    matrix: list[list[float | None]] = []
    for slot_dt in timeline:
        unix = int(slot_dt.timestamp())
        row: list[float | None] = []
        for pi in range(n_pts):
            # Exact match or ±30 min tolerance
            val = lookups[pi].get(unix)
            if val is None:
                for delta in range(1, 31):
                    val = lookups[pi].get(unix + delta * 60)
                    if val is not None:
                        break
                    val = lookups[pi].get(unix - delta * 60)
                    if val is not None:
                        break
            row.append(val)
        matrix.append(row)
    return matrix


def interpolate_frame(
    values: list[float | None],
    points: list[tuple[float, float]],
) -> "np.ndarray | None":
    """
    Bilinear interpolation of scattered grid values onto RENDER_SIZE × RENDER_SIZE.
    Returns float32 array [RENDER_SIZE, RENDER_SIZE] with values 0–100, or None if no data.
    """
    if not HAS_PIL:
        return None

    # Filter valid points
    valid = [(points[i], v) for i, v in enumerate(values) if v is not None]
    if not valid:
        return None

    # Build coarse grid (GRID_LAT_N × GRID_LON_N)
    coarse = np.full((GRID_LAT_N, GRID_LON_N), np.nan, dtype=np.float32)
    for (lat, lon), v in valid:
        # Find closest grid cell
        lat_idx = round((lat - BBOX["lat_min"]) / (BBOX["lat_max"] - BBOX["lat_min"]) * (GRID_LAT_N - 1))
        lon_idx = round((lon - BBOX["lon_min"]) / (BBOX["lon_max"] - BBOX["lon_min"]) * (GRID_LON_N - 1))
        lat_idx = max(0, min(GRID_LAT_N - 1, lat_idx))
        lon_idx = max(0, min(GRID_LON_N - 1, lon_idx))
        coarse[lat_idx, lon_idx] = v

    # Fill NaN with nearest valid (simple fallback)
    from numpy import ma
    mask = np.isnan(coarse)
    if mask.all():
        return None
    if mask.any():
        # nearest-neighbor fill
        filled = coarse.copy()
        rows, cols = np.where(~mask)
        for r, c in zip(*np.where(mask)):
            dists = (rows - r) ** 2 + (cols - c) ** 2
            nearest = np.argmin(dists)
            filled[r, c] = coarse[rows[nearest], cols[nearest]]
        coarse = filled

    # Upsample to RENDER_SIZE using PIL resize (bilinear)
    # Note: lat is Y-axis (flip: lat_min is bottom = max pixel row)
    coarse_flipped = np.flipud(coarse)  # lat_max at top
    img_coarse = Image.fromarray(coarse_flipped.astype(np.float32), mode="F")
    img_large  = img_coarse.resize((RENDER_SIZE, RENDER_SIZE), Image.BILINEAR)
    return np.array(img_large, dtype=np.float32)


def render_frame_webp(grid_values: "np.ndarray", dest: Path) -> bool:
    """
    Render cloud opacity grid to WebP RGBA image.
    Clouds = white (255,255,255), alpha from non-linear mapping.
    """
    if not HAS_PIL:
        return False

    h, w = grid_values.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = 255  # R
    rgba[:, :, 1] = 255  # G
    rgba[:, :, 2] = 255  # B

    # Vectorized alpha mapping
    alpha = np.zeros((h, w), dtype=np.float32)
    v = grid_values
    for lo, hi, a_lo, a_hi in ALPHA_MAP:
        mask = (v >= lo) & (v <= hi)
        if not mask.any():
            continue
        t = np.clip((v[mask] - lo) / (hi - lo), 0, 1)
        alpha[mask] = a_lo + t * (a_hi - a_lo)

    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)

    img = Image.fromarray(rgba, "RGBA")

    # Gaussian blur to soften grid artifacts
    img = img.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=85)
    return True


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run() -> None:
    t0 = time.time()
    print("[weather-map] Starting cloud layer pipeline", flush=True)

    if not HAS_PIL:
        print("[weather-map] ERROR: Pillow/numpy not installed. Run: pip install Pillow numpy", flush=True)
        sys.exit(1)

    anchor = floor_to_hour(datetime.now(timezone.utc))
    print(f"[weather-map] Anchor: {anchor.isoformat()}", flush=True)

    timeline = build_timeline(anchor)

    # Step 1: Build sample grid
    points = build_grid()
    print(f"[weather-map] Grid: {len(points)} points ({GRID_LAT_N}×{GRID_LON_N})", flush=True)

    # Step 2: Fetch Open-Meteo data
    print("[weather-map] Fetching Open-Meteo (ERA5 history + forecast)...", flush=True)
    grid_data = fetch_open_meteo(points, past_days=2, forecast_days=3)
    print(f"[weather-map] Fetched {len(grid_data)} point series", flush=True)

    # Step 3: Build per-slot value matrix
    matrix = build_point_timeseries(grid_data, timeline)

    # Step 4: Render frames
    CLOUDS_DIR.mkdir(parents=True, exist_ok=True)
    frame_refs: list[dict] = []
    rendered = 0
    skipped  = 0

    for idx, slot_dt in enumerate(timeline):
        values     = matrix[idx]
        frame_name = f"cloud_{idx:03d}.webp"
        frame_path = CLOUDS_DIR / frame_name
        asset_url  = f"/data/clouds/{frame_name}"
        phase      = slot_phase(idx)
        confidence = slot_confidence(idx)

        grid = interpolate_frame(values, points)
        available = False
        if grid is not None:
            ok = render_frame_webp(grid, frame_path)
            available = ok
            if ok:
                rendered += 1
            else:
                skipped += 1
        else:
            skipped += 1
            # Remove stale frame if exists
            if frame_path.exists():
                frame_path.unlink()

        frame_refs.append({
            "index":      idx,
            "t_utc":      slot_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "phase":      phase,
            "confidence": confidence,
            "available":  available,
            "asset_type": "image",
            "asset_url":  asset_url if available else None,
            "meta": {
                "source_kind": "model",
                "source_name": "open-meteo",
            },
        })

        if idx % 20 == 0:
            print(f"  [{idx:3d}/{TOTAL_FRAMES}] {slot_dt.strftime('%Y-%m-%d %H:%M')} UTC  phase={phase}", flush=True)

    elapsed = time.time() - t0
    print(f"[weather-map] Rendered {rendered} frames, {skipped} unavailable  ({elapsed:.1f}s)", flush=True)

    # Step 5: Write data contract
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    contract = {
        "schema_version": "1.0",
        "updated_utc":    now_utc,
        "source": {
            "domain":   "weather",
            "dataset":  "weather_map_now",
            "products": ["open-meteo-cloud-cover"],
        },
        "viewport": {
            "bbox": BBOX,
            "default_zoom": 5,
            "min_zoom":     4,
            "max_zoom":     8,
        },
        "timeline": {
            "anchor_utc":    anchor.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "step_hours":    1,
            "total_frames":  TOTAL_FRAMES,
            "current_index": CURRENT_IDX,
            "frames":        frame_refs,
        },
        "layers": {
            "clouds": {
                "id":                "clouds",
                "enabled_by_default": True,
                "available":         rendered > 0,
                "render": {
                    "type":       "image_overlay",
                    "bounds":     [[BBOX["lat_min"], BBOX["lon_min"]], [BBOX["lat_max"], BBOX["lon_max"]]],
                    "opacity":    0.75,
                    "blend_mode": "normal",
                },
            },
            "isobars": {
                "id":                "isobars",
                "enabled_by_default": False,
                "available":         False,
            },
            "wind": {
                "id":                "wind",
                "enabled_by_default": False,
                "available":         False,
            },
        },
        "playback": {
            "player_id":          "global_time_player",
            "shared":             True,
            "recommended_fps":    1,
            "supported_actions":  ["play", "pause", "step_forward", "step_back", "scrub"],
        },
        "stats": {
            "rendered_frames": rendered,
            "skipped_frames":  skipped,
            "elapsed_sec":     round(elapsed, 1),
            "render_size_px":  RENDER_SIZE,
            "grid_points":     len(points),
        },
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(contract, f, indent=2, ensure_ascii=False)

    print(f"[weather-map] Written {OUT_JSON}", flush=True)
    print(f"[weather-map] Done in {elapsed:.1f}s", flush=True)


if __name__ == "__main__":
    run()
