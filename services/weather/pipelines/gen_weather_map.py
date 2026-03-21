"""
gen_weather_map.py — Cloud Layer Pipeline v1.2

Generates zoom-aware cloud profiles:
  - sites/staging/data/clouds/{profile_id}/cloud_NNN.webp  (121 frames × 3 profiles)
  - sites/staging/data/weather_map_now.json   (data contract v1.2)

Hybrid cloud architecture (spec #266):
  world_external — zoom 0–5  — external tile layer (OpenWeatherMap), no frames generated
  eu_wide        — zoom 6–8  — internal raster, lat 30–72°N, lon −15–50°E
  eu_central     — zoom 9–11 — internal raster, lat 45–60°N, lon   5–35°E
  local          — zoom 12+  — internal raster, lat 48–57°N, lon  12–30°E

All internal profiles share the same 121-frame timeline (identical indexes, t_utc values).
External profile uses Mode A (live latest tiles, no timeline alignment).

Env vars:
  OWM_API_KEY — OpenWeatherMap API key; if absent world_external is available=false
"""

from __future__ import annotations

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

# ── Paths ─────────────────────────────────────────────────────────────────────

REPO_ROOT  = Path(__file__).resolve().parents[3]
STAGING    = REPO_ROOT / "sites" / "staging"
DATA_DIR   = STAGING / "data"
CLOUDS_DIR = DATA_DIR / "clouds"
OUT_JSON   = DATA_DIR / "weather_map_now.json"

# ── Profile definitions ───────────────────────────────────────────────────────

# Internal raster profiles (pipeline generates WebP frames for these)
PROFILES: list[dict] = [
    {
        "id":          "eu_wide",
        "zoom_min":    6,
        "zoom_max":    8,
        "bbox":        {"lat_min": 30.0, "lat_max": 72.0, "lon_min": -15.0, "lon_max": 50.0},
        "grid_lat_n":  6,
        "grid_lon_n":  8,   # wider bbox → more lon samples
        "render_size": 256,
        "blur_radius": 4,
    },
    {
        "id":          "eu_central",
        "zoom_min":    9,
        "zoom_max":    11,
        "bbox":        {"lat_min": 45.0, "lat_max": 60.0, "lon_min":  5.0, "lon_max": 35.0},
        "grid_lat_n":  6,
        "grid_lon_n":  6,
        "render_size": 256,
        "blur_radius": 3,
    },
    {
        "id":          "local",
        "zoom_min":    12,
        "zoom_max":    18,
        "bbox":        {"lat_min": 48.0, "lat_max": 57.0, "lon_min": 12.0, "lon_max": 30.0},
        "grid_lat_n":  6,
        "grid_lon_n":  6,
        "render_size": 256,
        "blur_radius": 2,
    },
]

# External tile profile (no pipeline work needed, just metadata in manifest)
EXTERNAL_PROFILE_ID = "world_external"
EXTERNAL_PROFILE_ZOOM_MIN = 0
EXTERNAL_PROFILE_ZOOM_MAX = 5

# ── Timeline ──────────────────────────────────────────────────────────────────

TOTAL_FRAMES   = 121
HISTORY_SLOTS  = 48    # indices 0..47
CURRENT_IDX    = 48    # index 48 = now
FORECAST_SLOTS = 72    # indices 49..120

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


def build_grid(bbox: dict, lat_n: int, lon_n: int) -> list[tuple[float, float]]:
    """Return (lat, lon) sample points for given bbox and grid dimensions."""
    lats = [bbox["lat_min"] + i * (bbox["lat_max"] - bbox["lat_min"]) / (lat_n - 1)
            for i in range(lat_n)]
    lons = [bbox["lon_min"] + j * (bbox["lon_max"] - bbox["lon_min"]) / (lon_n - 1)
            for j in range(lon_n)]
    return [(lat, lon) for lat in lats for lon in lons]


