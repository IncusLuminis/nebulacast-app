import json
import tempfile
import unittest
from pathlib import Path

from infra.scripts.dev_api_server import json_safe, resolve_tile_manifest_path


class NumpyLikeScalar:
    def __init__(self, value):
        self.value = value

    def item(self):
        return self.value


class DevApiServerHelpersTest(unittest.TestCase):
    def test_json_safe_converts_native_scalars_recursively(self):
        payload = {"flag": NumpyLikeScalar(True), "hours": [{"score": NumpyLikeScalar(7)}]}
        encoded = json.dumps(json_safe(payload), allow_nan=False)
        self.assertEqual(json.loads(encoded), {"flag": True, "hours": [{"score": 7}]})

    def test_missing_run_resolves_to_latest_existing_owned_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            staging = Path(directory)
            manifest_dir = staging / "data" / "tile_manifests"
            manifest_dir.mkdir(parents=True)
            (manifest_dir / "latest.json").write_text(json.dumps({
                "run_id": "20260908T0000Z",
                "manifest_url": "/data/tile_manifests/20260908T0000Z.json",
            }), encoding="utf-8")
            existing = manifest_dir / "20260511T1800Z.json"
            existing.write_text('{"run_id":"20260511T1800Z"}', encoding="utf-8")

            resolved = resolve_tile_manifest_path(
                staging,
                manifest_dir / "20260908T0000Z.json",
            )

            self.assertEqual(resolved.resolve(), existing.resolve())
            self.assertNotEqual(resolved.name, "20260908T0000Z.json")


if __name__ == "__main__":
    unittest.main()
