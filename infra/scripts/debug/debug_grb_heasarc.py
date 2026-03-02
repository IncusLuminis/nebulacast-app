# services/sky/pipelines/debug_grb_heasarc.py

from __future__ import annotations

import re
from datetime import datetime, timezone, timedelta

CATALOG = "fermigbrst"
TOP_K = 200          # сколько строк тянем с сервера (дёшево, и хватает)
DAYS = 2             # окно назад
PRINT_N = 10         # сколько печатаем

_GRB_NAME_RE = re.compile(r"\bGRB(\d{2})(\d{2})(\d{2})(\d{3})\b")

def parse_grb_name_to_utc(name: str) -> datetime | None:
    """
    Fermi/GBM trigger naming convention: GRBYYMMDDfff
    where fff is thousandths of a day.
    Example: GRB260210826 -> 2026-02-10 + 0.826 days -> ~19:49 UTC.
    """
    if not name:
        return None
    m = _GRB_NAME_RE.search(name.strip())
    if not m:
        return None

    yy, mm, dd, fff = map(int, m.groups())
    year = 2000 + yy
    frac_day = fff / 1000.0
    seconds = int(round(frac_day * 86400.0))

    hh = seconds // 3600
    mi = (seconds % 3600) // 60
    ss = seconds % 60

    try:
        return datetime(year, mm, dd, hh, mi, ss, tzinfo=timezone.utc)
    except Exception:
        return None

def get_tap_service():
    endpoints = [
        "https://heasarc.gsfc.nasa.gov/xamin/vo/tap",
        "https://heasarc.gsfc.nasa.gov/vo/tap",
        "https://heasarc.gsfc.nasa.gov/tap",
    ]
    try:
        import pyvo
    except Exception as e:
        raise RuntimeError("pyvo is not available. Install it: pip install pyvo") from e

    last_err = None
    for url in endpoints:
        try:
            svc = pyvo.dal.TAPService(url)
            _ = svc.search("SELECT TOP 1 table_name FROM TAP_SCHEMA.tables").to_table()
            print(f"[ok] TAP connected: {url}")
            return svc
        except Exception as e:
            last_err = e
            print(f"[warn] TAP endpoint failed: {url} -> {e}")
    raise RuntimeError(f"Could not connect to HEASARC TAP. Last error: {last_err}")

def main():
    svc = get_tap_service()

    print("\n[step] fetch last rows ordered by trigger_time desc")
    q = f"""
        SELECT TOP {TOP_K}
            name, trigger_name, ra, dec, trigger_time, last_modified
        FROM {CATALOG}
        ORDER BY trigger_time DESC
    """
    tbl = svc.search(q).to_table()
    print(f"[ok] rows fetched: {len(tbl)}")

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=DAYS)

    rows = []
    for r in tbl:
        name = str(r["name"]) if r["name"] is not None else ""
        trig_name = str(r["trigger_name"]) if r["trigger_name"] is not None else ""
        ra = float(r["ra"]) if r["ra"] is not None else None
        dec = float(r["dec"]) if r["dec"] is not None else None

        dt = parse_grb_name_to_utc(name) or parse_grb_name_to_utc(trig_name)
        if dt is None:
            continue

        rows.append((dt, name, trig_name, ra, dec))

    rows.sort(key=lambda x: x[0], reverse=True)

    print(f"[step] parsed datetimes: {len(rows)}")
    print(f"[step] cutoff: {cutoff.isoformat()} (DAYS={DAYS})")

    kept = [x for x in rows if x[0] >= cutoff]
    print(f"[step] kept by time: {len(kept)}")

    print(f"\n[print] top {PRINT_N} kept")
    for dt, name, trig_name, ra, dec in kept[:PRINT_N]:
        print(f"{name:>12}  dt={dt.isoformat()}  ra={ra:.4f}  dec={dec:.4f}  trig_name={trig_name}")

if __name__ == "__main__":
    main()