import test from "node:test";
import assert from "node:assert/strict";
import { classifyDataFreshness, formatFreshnessLabel } from "../sites/staging/shared/data-freshness.mjs";
const NOW = Date.parse("2026-09-08T12:00:00Z");
test("classifies fresh and stale data", () => {
  assert.equal(classifyDataFreshness({ generated_utc: "2026-09-08T11:00:00Z" }, NOW).status, "fresh");
  assert.equal(classifyDataFreshness({ manifest: { generated_utc: "2026-09-06T00:00:00Z" } }, NOW).status, "stale");
});
test("missing timestamps are unavailable", () => {
  const result = classifyDataFreshness({ hours: [] }, NOW);
  assert.equal(result.status, "unavailable");
  assert.equal(formatFreshnessLabel(result), "Unavailable");
});
