import contextlib
import copy
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DESCRIPTOR_PATH = REPO_ROOT / "docs/Architecture/CONSOLE_ROUTE_COMPOSITION.json"
VALIDATOR_PATH = REPO_ROOT / "scripts/validate_route_composition.py"

spec = importlib.util.spec_from_file_location("validate_route_composition", VALIDATOR_PATH)
validator = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(validator)


class RouteCompositionValidatorTest(unittest.TestCase):
    def load_descriptor(self):
        return json.loads(DESCRIPTOR_PATH.read_text(encoding="utf-8"))

    def validate_data(self, data):
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".json", dir=DESCRIPTOR_PATH.parent, delete=False) as handle:
            json.dump(data, handle)
            path = Path(handle.name)
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                validator.validate(path)
        finally:
            path.unlink(missing_ok=True)

    def assert_invalid(self, data, message):
        with self.assertRaisesRegex(ValueError, message):
            self.validate_data(data)

    def test_current_descriptor_is_valid(self):
        self.validate_data(self.load_descriptor())

    def test_all_target_routes_are_required(self):
        data = self.load_descriptor()
        data["routes"] = [route for route in data["routes"] if route["path"] != "/map/"]
        self.assert_invalid(data, r"routes must contain exactly")

    def test_sky_cannot_expose_oriented_mode(self):
        data = self.load_descriptor()
        sky = next(surface for route in data["routes"] for surface in route["visible_surfaces"] if surface["registry_type"] == "sky")
        sky["layout"]["public_modes"] = ["horizontal", "vertical"]
        self.assert_invalid(data, r"public modes must be \['square'\]")

    def test_auto_is_not_a_public_mode(self):
        data = self.load_descriptor()
        weather = next(surface for route in data["routes"] for surface in route["visible_surfaces"] if surface["registry_type"] == "weather")
        weather["layout"]["public_modes"] = ["auto"]
        self.assert_invalid(data, r"public modes must be \['horizontal', 'vertical'\]")

    def test_missing_authoritative_source_is_rejected(self):
        data = self.load_descriptor()
        data["routes"][0]["visible_surfaces"][0]["authoritative_source"] = "sites/staging/missing-widget.js"
        self.assert_invalid(data, r"authoritative_source: path does not exist")

    def test_host_shell_cannot_declare_widget_layout(self):
        data = self.load_descriptor()
        shell = next(surface for route in data["routes"] for surface in route["visible_surfaces"] if surface["registry_type"] is None)
        shell["layout"] = {"shape": "oriented", "public_modes": ["horizontal", "vertical"]}
        self.assert_invalid(data, r"host shell layout must be null")


if __name__ == "__main__":
    unittest.main()
