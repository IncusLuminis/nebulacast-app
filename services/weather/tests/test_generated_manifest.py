import json
from pathlib import Path

import pytest

from scripts.generated_manifest import update


def test_manifest_is_written(tmp_path: Path):
    path = tmp_path / "payload.json"
    path.write_text(json.dumps({"generated_utc": "2026-09-08T00:00:00Z", "site": {"lat": 1, "lon": 2}}))
    update(path, "unit-test", write=True)
    data = json.loads(path.read_text())
    assert data["manifest"]["schema_version"] == "1"
    assert data["manifest"]["input_source"] == "unit-test"
    assert data["manifest"]["location"] == {"lat": 1, "lon": 2}


def test_manifest_validation_rejects_missing(tmp_path: Path):
    path = tmp_path / "payload.json"
    path.write_text(json.dumps({"hours": []}))
    with pytest.raises(ValueError, match="manifest"):
        update(path, "unit-test", write=False)
