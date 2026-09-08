# services/sky/pipelines/tap_introspect.py
from __future__ import annotations

import sys
import textwrap
import requests


TAP_BASE = "https://simbad.cds.unistra.fr/simbad/sim-tap"  # your current TAP
SYNC = f"{TAP_BASE}/sync"


def tap_csv(adql: str, timeout: int = 60) -> str:
    adql = textwrap.dedent(adql).strip()
    r = requests.get(
        SYNC,
        params={
            "request": "doQuery",
            "lang": "ADQL",
            "format": "csv",
            "query": adql,
        },
        timeout=timeout,
    )
    r.raise_for_status()
    return r.text


def q(title: str, adql: str) -> None:
    print("\nADQL:\n", textwrap.dedent(adql).strip(), "\n", sep="")
    out = tap_csv(adql)
    # print as-is (csv text) to avoid hidden transformations
    print(out.strip())


def show_columns(table: str) -> None:
    q(
        f"columns:{table}",
        f"""
        SELECT column_name, datatype
        FROM TAP_SCHEMA.columns
        WHERE table_name='{table}'
        ORDER BY column_name
        """,
    )

    q(
        f"interesting:{table}",
        f"""
        SELECT column_name, datatype
        FROM TAP_SCHEMA.columns
        WHERE table_name='{table}'
          AND (
            LOWER(column_name) LIKE '%ra%'
            OR LOWER(column_name) LIKE '%dec%'
            OR LOWER(column_name) LIKE '%time%'
            OR LOWER(column_name) LIKE '%date%'
            OR LOWER(column_name) LIKE '%mjd%'
            OR LOWER(column_name) LIKE '%jd%'
            OR LOWER(column_name) LIKE '%trigger%'
            OR LOWER(column_name) LIKE '%seconds%'
            OR LOWER(column_name) LIKE '%flux%'
            OR LOWER(column_name) LIKE '%rate%'
          )
        ORDER BY column_name
        """,
    )


def main() -> int:
    q("tables:top20", "SELECT TOP 20 table_name FROM TAP_SCHEMA.tables ORDER BY table_name")

    q(
        "tables:filter",
        """
        SELECT TOP 200 table_name
        FROM TAP_SCHEMA.tables
        WHERE 1=1 AND (
          LOWER(table_name) LIKE '%maxi%'
          OR LOWER(table_name) LIKE '%bat%'
          OR LOWER(table_name) LIKE '%swift%'
          OR LOWER(table_name) LIKE '%uv%'
          OR LOWER(table_name) LIKE '%flare%'
          OR LOWER(table_name) LIKE '%transient%'
        )
        ORDER BY table_name
        """,
    )

    q(
        "tables:supernova-ish",
        """
        SELECT TOP 200 table_name
        FROM TAP_SCHEMA.tables
        WHERE
          LOWER(table_name) LIKE '%supernova%'
          OR LOWER(table_name) LIKE '%supernovae%'
          OR LOWER(table_name) LIKE '%iauc%'
          OR LOWER(table_name) LIKE '%cbat%'
          OR LOWER(table_name) LIKE '%tns%'
        ORDER BY table_name
        """,
    )

    # core candidates
    for t in ["xmmt2flare", "bat5bgrbsp", "swiftxrlog", "swiftuvlog"]:
        print("\n" + "=" * 80)
        print("TABLE:", t)
        show_columns(t)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())