def fetch_open_meteo(
    points: list[tuple[float, float]],
    past_days: int = 2,
    forecast_days: int = 3,
) -> list[dict]:
    """Fetch hourly cloud_cover for all grid points in batches of 10."""
    results = []
    BATCH = 10
    for i in range(0, len(points), BATCH):
        batch = points[i:i + BATCH]
        params = {
            "latitude":       ",".join(f"{p[0]:.4f}" for p in batch),
            "longitude":      ",".join(f"{p[1]:.4f}" for p in batch),
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
            print(f"  [warn] Open-Meteo batch {i // BATCH} failed: {e}", flush=True)
            for lat, lon in batch:
                results.append({"lat": lat, "lon": lon, "times": [], "cloud_cover": []})
            continue

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
        time.sleep(0.1)

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


# ── Grid → raster ─────────────────────────────────────────────────────────────

def build_point_timeseries(
    grid_data: list[dict],
    timeline:  list[datetime],
) -> list[list[float | None]]:
    """Build matrix[frame_idx][point_idx] = cloud_opacity (0–100) or None."""
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


# ── Per-profile pipeline ──────────────────────────────────────────────────────

def run_profile(
    profile:       dict,
    timeline:      list[datetime],
    past_days:     int = 2,
    forecast_days: int = 3,
) -> tuple[list[dict], int, int]:
    """
    Run full pipeline for one profile.
    Returns (frame_refs, rendered_count, skipped_count).
    frame_refs: [{index, available, asset_url}]
    """
    pid         = profile["id"]
    bbox        = profile["bbox"]
    lat_n       = profile["grid_lat_n"]
    lon_n       = profile["grid_lon_n"]
    render_size = profile.get("render_size", 256)
    blur_radius = profile.get("blur_radius", 3)

    print(f"\n[weather-map] Profile: {pid}  zoom {profile['zoom_min']}–{profile['zoom_max']}", flush=True)
    print(f"  bbox: lat {bbox['lat_min']}–{bbox['lat_max']}, lon {bbox['lon_min']}–{bbox['lon_max']}", flush=True)

    points    = build_grid(bbox, lat_n, lon_n)
    print(f"  Grid: {len(points)} pts ({lat_n}×{lon_n})", flush=True)

    grid_data = fetch_open_meteo(points, past_days, forecast_days)
    print(f"  Fetched {len(grid_data)} series", flush=True)

    matrix      = build_point_timeseries(grid_data, timeline)
    profile_dir = CLOUDS_DIR / pid
    profile_dir.mkdir(parents=True, exist_ok=True)

    frame_refs: list[dict] = []
    rendered = skipped = 0

    for idx, slot_dt in enumerate(timeline):
        values     = matrix[idx]
        frame_name = f"cloud_{idx:03d}.webp"
        frame_path = profile_dir / frame_name
        asset_url  = f"/data/clouds/{pid}/{frame_name}"

        grid      = interpolate_frame(values, points, bbox, lat_n, lon_n, render_size)
        available = False
        if grid is not None:
            ok        = render_frame_webp(grid, frame_path, blur_radius=blur_radius)
            available = ok
            if ok: rendered += 1
            else:  skipped  += 1
        else:
            skipped += 1
            if frame_path.exists():
                frame_path.unlink()

        frame_refs.append({
            "index":     idx,
            "available": available,
            "asset_url": asset_url if available else None,
        })

        if idx % 20 == 0:
            print(f"  [{pid}][{idx:3d}/{len(timeline)}] {slot_dt.strftime('%Y-%m-%d %H:%M')} UTC", flush=True)

    print(f"  [{pid}] rendered={rendered} skipped={skipped}", flush=True)
    return frame_refs, rendered, skipped


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run() -> None:
    t0 = time.time()
    print("[weather-map] Starting cloud layer pipeline v1.1", flush=True)

    if not HAS_PIL:
        print("[weather-map] ERROR: Pillow/numpy not installed. Run: pip install Pillow numpy", flush=True)
        sys.exit(1)

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
    total_rendered = total_skipped = 0

    # Build world_external profile entry (no pipeline run, just metadata)
    owm_key = os.environ.get("OWM_API_KEY", "").strip()
    world_external_manifest = {
        "id":               EXTERNAL_PROFILE_ID,
        "kind":             "external_tiles",
        "zoom_min":         EXTERNAL_PROFILE_ZOOM_MIN,
        "zoom_max":         EXTERNAL_PROFILE_ZOOM_MAX,
        "bbox":             None,
        "bounds":           None,
        "tile_url_template": (
            f"https://tile.openweathermap.org/map/clouds_new/{{z}}/{{x}}/{{y}}.png?appid={owm_key}"
            if owm_key else None
        ),
        "frames":           None,
        "available":        bool(owm_key),
        "meta": {
            "source_kind":   "external_tiles",
            "source_name":   "OpenWeatherMap",
            "timeline_mode": "live_latest",
            "styling_mode":  "provider_native",
            "source_owned":  False,
        },
    }
    profile_manifests.append(world_external_manifest)
    if owm_key:
        print(f"[weather-map] External profile: world_external (OWM key configured)", flush=True)
    else:
        print(f"[weather-map] External profile: world_external (OWM_API_KEY not set → available=false)", flush=True)

    for profile in PROFILES:
        frame_refs, rendered, skipped = run_profile(profile, timeline)
        total_rendered += rendered
        total_skipped  += skipped
        bbox = profile["bbox"]
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
            "frames":           frame_refs,
            "meta": {
                "source_kind":   "internal_raster",
                "source_name":   "nebulacast/open-meteo",
                "timeline_mode": "time_addressable",
                "styling_mode":  "internal_style",
                "source_owned":  True,
            },
        })

    elapsed = time.time() - t0
    print(f"\n[weather-map] Total: rendered={total_rendered} skipped={total_skipped}  ({elapsed:.1f}s)", flush=True)

    now_utc  = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    contract = {
        "schema_version": "1.2",
        "updated_utc":    now_utc,
        "source": {
            "domain":   "weather",
            "dataset":  "weather_map_now",
            "products": ["open-meteo-cloud-cover"],
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
            "isobars": {"id": "isobars", "enabled_by_default": False, "available": False},
            "wind":    {"id": "wind",    "enabled_by_default": False, "available": False},
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

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(contract, f, indent=2, ensure_ascii=False)

    print(f"[weather-map] Written {OUT_JSON}", flush=True)
    print(f"[weather-map] Done in {elapsed:.1f}s", flush=True)


if __name__ == "__main__":
    run()
