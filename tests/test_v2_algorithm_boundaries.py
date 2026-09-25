import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FIXTURE = ROOT / "fixtures" / "v2-algorithm" / "canonical-boundaries.v1.json"


class AlgorithmBoundariesTest(unittest.TestCase):
    def test_every_domain_declares_approval_or_pending_state(self):
        payload = json.loads(FIXTURE.read_text())
        self.assertEqual(payload["schema_version"], "canonical-boundaries.v1")
        by_id = {item["id"]: item for item in payload["domains"]}
        self.assertEqual(set(by_id), {"lunar_phase", "topocentric_ephemeris", "weather_score", "sky_ranking", "space_weather"})
        self.assertEqual(by_id["lunar_phase"]["status"], "approved-baseline")
        self.assertEqual(by_id["weather_score"]["status"], "pending")
        self.assertEqual(by_id["sky_ranking"]["tolerance"], "exact order")


if __name__ == "__main__":
    unittest.main()
