# services/sky/pipelines/gen_messier.py
from __future__ import annotations

from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import json
import csv

import pandas as pd


def utcnow_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _head_bytes(p: Path, n: int = 64) -> bytes:
    with p.open("rb") as f:
        return f.read(n)


def _peek_lines(p: Path, n: int = 5, encoding: str = "utf-8") -> List[str]:
    lines: List[str] = []
    with p.open("r", encoding=encoding, errors="replace", newline="") as f:
        for _ in range(n):
            s = f.readline()
            if not s:
                break
            lines.append(s.rstrip("\n"))
    return lines


def _try_read_df(csv_path: Path, sep: str, encoding: str) -> Optional[pd.DataFrame]:
    # python engine tolerates weird quoting better
    try:
        df = pd.read_csv(
            csv_path,
            sep=sep,
            engine="python",
            encoding=encoding,
            quoting=csv.QUOTE_MINIMAL,
            on_bad_lines="skip",   # pandas>=1.3
        )
        return df
    except TypeError:
        # for older pandas: on_bad_lines not available
        try:
            df = pd.read_csv(
                csv_path,
                sep=sep,
                engine="python",
                encoding=encoding,
                quoting=csv.QUOTE_MINIMAL,
                error_bad_lines=False,  # type: ignore
                warn_bad_lines=True,    # type: ignore
            )
            return df
        except Exception:
            return None
    except Exception:
        return None


def _normalize_cols(cols: List[str]) -> List[str]:
    out = []
    for c in cols:
        c2 = str(c).replace("\ufeff", "")  # BOM in header
        c2 = c2.strip().lower()
        out.append(c2)
    return out


def _pick_col(norm_cols: List[str], candidates: List[str]) -> Optional[str]:
    s = set(norm_cols)
    for c in candidates:
        if c in s:
            return c
    return None


