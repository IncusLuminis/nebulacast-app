"""
gen_grib_tiles.py — GRIB-based Global Cloud Tile Pipeline v1.0

Downloads GFS TCDC (total cloud cover) from NOAA NOMADS, generates z/x/y WebP
tile pyramids aligned to the master weather-map timeline (spec #267).

Pipeline:
  1. Resolve latest available GFS run (00/06/12/18 Z) via .idx probe (NOMADS / AWS S3)
  2. Download TCDC GRIB2 message via .idx byte-range for f000–f120 (frames 48–168)
  3. Parse + shift lon from [0,360) to [-180,180)
  4. Render z/x/y WebP tile pyramid (zoom 0–4) per frame
  5. Write per-run tile manifest + latest.json pointer

Output paths (relative to repo root):
  sites/staging/data/clouds/tiles/{run_id}/{frame_index:03d}/{z}/{x}/{y}.webp
  sites/staging/data/tile_manifests/{run_id}.json
  sites/staging/data/tile_manifests/latest.json

Master timeline alignment:
  Total frames : 121  (index 0 = t−48h … index 120 = t+72h)
  Current frame: 48   (t±0)
  Generated    : frames 48–120 = GFS f000–f072 (forecast+analysis only)
  History frames (0–47) are not generated in v1.0; the frontend falls back
  to the OWM external layer or hides the cloud overlay for those frames.

Env vars:
  GRIB_TILES_SKIP_DOWNLOAD=1  — reuse already-cached GRIB2 files (dev mode)
"""

from __future__ import annotations

import io
import json
import math
import os
import shutil
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from PIL import Image, ImageFilter
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import eccodes
    HAS_ECCODES = True
except ImportError:
    HAS_ECCODES = False

# ── Paths ─────────────────────────────────────────────────────────────────────

REPO_ROOT    = Path(__file__).resolve().parents[3]
STAGING      = REPO_ROOT / "sites" / "staging"
DATA_DIR     = STAGING / "data"
TILES_DIR    = DATA_DIR / "clouds" / "tiles"
MANIFESTS_DIR = DATA_DIR / "tile_manifests"
GRIB_CACHE   = DATA_DIR / "_cache" / "grib"

# ── Pipeline constants ────────────────────────────────────────────────────────

TILE_SIZE    = 256
ZOOM_MIN     = 0
ZOOM_MAX     = 3   # z=4 would produce ~41k tiles/run, exceeding CF Pages 20k limit

TOTAL_FRAMES = 169
CURRENT_IDX  = 48   # master timeline frame index = t+0h

# We generate frames CURRENT_IDX .. TOTAL_FRAMES-1 (121 frames: f000–f120)
TILE_FRAME_MIN = CURRENT_IDX       # 48
TILE_FRAME_MAX = TOTAL_FRAMES - 1  # 168

# GFS forecast hour for a given master-timeline frame index
def _fhour(frame_idx: int) -> int:
    return frame_idx - CURRENT_IDX  # 0..120

# ── Cloud opacity mapping (matches raster pipeline ALPHA_MAP) ─────────────────

_ALPHA_BREAKPOINTS = [
    (0,   10,  0,    15),
    (10,  30,  15,   60),
    (30,  60,  60,   140),
    (60,  80,  140,  200),
    (80,  100, 200,  242),
]

def _cloud_to_alpha_array(values: "np.ndarray") -> "np.ndarray":
    """Map cloud cover 0–100 → alpha 0–242 (vectorised, matching raster pipeline)."""
    alpha = np.zeros_like(values, dtype=np.float32)
    for v_lo, v_hi, a_lo, a_hi in _ALPHA_BREAKPOINTS:
        mask = (values >= v_lo) & (values < v_hi)
        t = (values - v_lo) / (v_hi - v_lo)
        alpha = np.where(mask, a_lo + t * (a_hi - a_lo), alpha)
    # catch v==100
    alpha = np.where(values >= 100, 242.0, alpha)
    return np.clip(alpha, 0, 242).astype(np.uint8)

# Cloud tile color (light silvery-white, same visual family as raster overlays)
CLOUD_R, CLOUD_G, CLOUD_B = 210, 215, 225

# ── GFS data sources ──────────────────────────────────────────────────────────
# Strategy: use .idx (index) files to locate the TCDC byte-range, then HTTP Range
# to download only ~50–80 KB instead of the full 300 MB+ GRIB2 file.
# NOMADS is authoritative; AWS S3 open-data mirror is the fallback.

