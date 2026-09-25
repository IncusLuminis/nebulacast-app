import json
import unittest
from pathlib import Path


FIXTURE = Path(__file__).resolve().parent / "fixtures" / "v2-observer-time" / "semantics-fixtures.v1.json"


class ObserverTimeFixturesTest(unittest.TestCase):
    def test_fixture_covers_required_edge_cases(self):
        payload = json.loads(FIXTURE.read_text())
        self.assertEqual(payload["schema_version"], "observer-time-semantics-fixtures.v1")
        cases = {case["name"]: case for case in payload["cases"]}
        self.assertEqual(cases["dateline-and-negative-zero"]["expected"]["longitude"], -180)
        self.assertIsNone(cases["null-elevation-is-not-sea-level"]["expected"]["elevation_m"])
        self.assertFalse(cases["stale-observer-response-is-discarded"]["expected"]["apply_response"])
        self.assertEqual(cases["expired-snapshot-is-explicit"]["expected"]["http_status"], 410)
        self.assertEqual(cases["polar-day-is-a-semantic-null"]["expected"]["null_reason"], "polar_day")


if __name__ == "__main__":
    unittest.main()
