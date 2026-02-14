# services/sky/pipelines/heasarc_sn_candidates.py
from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Tuple

import pandas as pd
import pyvo


# =========================
# CONFIG
# =========================

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))

RAW_DIR = os.path.join(PROJECT_ROOT, "sky/data/raw", "heasarc_sn_candidates")
os.makedirs(RAW_DIR, exist_ok=True)

TAP_URL = "https://heasarc.gsfc.nasa.gov/xamin/vo/tap"


# =========================
# HELPERS
# =========================

def _tap() -> pyvo.dal.TAPService:
    return pyvo.dal.TAPService(TAP_URL)


def _norm(s: str) -> str:
    return re.sub(r"\s+", "", str(s).strip().lower())


def _pick_first(existing: Iterable[str], candidates: Iterable[str]) -> Optional[str]:
    ex = {_norm(c): c for c in existing}
    for cand in candidates:
        k = _norm(cand)
        if k in ex:
            return ex[k]
    return None


def _pick_many(existing: Iterable[str], candidates: Iterable[str]) -> List[str]:
    ex = {_norm(c): c for c in existing}
    out: List[str] = []
    for cand in candidates:
        k = _norm(cand)
        if k in ex and ex[k] not in out:
            out.append(ex[k])
    return out


def _tap_query_df(adql: str) -> pd.DataFrame:
    return _tap().search(adql).to_table().to_pandas()


def _get_table_names_like(patterns: List[str], limit: int = 4000) -> List[str]:
    # TAP_SCHEMA.tables: table_name
    where = " OR ".join([f"LOWER(table_name) LIKE '%{p.lower()}%'" for p in patterns])
    adql = f"""
    SELECT TOP {limit} table_name
    FROM TAP_SCHEMA.tables
    WHERE {where}
    ORDER BY table_name
    """
    df = _tap_query_df(adql)
    if "table_name" not in df.columns:
        return []
    return [str(x) for x in df["table_name"].tolist()]


def _get_columns(table: str) -> List[str]:
    adql = f"""
    SELECT column_name
    FROM TAP_SCHEMA.columns
    WHERE LOWER(table_name) = LOWER('{table}')
    ORDER BY column_name
    """
    df = _tap_query_df(adql)
    if "column_name" not in df.columns:
        return []
    return [str(x) for x in df["column_name"].tolist()]


@dataclass(frozen=True)
class Plan:
    table: str
    ra_candidates: Tuple[str, ...] = ("ra", "raj2000", "ra_deg")
    dec_candidates: Tuple[str, ...] = ("dec", "dej2000", "dec_deg")
    time_candidates: Tuple[str, ...] = (
        "disc_date",
        "discovery_date",
        "date",
        "time",
        "trigger_time",
        "event_time",
        "obs_time",
        "start_time",
        "obs_start_time",
        "mjd",
        "jd",
        "met",
        "tstart",
        "t_stop",
        "tstop",
    )
    extra_candidates: Tuple[str, ...] = (
        "name",
        "source_name",
        "objid",
        "object",
        "type",
        "class",
        "ra_err",
        "dec_err",
        "poserr",
        "err_rad",
        "error_radius",
        "flux",
        "fluence",
        "mag",
        "band",
        "url",
        "atel",
        "gcn",
    )


def _build_probe_query(plan: Plan, cols: List[str], top_n: int = 200) -> Tuple[Optional[str], Optional[str], Optional[str], List[str], str]:
    ra = _pick_first(cols, plan.ra_candidates)
    dec = _pick_first(cols, plan.dec_candidates)
    tcol = _pick_first(cols, plan.time_candidates)

    if not ra or not dec:
        return None, None, None, [], ""

    select_cols = [ra, dec]
    if tcol:
        select_cols.append(tcol)

    extras = _pick_many(cols, plan.extra_candidates)
    for c in extras:
        if c not in select_cols:
            select_cols.append(c)
        if len(select_cols) >= 12:
            break

    order = f" ORDER BY {tcol} DESC" if tcol else ""
    adql = "SELECT TOP {n}\n  {cols}\nFROM {tbl}{order}".format(
        n=top_n,
        cols=",\n  ".join(select_cols),
        tbl=plan.table,
        order=order,
    )
    return ra, dec, tcol, select_cols, adql


def main() -> int:
    # то, что имеет шанс содержать SN/транзиенты/объявления
    patterns = [
        "supernova", "supernovae", "sousa",
        "sn", "tns",
        "transient", "alert", "gcn", "atel",
        "ztf", "gaia",
        "asassn", "asas", "ps1", "panstarrs",
    ]

    tables = _get_table_names_like(patterns)
    print(f"found tables: {len(tables)}")

    kept = 0
    for table in tables:
        cols = _get_columns(table)
        if not cols:
            continue

        plan = Plan(table=table)
        ra, dec, tcol, used, adql = _build_probe_query(plan, cols, top_n=200)

        # нам нужны именно те, где есть время (иначе не “алертная” таблица)
        if not (ra and dec and tcol and adql):
            continue

        kept += 1
        print(f"\n=== {table} ===")
        print("ra:", ra, "| dec:", dec, "| time:", tcol)
        print("ADQL:\n", adql)

        df = _tap_query_df(adql)

        # локально гарантируем сортировку
        if tcol in df.columns:
            df = df.sort_values(tcol, ascending=False)

        out_csv = os.path.join(RAW_DIR, f"{table}.csv")
        df.to_csv(out_csv, index=False)
        print("saved ->", out_csv, "| rows:", len(df))

    print("\nkept tables (with ra/dec/time):", kept)
    print("output dir:", RAW_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())