def gen_messier_dso_json(
    csv_path: Path,
    out_path: Path,
) -> List[Dict[str, Any]]:
    """
    Reads Messier CSV and writes dso_messier.json.

    Your CSV sample:
      messier_id,ngc_id,v_mag,type,comments,ra,dec,ref,is_up

    RA/Dec expected in degrees.
    """
    print("[gen] Messier CSV:", csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"messier.csv not found: {csv_path}")

    # --- raw diagnostics ---
    hb = _head_bytes(csv_path, 64)
    print("[dbg] head bytes:", hb[:32], "... len", len(hb))
    # try utf-8-sig first (handles BOM)
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        lines = _peek_lines(csv_path, 5, encoding=enc)
        if lines:
            print(f"[dbg] first lines ({enc}):")
            for i, ln in enumerate(lines, 1):
                print(f"  L{i}: {ln}")
            # stop at first encoding that yields something readable
            break

    # --- attempt to read with multiple seps/encodings ---
    df = None
    chosen: Optional[Tuple[str, str]] = None

    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        for sep in (",", ";", "\t"):
            dfx = _try_read_df(csv_path, sep=sep, encoding=enc)
            if dfx is None:
                continue
            # heuristics: must have at least 5 columns and >0 rows
            if len(dfx.columns) >= 5 and len(dfx) > 0:
                df = dfx
                chosen = (enc, sep)
                break
        if df is not None:
            break

    if df is None:
        raise RuntimeError("Failed to read CSV with all attempted encodings/separators.")

    enc, sep = chosen or ("?", "?")
    print(f"[dbg] read ok: rows={len(df)} cols={len(df.columns)} encoding={enc} sep={repr(sep)}")
    print("[dbg] columns raw:", list(df.columns))

    norm_cols = _normalize_cols([str(c) for c in df.columns])
    print("[dbg] columns norm:", norm_cols)

    # Rename df columns to normalized for stable access
    df.columns = norm_cols

    # --- map required columns ---
    col_m = _pick_col(norm_cols, ["messier_id", "messier", "m", "mid", "id"])
    col_ra = _pick_col(norm_cols, ["ra", "ra_deg", "raj2000", "ra_j2000"])
    col_dec = _pick_col(norm_cols, ["dec", "dec_deg", "dej2000", "de_j2000"])

    if not col_m or not col_ra or not col_dec:
        raise RuntimeError(
            "Cannot locate required columns after normalization.\n"
            f"Found: m={col_m}, ra={col_ra}, dec={col_dec}\n"
            f"Available columns: {norm_cols}"
        )

    col_ngc = _pick_col(norm_cols, ["ngc_id", "ngc", "ngcnum"])
    col_mag = _pick_col(norm_cols, ["v_mag", "vmag", "mag", "v"])
    col_type = _pick_col(norm_cols, ["type", "objtype", "class"])
    col_comments = _pick_col(norm_cols, ["comments", "comment", "desc", "description"])
    col_ref = _pick_col(norm_cols, ["ref", "source"])
    col_is_up = _pick_col(norm_cols, ["is_up", "isup", "up"])

    print("[dbg] column mapping:",
          {"m": col_m, "ra": col_ra, "dec": col_dec, "ngc": col_ngc,
           "mag": col_mag, "type": col_type, "comments": col_comments,
           "ref": col_ref, "is_up": col_is_up})

    # --- row parse with reasons ---
    items: List[Dict[str, Any]] = []
    skip = {"bad_m": 0, "bad_ra": 0, "bad_dec": 0, "nan": 0}

    def _as_int(v) -> Optional[int]:
        if v is None:
            return None
        try:
            if pd.isna(v):
                return None
            return int(float(v))
        except Exception:
            return None

    def _as_float(v) -> Optional[float]:
        if v is None:
            return None
        try:
            if pd.isna(v):
                return None
            return float(v)
        except Exception:
            return None

    for _, r in df.iterrows():
        m = _as_int(r.get(col_m))
        if m is None or m <= 0:
            skip["bad_m"] += 1
            continue

        ra = _as_float(r.get(col_ra))
        if ra is None:
            skip["bad_ra"] += 1
            continue

        dec = _as_float(r.get(col_dec))
        if dec is None:
            skip["bad_dec"] += 1
            continue

        # sanity range checks
        if not (0.0 <= ra < 360.0) or not (-90.0 <= dec <= 90.0):
            skip["nan"] += 1
            continue

        mag = _as_float(r.get(col_mag)) if col_mag else None
        ngc = _as_int(r.get(col_ngc)) if col_ngc else None

        name = f"M{m}"

        item: Dict[str, Any] = {
            "id": name,
            "group": "dso",
            "type": "dso",
            "name": name,
            "ra_deg": ra,
            "dec_deg": dec,
            "mag": mag,
            "meta": {
                "ngc": ngc,
                "class": (str(r.get(col_type)) if col_type and r.get(col_type) is not None and not pd.isna(r.get(col_type)) else None),
                "comment": (str(r.get(col_comments)) if col_comments and r.get(col_comments) is not None and not pd.isna(r.get(col_comments)) else None),
                "ref": (str(r.get(col_ref)) if col_ref and r.get(col_ref) is not None and not pd.isna(r.get(col_ref)) else None),
                "is_up": (bool(r.get(col_is_up)) if col_is_up and r.get(col_is_up) is not None and not pd.isna(r.get(col_is_up)) else None),
                "source": "messier.csv",
            },
        }
        items.append(item)

    print("[dbg] parsed items:", len(items))
    print("[dbg] skipped:", skip)
    if items:
        print("[dbg] sample:", items[0])

    payload = {
        "version": 1,
        "generated_at": utcnow_iso(),
        "count": len(items),
        "items": items,
        "meta": {
            "csv": str(csv_path),
            "encoding": enc,
            "sep": sep,
            "columns": norm_cols,
            "skipped": skip,
        },
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[gen] wrote: {out_path} (n={len(items)})")

    return items

if __name__ == "__main__":
    from pathlib import Path

    csv_path = Path(
        "/Users/mloktionov/PycharmProjects/Personal/nebulacast-app/services/sky/data/raw/messier.csv"
    )

    out_path = Path(
        "/Users/mloktionov/PycharmProjects/Personal/nebulacast-app/sites/staging/sky/data/dso_messier.json"
    )

    print("[run] gen_messier_dso_json()")
    items = gen_messier_dso_json(csv_path, out_path)
    print("[run] DONE, items:", len(items))