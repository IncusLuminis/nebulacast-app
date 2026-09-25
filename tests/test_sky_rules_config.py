import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PIPELINES = ROOT / "services" / "sky" / "pipelines"
sys.path.insert(0, str(PIPELINES))

from gen_ranking import build_ranking, load_ranking_cfg  # noqa: E402
from rules_config import RulesConfigError, effective_ranking_config, load_rules  # noqa: E402


RULES_PATH = PIPELINES / "yml" / "rules.yml"
FIXTURES = ROOT / "tests" / "fixtures" / "sky"


class SkyRulesConfigTest(unittest.TestCase):
    def test_committed_rules_have_the_approved_effective_config(self):
        actual = effective_ranking_config(load_rules(RULES_PATH))
        expected = json.loads((FIXTURES / "ranking-effective-config.v1.json").read_text())
        self.assertEqual(actual, expected)

    def test_duplicate_mapping_keys_are_rejected(self):
        with tempfile.NamedTemporaryFile("w", suffix=".yml", delete=False) as handle:
            handle.write("time: {}\ntime: {}\nscoring: {}\ntext: {}\ngroups: {}\nranking: {}\n")
            path = Path(handle.name)
        self.addCleanup(path.unlink)
        with self.assertRaisesRegex(RulesConfigError, "duplicate key 'time'"):
            load_rules(path)

    def test_legacy_bad_nesting_is_rejected(self):
        with tempfile.NamedTemporaryFile("w", suffix=".yml", delete=False) as handle:
            handle.write("time: {}\nscoring:\n  ranking: {}\ntext:\n  groups: {}\ngroups: {}\n")
            path = Path(handle.name)
        self.addCleanup(path.unlink)
        with self.assertRaisesRegex(RulesConfigError, "missing top-level section\\(s\\): ranking"):
            load_rules(path)

    def test_golden_ranking_detects_semantic_config_change(self):
        items = json.loads((FIXTURES / "ranking-golden-input.v1.json").read_text())
        expected_ids = json.loads((FIXTURES / "ranking-golden-output.v1.json").read_text())
        result = build_ranking(items, load_ranking_cfg(load_rules(RULES_PATH)))
        self.assertEqual([item["id"] for item in result], expected_ids)


if __name__ == "__main__":
    unittest.main()
