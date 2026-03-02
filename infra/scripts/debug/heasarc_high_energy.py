# services/sky/pipelines/heasarc_high_energy.py

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Tuple
from datetime import datetime, timezone, timedelta

import pandas as pd
import pyvo


# =========================
# CONFIG
# =========================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../")
)

RAW_DIR = os.path.join(PROJECT_ROOT, "services/sky/data/raw")
os.makedirs(RAW_DIR, exist_ok=True)

TAP_URL = "https://heasarc.gsfc.nasa.gov/xamin/vo/tap"

MJD0 = datetime(1858, 11, 17, tzinfo=timezone.utc)


# =========================
# TABLE PLAN
# =========================

@dataclass(frozen=True)
class TablePlan:
    table: str
    out_csv: str

    ra_candidates: Tuple[str, ...] = ("ra", "raj2000", "ra_deg")
    dec_candidates: Tuple[str, ...] = ("dec", "dej2000", "dec_deg")
    time_candidates: Tuple[str, ...] = (
        "trigger_time",
        "time",
        "obs_start_time",
        "start_time",
        "date",
        "mjd",
        "met",
    )
    extra_candidates: Tuple[str, ...] = (
        "name",
        "source_name",
        "grbname",
        "trigger_name",
        "t90",
        "fluence",
        "flux",
        "error_radius",
    )


# =========================
# TAP HELPERS
# =========================

def _tap_service() -> pyvo.dal.TAPService:
    return pyvo.dal.TAPService(TAP_URL)


def _norm(s: str) -> str:
    return re.sub(r"\s+", "", s.strip().lower())


def _get_columns(table: str) -> List[str]:
    svc = _tap_service()
    adql = f"""
    SELECT column_name
    FROM TAP_SCHEMA.columns
    WHERE LOWER(table_name) = LOWER('{table}')
    ORDER BY column_name
    """
    res = svc.search(adql).to_table().to_pandas()
    if "column_name" not in res.columns:
        return []
    return [str(x) for x in res["column_name"].tolist()]


def _pick_first(existing: Iterable[str], candidates: Iterable[str]) -> Optional[str]:
    ex = {_norm(c): c for c in existing}
    for cand in candidates:
        key = _norm(cand)
        if key in ex:
            return ex[key]
    return None


def _pick_many(existing: Iterable[str], candidates: Iterable[str]) -> List[str]:
    ex = {_norm(c): c for c in existing}
    out: List[str] = []
    for cand in candidates:
        key = _norm(cand)
        if key in ex and ex[key] not in out:
            out.append(ex[key])
    return out


# =========================
# TIME CONVERSION
# =========================

def mjd_to_utc_dt(mjd: float) -> datetime:
    return MJD0 + timedelta(days=float(mjd))


def normalize_time_column(df: pd.DataFrame, time_col: Optional[str]) -> pd.DataFrame:
    if not time_col or time_col not in df.columns:
        return df

    series = df[time_col]

    # numeric → likely MJD
    if pd.api.types.is_numeric_dtype(series):
        try:
            df[time_col + "_utc"] = series.apply(
                lambda x: mjd_to_utc_dt(x) if pd.notnull(x) else None
            )
        except Exception:
            pass

    # string → try ISO parse
    elif pd.api.types.is_string_dtype(series):
        try:
            df[time_col + "_utc"] = pd.to_datetime(series, errors="coerce", utc=True)
        except Exception:
            pass

    return df


# =========================
# QUERY
# =========================

def fetch_full_table(plan: TablePlan) -> pd.DataFrame:
    cols = _get_columns(plan.table)
    if not cols:
        raise RuntimeError(f"[{plan.table}] table not found in TAP_SCHEMA")

    ra_col = _pick_first(cols, plan.ra_candidates)
    dec_col = _pick_first(cols, plan.dec_candidates)
    time_col = _pick_first(cols, plan.time_candidates)

    if not ra_col or not dec_col:
        raise RuntimeError(f"[{plan.table}] cannot find RA/DEC columns")

    select_cols = [ra_col, dec_col]

    if time_col and time_col not in select_cols:
        select_cols.append(time_col)

    extras = _pick_many(cols, plan.extra_candidates)
    for c in extras:
        if c not in select_cols:
            select_cols.append(c)

    order_clause = f" ORDER BY {time_col} DESC" if time_col else ""

    adql = (
        "SELECT\n  "
        + ",\n  ".join(select_cols)
        + f"\nFROM {plan.table}{order_clause}"
    )

    print("ADQL:\n", adql)

    svc = _tap_service()
    df = svc.search(adql).to_table().to_pandas()

    # Normalize time
    df = normalize_time_column(df, time_col)

    # Sort by normalized time if exists
    if time_col and time_col + "_utc" in df.columns:
        df = df.sort_values(time_col + "_utc", ascending=False)
    elif time_col and time_col in df.columns:
        df = df.sort_values(time_col, ascending=False)

    return df


# =========================
# MAIN
# =========================

def main() -> int:
    plans = [
        TablePlan(table="swiftgrb", out_csv="swiftgrb_full.csv"),
        TablePlan(table="fermigbrst", out_csv="fermigbrst_full.csv"),
        TablePlan(table="xmmmaster", out_csv="xmmmaster_full.csv"),
    ]

    for p in plans:
        print(f"\n=== {p.table} ===")
        df = fetch_full_table(p)

        print("rows:", len(df))
        print("columns:", list(df.columns))

        out_path = os.path.join(RAW_DIR, p.out_csv)
        df.to_csv(out_path, index=False)

        print("saved ->", out_path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())