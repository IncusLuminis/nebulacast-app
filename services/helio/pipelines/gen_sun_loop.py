#!/usr/bin/env python3
"""
Sun Loop pipeline — generates sites/staging/data/sun_loop.mp4
using the Helioviewer Movie API (SDO AIA 171, last 24 hours).

Usage:
  PYTHONPATH=services/helio python services/helio/pipelines/gen_sun_loop.py

Update frequency: every 6 hours (configured in cron / deploy scripts).
"""
from __future__ import annotations

import shutil
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

_repo_root   = Path(__file__).resolve().parent.parent.parent.parent
_OUTPUT_PATH = _repo_root / "sites" / "staging" / "data" / "sun_loop.mp4"

HV_BASE          = "https://api.helioviewer.org/v2"
AIA_171_SOURCE_ID = 10   # SDO AIA 171 Å


def queue_movie(start: datetime, end: datetime) -> str:
    """Queue a Helioviewer timelapse movie and return its ID."""
    r = requests.post(
        f"{HV_BASE}/queueMovie/",
        data={
            "startTime":    start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "endTime":      end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "layers":       f"[{AIA_171_SOURCE_ID},1,100]",
            "events":       "",
            "eventsLabels": "false",
            "imageScale":   2.4,
            "format":       "mp4",
            "frameRate":    15,
            "maxFrames":    48,
            "x0":           0,
            "y0":           0,
            "width":        512,
            "height":       512,
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["id"]


def wait_for_movie(movie_id: str, max_wait: int = 300, poll: int = 5) -> None:
    """Poll getMovieStatus until status==2 (finished) or timeout."""
    deadline = time.time() + max_wait
    while time.time() < deadline:
        r = requests.get(
            f"{HV_BASE}/getMovieStatus/",
            params={"id": movie_id, "format": "mp4"},
            timeout=15,
        )
        r.raise_for_status()
        status = r.json().get("status", -1)
        if status == 2:
            return
        if status == 3:
            raise RuntimeError(f"Movie {movie_id} reported invalid by Helioviewer")
        time.sleep(poll)
    raise TimeoutError(f"Movie {movie_id} not ready after {max_wait}s")


def download_movie(movie_id: str, dest: Path) -> None:
    """Stream-download the finished movie to dest (atomic write)."""
    r = requests.get(
        f"{HV_BASE}/downloadMovie/",
        params={"id": movie_id, "format": "mp4"},
        stream=True,
        timeout=120,
    )
    r.raise_for_status()
    tmp = dest.with_suffix(".tmp")
    with tmp.open("wb") as fh:
        shutil.copyfileobj(r.raw, fh)
    tmp.rename(dest)


def main() -> None:
    now   = datetime.now(timezone.utc)
    start = now - timedelta(hours=24)

    print(f"[sun_loop] Queueing movie  {start:%Y-%m-%dT%H:%MZ} → {now:%Y-%m-%dT%H:%MZ}")
    movie_id = queue_movie(start, now)
    print(f"[sun_loop] Movie ID: {movie_id}  — waiting for render…")

    wait_for_movie(movie_id)
    print(f"[sun_loop] Downloading → {_OUTPUT_PATH}")

    _OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    download_movie(movie_id, _OUTPUT_PATH)

    size_kb = _OUTPUT_PATH.stat().st_size / 1024
    print(f"[sun_loop] Done. {size_kb:.0f} KB written to {_OUTPUT_PATH}")


if __name__ == "__main__":
    sys.exit(main())