_NOMADS_BASE = (
    "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod"
    "/gfs.{date}/{run:02d}/atmos/gfs.t{run:02d}z.pgrb2.0p25.f{fhour:03d}"
)
_AWS_BASE = (
    "https://noaa-gfs-bdp-pds.s3.amazonaws.com"
    "/gfs.{date}/{run:02d}/atmos/gfs.t{run:02d}z.pgrb2.0p25.f{fhour:03d}"
)

# GFS grid: 721 lat (90→−90) × 1440 lon (0→359.75)
GFS_NJ = 721
GFS_NI = 1440
GFS_LAT0 =  90.0
GFS_LON0 =   0.0
GFS_DLAT = -180.0 / (GFS_NJ - 1)   # −0.25°
GFS_DLON =  360.0 / GFS_NI          # +0.25°


def _candidate_urls(date_str: str, run_hour: int, fhour: int) -> list[str]:
    ctx = dict(date=date_str, run=run_hour, fhour=fhour)
    return [_NOMADS_BASE.format(**ctx), _AWS_BASE.format(**ctx)]


def _fetch_idx(base_url: str, timeout: int = 20) -> str | None:
    """
    Fetch the .idx text file for a GFS GRIB2.  The index lists every message
    with its byte offset (~50–200 KB total).  Returns raw text or None on error.

    .idx line format:
      MSG_NUM:BYTE_OFFSET:d=DATETIME:SHORT_NAME:LEVEL:FORECAST:
    """
    idx_url = base_url + ".idx"
    try:
        req = urllib.request.Request(idx_url, headers={"User-Agent": "nebulacast-grib/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status not in (200, 206):
                return None
            data = resp.read(512 * 1024)   # 512 KB cap — plenty for any .idx
            return data.decode("ascii", errors="replace")
    except Exception:
        return None


def _parse_tcdc_range(idx_text: str) -> tuple[int, int | None]:
    """
    Parse a .idx file and return (start_byte, end_byte|None) for the
    TCDC/entire-atmosphere message.  end_byte=None means read to EOF.
    Raises ValueError if TCDC is not found.
    """
    lines = idx_text.strip().splitlines()
    for i, line in enumerate(lines):
        parts = line.split(":")
        if len(parts) < 5:
            continue
        short_name = parts[3].strip()
        level      = parts[4].strip().lower()
        if short_name == "TCDC" and "entire atmosphere" in level:
            start_byte = int(parts[1])
            end_byte: int | None = None
            if i + 1 < len(lines):
                nxt = lines[i + 1].split(":")
                if len(nxt) >= 2:
                    end_byte = int(nxt[1]) - 1
            return start_byte, end_byte
    raise ValueError("TCDC/entire-atmosphere not found in .idx")


def _range_download(base_url: str, start: int, end: int | None, timeout: int = 60) -> bytes:
    """HTTP Range request → returns raw GRIB2 message bytes (~40–80 KB)."""
    hdr = f"bytes={start}-" if end is None else f"bytes={start}-{end}"
    req = urllib.request.Request(
        base_url,
        headers={"Range": hdr, "User-Agent": "nebulacast-grib/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


# ── Run discovery ─────────────────────────────────────────────────────────────

def find_latest_gfs_run() -> tuple[str, int, datetime]:
    """
    Return (date_str 'YYYYMMDD', run_hour 0/6/12/18, run_datetime_utc) for the
    most recent GFS run whose f024 .idx file is reachable.
    Tries NOMADS first, then AWS S3.  Looks up to 5 slots back (30 h).
    """
    now = datetime.now(timezone.utc)
    candidate = now - timedelta(hours=4)          # allow ~4 h for data to land
    run_hour  = (candidate.hour // 6) * 6
    candidate = candidate.replace(hour=run_hour, minute=0, second=0, microsecond=0)

    for _ in range(5):
        date_str = candidate.strftime("%Y%m%d")
        rh       = candidate.hour
        print(f"[grib-tiles] Probing GFS run {date_str} {rh:02d}Z … ", end="", flush=True)
        for base_url in _candidate_urls(date_str, rh, 24):
            idx_text = _fetch_idx(base_url)
            if idx_text and "TCDC" in idx_text:
                src = "NOMADS" if "nomads" in base_url else "AWS-S3"
                print(f"available ({src})", flush=True)
                return date_str, rh, candidate
        print("not yet / unavailable", flush=True)
        candidate -= timedelta(hours=6)

    raise RuntimeError("No available GFS run found in last 30 h (NOMADS + AWS S3)")


# ── GRIB download ─────────────────────────────────────────────────────────────

def download_tcdc(date_str: str, run_hour: int, fhour: int) -> Path:
    """
    Fetch only the TCDC GRIB2 message for the given forecast hour using
    .idx byte-range download (~50–80 KB vs 300 MB full file).
    Caches result locally; skips network if cached file is valid.
    """
    GRIB_CACHE.mkdir(parents=True, exist_ok=True)
    fname = f"gfs_{date_str}_{run_hour:02d}z_f{fhour:03d}_tcdc.grib2"
    path  = GRIB_CACHE / fname

    if path.exists() and path.stat().st_size > 1000:
        print(f"  [cache] {fname}", flush=True)
        return path

    print(f"  [fetch] f{fhour:03d} … ", end="", flush=True)
    t0       = time.time()
    last_exc: Exception | None = None

    for base_url in _candidate_urls(date_str, run_hour, fhour):
        try:
            idx_text = _fetch_idx(base_url)
            if not idx_text:
                raise IOError("Empty or missing .idx")
            start, end = _parse_tcdc_range(idx_text)
            raw = _range_download(base_url, start, end)
            if len(raw) < 100:
                raise IOError(f"Range response too small ({len(raw)} B)")
            if not raw.startswith(b"GRIB"):
                raise ValueError("Response is not a GRIB2 message (bad magic bytes)")
            path.with_suffix(".tmp").write_bytes(raw)
            path.with_suffix(".tmp").rename(path)
            src = "NOMADS" if "nomads" in base_url else "AWS-S3"
            print(f"{len(raw) // 1024} KB  ({time.time()-t0:.1f}s) [{src}]", flush=True)
            return path
        except Exception as exc:
            last_exc = exc
            continue

    raise IOError(f"f{fhour:03d} TCDC download failed from all sources: {last_exc}")


# ── GRIB parsing ──────────────────────────────────────────────────────────────

def parse_tcdc_grib(path: Path) -> "np.ndarray":
    """
    Parse a GRIB2 file containing one TCDC message.
    Returns float32 array shape (721, 1440), values 0–100 (%), lon shifted to
    [-180, 180) so grid[i, j] corresponds to:
        lat = 90 − i * 0.25
        lon = −180 + j * 0.25
    """
    if not HAS_ECCODES:
        raise RuntimeError("eccodes not installed — cannot parse GRIB2")
    if not HAS_NUMPY:
        raise RuntimeError("numpy not installed")

    with open(path, "rb") as fh:
        while True:
            gid = eccodes.codes_grib_new_from_file(fh)
            if gid is None:
                raise ValueError(f"No GRIB messages found in {path}")
            try:
                nj = eccodes.codes_get(gid, "Nj")
                ni = eccodes.codes_get(gid, "Ni")
                vals = np.array(eccodes.codes_get_values(gid), dtype=np.float32)
                grid = vals.reshape(nj, ni)
                # GFS TCDC is already in 0–100 % range; handle rare 0–1 encoding
                if grid.max() <= 1.01:
                    grid *= 100.0
                # Shift lon axis from [0,360) to [-180,180): roll by NI/2
                grid = np.roll(grid, GFS_NI // 2, axis=1)
                return grid
            finally:
                eccodes.codes_release(gid)


# ── Tile math ─────────────────────────────────────────────────────────────────

def _tile_lat_lon_bounds(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """Return (lon_min, lat_min, lon_max, lat_max) for tile (z, x, y)."""
    n = 2 ** z
    lon_min = x / n * 360.0 - 180.0
    lon_max = (x + 1) / n * 360.0 - 180.0
    lat_max = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    lat_min = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    return lon_min, lat_min, lon_max, lat_max


def _render_tile(
    grid: "np.ndarray",
    z: int, x: int, y: int,
    tile_size: int = TILE_SIZE,
    blur_radius: float = 0.8,
) -> bytes:
    """
    Render a single WebP tile from the global TCDC grid.

    grid: float32 (721, 1440), lat 90→-90 top-to-bottom, lon -180→179.75 left-to-right.
    Returns raw WebP bytes.
    """
    lon_min, _lat_min, lon_max, lat_max_ignored = _tile_lat_lon_bounds(z, x, y)
    n = 2 ** z

    # ── Pixel latitudes (Mercator, non-uniform) ───────────────────────────────
    py_arr = np.arange(tile_size, dtype=np.float64)
    # y-tile pixel fraction (0=top, tile_size-1=bottom) → latitude
    frac_y = (y + (py_arr + 0.5) / tile_size) / n
    lat_arr = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * frac_y))))  # (tile_size,)

    # ── Pixel longitudes (linear) ─────────────────────────────────────────────
    px_arr = np.arange(tile_size, dtype=np.float64)
    lon_arr = lon_min + (px_arr + 0.5) / tile_size * (lon_max - lon_min)  # (tile_size,)
    # Wrap to [-180, 180)
    lon_arr = ((lon_arr + 180.0) % 360.0) - 180.0

    # ── Grid index (floating-point) ───────────────────────────────────────────
    # lat: grid row 0 = 90N, row 720 = 90S  →  i_float = (90 - lat) / 0.25
    lat_idx = np.clip((90.0 - lat_arr) / 0.25, 0.0, GFS_NJ - 1.001)  # (tile_size,)
    # lon: grid col 0 = -180E, col 1439 = 179.75E  →  j_float = (lon + 180) / 0.25
    lon_idx = np.clip((lon_arr + 180.0) / 0.25, 0.0, GFS_NI - 1.001)  # (tile_size,)

    lat_i = lat_idx.astype(np.int32)
    lon_i = lon_idx.astype(np.int32)
    lat_f = (lat_idx - lat_i)[:, np.newaxis]  # (tile_size, 1)
    lon_f = (lon_idx - lon_i)[np.newaxis, :]  # (1, tile_size)

    lat_i1 = np.minimum(lat_i + 1, GFS_NJ - 1)
    lon_i1 = np.minimum(lon_i + 1, GFS_NI - 1)

    # 2-D index grids
    Li  = lat_i[:, np.newaxis]
    Li1 = lat_i1[:, np.newaxis]
    Lj  = lon_i[np.newaxis, :]
    Lj1 = lon_i1[np.newaxis, :]

    # Bilinear interpolation → (tile_size, tile_size)
    v00 = grid[Li,  Lj]
    v01 = grid[Li,  Lj1]
    v10 = grid[Li1, Lj]
    v11 = grid[Li1, Lj1]
    values = (v00 * (1 - lat_f) * (1 - lon_f)
            + v01 * (1 - lat_f) * lon_f
            + v10 * lat_f       * (1 - lon_f)
            + v11 * lat_f       * lon_f)

    # ── RGBA image ────────────────────────────────────────────────────────────
    alpha = _cloud_to_alpha_array(values)  # (tile_size, tile_size) uint8
    rgb   = np.full((tile_size, tile_size, 3), [CLOUD_R, CLOUD_G, CLOUD_B], dtype=np.uint8)
    rgba  = np.dstack([rgb, alpha])         # (tile_size, tile_size, 4)

    img = Image.fromarray(rgba, "RGBA")
    if blur_radius > 0:
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=85, method=4)
    return buf.getvalue()


# ── Frame → tiles ─────────────────────────────────────────────────────────────

def generate_frame_tiles(
    grid: "np.ndarray",
    run_id: str,
    frame_index: int,
    zoom_min: int = ZOOM_MIN,
    zoom_max: int = ZOOM_MAX,
) -> int:
    """
    Render all tiles for one frame and write them to disk.
    Returns number of tiles written.
    """
    frame_dir = TILES_DIR / run_id / f"{frame_index:03d}"
    count = 0
    for z in range(zoom_min, zoom_max + 1):
        n = 2 ** z
        for x in range(n):
            for y in range(n):
                out = frame_dir / str(z) / str(x) / f"{y}.webp"
                out.parent.mkdir(parents=True, exist_ok=True)
                webp = _render_tile(grid, z, x, y)
                out.write_bytes(webp)
                count += 1
    return count


# ── Cleanup old runs ──────────────────────────────────────────────────────────

def cleanup_old_runs(current_run_id: str, keep: int = 2) -> None:
    """Remove tile directories for runs other than the most recent `keep`."""
    if not TILES_DIR.exists():
        return
    runs = sorted(
        [d.name for d in TILES_DIR.iterdir() if d.is_dir() and d.name != current_run_id]
    )
    for old in runs[: max(0, len(runs) - keep + 1)]:
        old_path = TILES_DIR / old
        print(f"[grib-tiles] Removing old run tiles: {old_path}", flush=True)
        shutil.rmtree(old_path, ignore_errors=True)


# ── Manifest ──────────────────────────────────────────────────────────────────

def write_manifests(
    run_id: str,
    run_dt: datetime,
    frame_indexes: list[int],
    zoom_min: int,
    zoom_max: int,
    elapsed: float,
) -> None:
    """Write per-run manifest + latest.json pointer."""
    MANIFESTS_DIR.mkdir(parents=True, exist_ok=True)

    # URL template: frontend substitutes {frame_index}, {z}, {x}, {y}
    url_template = f"/data/clouds/tiles/{run_id}/{{frame_index}}/{{z}}/{{x}}/{{y}}.webp"

    manifest: dict = {
        "profile_id":    "world_tiles",
        "run_id":        run_id,
        "run_utc":       run_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "zoom_min":      zoom_min,
        "zoom_max":      zoom_max,
        "frame_indexes": frame_indexes,
        "url_template":  url_template,
        "generated_at":  datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_name":   "GFS/NOMADS",
        "elapsed_sec":   round(elapsed, 1),
        "tile_size_px":  TILE_SIZE,
    }

    run_manifest_path = MANIFESTS_DIR / f"{run_id}.json"
    run_manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"[grib-tiles] Manifest → {run_manifest_path}", flush=True)

    latest: dict = {
        "run_id":       run_id,
        "manifest_url": f"/data/tile_manifests/{run_id}.json",
        "updated_at":   manifest["generated_at"],
    }
    latest_path = MANIFESTS_DIR / "latest.json"
    latest_path.write_text(json.dumps(latest, indent=2))
    print(f"[grib-tiles] Latest   → {latest_path}", flush=True)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    if not HAS_NUMPY:
        print("[grib-tiles] ERROR: numpy not installed", file=sys.stderr)
        sys.exit(1)
    if not HAS_PIL:
        print("[grib-tiles] ERROR: Pillow not installed", file=sys.stderr)
        sys.exit(1)
    if not HAS_ECCODES:
        print("[grib-tiles] ERROR: eccodes not installed — run: pip install eccodes", file=sys.stderr)
        sys.exit(1)

    t0 = time.time()
    print("[grib-tiles] === GRIB Tile Pipeline v1.0 ===", flush=True)

    # ── 1. Find latest GFS run ────────────────────────────────────────────────
    date_str, run_hour, run_dt = find_latest_gfs_run()
    run_id = run_dt.strftime("%Y%m%dT%H%MZ")
    print(f"[grib-tiles] Run: {run_id} (GFS {date_str} {run_hour:02d}Z)", flush=True)

    # ── 2. Download + parse GRIB2 for each forecast hour ─────────────────────
    frame_indexes: list[int] = list(range(TILE_FRAME_MIN, TILE_FRAME_MAX + 1))
    total_tiles  = 0
    total_frames = 0

    print(f"[grib-tiles] Generating {len(frame_indexes)} frames "
          f"(zoom {ZOOM_MIN}–{ZOOM_MAX}, "
          f"tiles/frame={(sum(4**z for z in range(ZOOM_MIN, ZOOM_MAX+1)))})…",
          flush=True)

    for frame_idx in frame_indexes:
        fhour = _fhour(frame_idx)
        try:
            grib_path = download_tcdc(date_str, run_hour, fhour)
            grid      = parse_tcdc_grib(grib_path)
            n_tiles   = generate_frame_tiles(grid, run_id, frame_idx, ZOOM_MIN, ZOOM_MAX)
            total_tiles  += n_tiles
            total_frames += 1
            if frame_idx % 10 == 0:
                elapsed_so_far = time.time() - t0
                print(f"  frame {frame_idx:03d}/f{fhour:03d}  "
                      f"{n_tiles} tiles  ({elapsed_so_far:.0f}s elapsed)",
                      flush=True)
        except Exception as exc:
            print(f"  [WARN] frame {frame_idx} (f{fhour:03d}) failed: {exc}", flush=True)
            # Remove from frame list so manifest doesn't reference it
            frame_indexes = [fi for fi in frame_indexes if fi != frame_idx]

    elapsed = time.time() - t0

    if total_frames == 0:
        print("[grib-tiles] ERROR: No frames rendered — aborting", file=sys.stderr)
        sys.exit(1)

    # ── 3. Write manifests ────────────────────────────────────────────────────
    write_manifests(run_id, run_dt, frame_indexes, ZOOM_MIN, ZOOM_MAX, elapsed)

    # ── 4. Cleanup old runs ───────────────────────────────────────────────────
    cleanup_old_runs(run_id, keep=2)

    print(f"\n[grib-tiles] Done: {total_frames} frames, {total_tiles} tiles, "
          f"{elapsed:.1f}s", flush=True)


if __name__ == "__main__":
    main()
