"""Static negative gate for workflows that can write or deploy stable data.

Run: python3 -m unittest tests/test_stable_pipeline_containment.py
"""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = (
    "cron-weather.yml",
    "cron-weather-map.yml",
    "cron-grib-tiles.yml",
    "cron-helio.yml",
    "cron-sky-alerts.yml",
    "cron-sky-objects.yml",
    "cron-sky-ranking.yml",
    "cron-sky-planets.yml",
    "cron-sunmoon.yml",
    "cron-calendar.yml",
    "cron-news.yml",
    "deploy-staging.yml",
)

GUARD = "if: github.event_name == 'workflow_dispatch' && github.ref != 'refs/heads/main'"


class StablePipelineContainmentTest(unittest.TestCase):
    def test_candidate_dispatch_is_rejected_before_checkout(self):
        """A manually dispatched candidate ref cannot reach a write/deploy step."""
        for name in WORKFLOWS:
            text = (ROOT / ".github" / "workflows" / name).read_text(encoding="utf-8")
            with self.subTest(workflow=name):
                self.assertIn("- name: Reject candidate ref", text)
                self.assertIn(GUARD, text)
                self.assertIn("exit 1", text)
                self.assertLess(
                    text.index("- name: Reject candidate ref"),
                    text.index("- uses: actions/checkout"),
                )


if __name__ == "__main__":
    unittest.main()
