import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLunarSnapshot } from "../sites/staging/shared/lunar.mjs";

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Sun Equation, Hero and Sky are wired to the canonical snapshot", () => {
  const consumers = [
    source("sites/staging/weather/widgets/sun_moon/sun_moon.js"),
    source("sites/staging/index.html"),
    source("sites/staging/sky/core/sky.prepare.js"),
  ];
  for (const consumer of consumers) {
    assert.match(consumer, /createLunarSnapshot/);
    assert.doesNotMatch(consumer, /getLunarState/);
  }
});

test("canonical snapshot is identical for every consumer at one instant/location", () => {
  const input = { instant: new Date("2026-09-09T00:00:00Z"), location: { lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw" } };
  const snapshots = [createLunarSnapshot(input), createLunarSnapshot(input), createLunarSnapshot(input)];
  assert.strictEqual(snapshots[0], snapshots[1]);
  assert.deepEqual(snapshots[0].lunar, snapshots[2].lunar);
});
