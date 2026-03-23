"""
gen_weather_map.py — Cloud + Wind + Isobars Layer Pipeline v1.5

Generates zoom-aware cloud profiles, wind vector frames, and pressure isobar overlays:
  - sites/staging/data/clouds/{profile_id}/cloud_NNN.webp   (121 frames × 3 profiles)
  - sites/staging/data/wind/{profile_id}/wind_NNN.json      (121 frames × 3 profiles)
  - sites/staging/data/isobars/{profile_id}/isobar_NNN.webp (121 frames × 3 profiles)
  - sites/staging/data/weather_map_now.json   (data contract v1.5)

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

# ── Profile definitions ───────────────────────────────────────────────────────

# Internal raster profiles (pipeline generates WebP frames for these)
PROFILES: list[dict] = [
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
    variables: str = "cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
) -> list[dict]:
    """Fetch hourly fields for all grid points in batches of 10.

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
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            print(f"  [warn] Open-Meteo batch {i // BATCH} failed: {e}", flush=True)
            for lat, lon in batch:
                results.append({
                    "lat": lat, "lon": lon, "times": [],
                    "cloud_cover": [], "pressure_msl": [],
                    "wind_speed": [], "wind_direction": [],
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
                "pressure_msl":   hourly.get("pressure_msl", []),
                "wind_speed":     hourly.get("wind_speed_10m", []),
                "wind_direction": hourly.get("wind_direction_10m", []),
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
    forecast_days: int = 3,
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

    print(f"\n[weather-map] Profile: {pid}  zoom {profile['zoom_min']}–{profile['zoom_max']}", flush=True)
    print(f"  bbox: lat {bbox['lat_min']}–{bbox['lat_max']}, lon {bbox['lon_min']}–{bbox['lon_max']}", flush=True)

    # Cloud + pressure grid (coarse — used for raster interpolation and isobars)
    points    = build_grid(bbox, lat_n, lon_n)
    print(f"  Cloud/pressure grid: {len(points)} pts ({lat_n}×{lon_n})", flush=True)
    grid_data = fetch_open_meteo(points, past_days, forecast_days)
    print(f"  Fetched {len(grid_data)} cloud/pressure series", flush=True)

    cloud_matrix   = build_point_timeseries(grid_data, timeline)
    isobar_matrix  = build_scalar_timeseries(grid_data, timeline, "pressure_msl")

    # Wind grid (denser — used for particle animation layer AND pressure isobars)
    if wind_lat_n != lat_n or wind_lon_n != lon_n:
        wind_points = build_grid(bbox, wind_lat_n, wind_lon_n)
        print(f"  Wind grid:  {len(wind_points)} pts ({wind_lat_n}×{wind_lon_n})", flush=True)
        wind_grid_data = fetch_open_meteo(
            wind_points, past_days, forecast_days,
            # Include pressure_msl so isobars benefit from the denser grid at no extra cost
            variables="wind_speed_10m,wind_direction_10m,pressure_msl",
        )
        print(f"  Fetched {len(wind_grid_data)} wind/pressure series", flush=True)
    else:
        wind_points    = points
        wind_grid_data = grid_data

    wind_matrix   = build_wind_timeseries(wind_grid_data, timeline)
    # Isobars reuse the dense wind grid for much better spatial detail
    isobar_matrix = build_scalar_timeseries(wind_grid_data, timeline, "pressure_msl")

    cloud_dir   = CLOUDS_DIR / pid
    wind_dir    = WIND_DIR / pid
    isobar_dir  = ISOBARS_DIR / pid
    cloud_dir.mkdir(parents=True, exist_ok=True)
    wind_dir.mkdir(parents=True, exist_ok=True)
    isobar_dir.mkdir(parents=True, exist_ok=True)

    cloud_refs:  list[dict] = []
    wind_refs:   list[dict] = []
    isobar_refs: list[dict] = []
    rendered = skipped = 0

    for idx, slot_dt in enumerate(timeline):
        # ── Cloud frame ───────────────────────────────────────────────────────
        values     = cloud_matrix[idx]
        frame_name = f"cloud_{idx:03d}.webp"
        frame_path = cloud_dir / frame_name
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

        cloud_refs.append({
            "index":     idx,
            "available": available,
            "asset_url": asset_url if available else None,
        })

        # ── Wind frame ────────────────────────────────────────────────────────
        wind_frame = build_wind_frame_json(wind_matrix[idx], wind_points, idx, slot_dt)
        wind_name  = f"wind_{idx:03d}.json"
        wind_path  = wind_dir / wind_name
        wind_url   = f"/data/wind/{pid}/{wind_name}"

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

        # ── Isobar frame (SVG — vector, scales without pixelation) ───────────
        iso_values  = isobar_matrix[idx]
        iso_name    = f"isobar_{idx:03d}.svg"
        iso_path    = isobar_dir / iso_name
        iso_url     = f"/data/isobars/{pid}/{iso_name}"

        iso_ok = render_isobar_frame_svg(
            iso_values, wind_points, bbox, wind_lat_n, wind_lon_n, isobar_render_size, iso_path
        )
        if not iso_ok and iso_path.exists():
            iso_path.unlink()

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
    return cloud_refs, wind_refs, isobar_refs, rendered, skipped


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run() -> None:
    t0 = time.time()
    print("[weather-map] Starting cloud + wind + isobar layer pipeline v1.5", flush=True)

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
    wind_profile_manifests: list[dict] = []
    isobar_profile_manifests: list[dict] = []
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
        cloud_refs, wind_refs, isobar_refs, rendered, skipped = run_profile(profile, timeline)
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
