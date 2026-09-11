import contextlib
import copy
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPO_ROOT / "docs/Architecture/WIDGET_INVENTORY.json"
VALIDATOR_PATH = REPO_ROOT / "scripts/validate_widget_inventory.py"

spec = importlib.util.spec_from_file_location("validate_widget_inventory", VALIDATOR_PATH)
validator = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(validator)


class WidgetInventoryValidatorTest(unittest.TestCase):
    def load_manifest(self):
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    def validate_data(self, data):
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            suffix=".json",
            dir=MANIFEST_PATH.parent,
            delete=False,
        ) as handle:
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

    def test_current_manifest_is_valid(self):
        self.validate_data(self.load_manifest())

    def test_missing_supporting_source_is_rejected(self):
        data = self.load_manifest()
        data["widgets"][0]["supporting_data_sources"] = ["sites/staging/missing.json"]
        self.assert_invalid(data, r"supporting_data_sources: path does not exist")

    def test_duplicate_source_classification_is_rejected(self):
        data = self.load_manifest()
        hero = data["widgets"][0]
        hero["path_classification"].append(copy.deepcopy(hero["path_classification"][0]))
        self.assert_invalid(data, r"source_of_truth must appear exactly once")

    def test_source_classification_must_match_widget(self):
        data = self.load_manifest()
        location = next(item for item in data["widgets"] if item["id"] == "location")
        source = next(item for item in location["path_classification"] if item["path"] == location["source_of_truth"])
        source["classification"] = "legacy"
        self.assert_invalid(data, r"location: source_of_truth classification must match")

    def test_map_decision_must_match_classified_paths(self):
        data = self.load_manifest()
        data["map_decision"]["non_production_path"]["classification"] = "legacy"
        self.assert_invalid(data, r"non_production_path.classification must be POC")


if __name__ == "__main__":
    unittest.main()
