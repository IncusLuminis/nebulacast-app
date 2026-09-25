import json
import unittest
from pathlib import Path


REGISTRY = Path(__file__).resolve().parent / "fixtures" / "v2-registry" / "dataset-field-registry.v1.json"
REQUIRED_ENTRY_FIELDS = {"dataset_id", "public_path", "producer", "fields", "consumers", "retention", "license_cost", "disposition", "evidence"}


class DatasetRegistryTest(unittest.TestCase):
    def test_entries_are_complete_and_do_not_hide_unknowns(self):
        payload = json.loads(REGISTRY.read_text())
        self.assertEqual(payload["schema_version"], "dataset-field-registry.v1")
        self.assertGreaterEqual(len(payload["entries"]), 14)
        ids = set()
        for entry in payload["entries"]:
            self.assertTrue(REQUIRED_ENTRY_FIELDS <= set(entry))
            self.assertNotIn(entry["dataset_id"], ids)
            self.assertTrue(entry["fields"])
            self.assertTrue(entry["consumers"])
            ids.add(entry["dataset_id"])
        self.assertIn("sky.ranking", ids)
        self.assertIn("weather.tiles", ids)


if __name__ == "__main__":
    unittest.main()
