# services/sky/pipelines/lib/http.py
from __future__ import annotations

import json
import time
import urllib.request
from typing import Any, Dict, Optional

def fetch_json(
    url: str,
    timeout: int = 30,
    headers: Optional[Dict[str, str]] = None,
    retries: int = 4,
    backoff_base: float = 1.6,
) -> Any:
    hdrs = {
        "User-Agent": "nebulacast-sky/1.0 (+https://github.com/mloktionov/nebulacast.app)",
        "Accept": "application/json",
    }
    if headers:
        hdrs.update(headers)

    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers=hdrs, method="GET")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode("utf-8", errors="replace")
            return json.loads(body)
        except Exception as e:
            last_err = e
            if attempt >= retries:
                break
            sleep_s = (backoff_base ** (attempt - 1))
            time.sleep(sleep_s)

    assert last_err is not None
    raise last_err