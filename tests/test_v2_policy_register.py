import json
import unittest
from pathlib import Path

REGISTER = Path(__file__).resolve().parent / "fixtures" / "v2-policy" / "delivery-reliability-approval-register.v1.json"

class PolicyRegisterTest(unittest.TestCase):
    def test_pending_register_does_not_hide_required_approvals(self):
        data = json.loads(REGISTER.read_text())
        self.assertEqual(data["state"], "pending-owner-approval")
        self.assertEqual({item["id"] for item in data["decisions"]}, {"D05-IAM", "D05-promotion", "D06-SLO", "D06-recovery", "D07-public-compatibility"})
        for decision in data["decisions"]:
            self.assertTrue(decision["owner_role"])
            self.assertTrue(decision["required"])
            if decision["id"].startswith("D05"):
                self.assertEqual(decision["owner_role"], "Mikhail Loktionov")
                self.assertIsNotNone(decision["value"])
                self.assertTrue(decision["evidence"])
            else:
                self.assertIsNone(decision["value"])
                self.assertEqual(decision["evidence"], [])

if __name__ == "__main__":
    unittest.main()
