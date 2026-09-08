import test from "node:test";
import assert from "node:assert/strict";
import { createLunarSnapshot } from "../sites/staging/shared/lunar.mjs";

test("snapshot is deterministic and location keyed", () => {
  const input = { instant: new Date("2026-09-08T12:00:37Z"), location: { lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw" } };
  const a = createLunarSnapshot(input);
  const b = createLunarSnapshot({ ...input, instant: new Date("2026-09-08T12:00:59Z") });
  assert.strictEqual(a, b);
  assert.equal(a.schema_version, "lunar-snapshot.v1");
  assert.equal(a.status, "available");
  assert.equal(a.lunar.illuminated_percent, a.lunar.illuminated_fraction * 100);
});

test("snapshot rejects invalid locations", () => {
  assert.throws(() => createLunarSnapshot({ location: { lat: 91, lon: 0, timezone: "UTC" } }), RangeError);
});
