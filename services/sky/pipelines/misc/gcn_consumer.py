#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from gcn_kafka import Consumer


TOPICS = [
    "gcn.notices.einstein_probe.wxt.alert",
    "gcn.notices.icecube.lvk_nu_track_search",
    "gcn.notices.icecube.gold_bronze_track_alerts",
    "igwn.gwalert",
    "gcn.notices.swift.bat.guano",
]

RAW_DIR = Path("services/sky/data/raw/gcn")  # можешь сменить на куда тебе удобно


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _decode_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def _try_parse_json(text: str) -> object | None:
    text = (text or "").strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        return None


def _persist_raw(topic: str, offset: int, payload_text: str) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    safe_topic = topic.replace("/", "_").replace(":", "_")
    fname = f"{_utc_now_iso().replace(':','-')}_{safe_topic}_off{offset}.json"
    p = RAW_DIR / fname
    p.write_text(payload_text, encoding="utf-8")
    return p


def main() -> int:
    load_dotenv()

    CLIENT_ID = os.getenv("NASA_CLIENT_ID")
    CLIENT_SECRET = os.getenv("NASA_CLIENT_SECRET")
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError("Missing NASA_CLIENT_ID/NASA_CLIENT_SECRET in environment")

    # Connect as a consumer
    consumer = Consumer(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)

    consumer.subscribe(TOPICS)
    print(f"[gcn] subscribed topics={len(TOPICS)}", flush=True)

    try:
        while True:
            for message in consumer.consume(timeout=1):
                if message.error():
                    print(f"[gcn][err] {message.error()}", flush=True)
                    continue

                topic = message.topic()
                offset = message.offset()
                payload_text = _decode_value(message.value())

                # короткий вывод в консоль
                preview = payload_text[:200].replace("\n", " ")
                print(f"[gcn] topic={topic} offset={offset} preview={preview}", flush=True)

                # попытка понять JSON (если это JSON)
                parsed = _try_parse_json(payload_text)
                if parsed is None:
                    # если не JSON — всё равно сохраним raw (можно потом разбирать)
                    p = _persist_raw(topic, offset, payload_text)
                    print(f"[gcn] saved raw -> {p}", flush=True)
                else:
                    # нормализованно сохраняем JSON, чтобы удобно diff/grep
                    pretty = json.dumps(parsed, ensure_ascii=False, indent=2, sort_keys=False)
                    p = _persist_raw(topic, offset, pretty)
                    print(f"[gcn] saved json -> {p}", flush=True)

    except KeyboardInterrupt:
        print("[gcn] stopped (KeyboardInterrupt)", flush=True)
        return 0
    finally:
        try:
            consumer.close()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())