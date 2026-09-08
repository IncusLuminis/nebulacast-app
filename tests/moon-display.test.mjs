import test from "node:test";
import assert from "node:assert/strict";
import { getMoonDisplay } from "../sites/staging/shared/moon-display.mjs";

test("map moon display uses shared lunar phase and SunCalc position", () => {
  const result = getMoonDisplay(new Date("2026-09-08T05:00:00Z"), 52.2297, 21.0122, {
    getMoonPosition() { return { altitude: 0.5, azimuth: -1 }; },
  });
  assert.equal(result.illumPct >= 0 && result.illumPct <= 100, true);
  assert.equal(result.azDeg, (-(180 / Math.PI) + 180) % 360);
  assert.equal(typeof result.phaseName, "string");
});

test("map moon display rejects unavailable position inputs", () => {
  assert.equal(getMoonDisplay(new Date("invalid"), 52, 21, {}), null);
  assert.equal(getMoonDisplay(new Date(), 52, 21, null), null);
});
