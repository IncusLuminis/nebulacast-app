import test from "node:test";
import assert from "node:assert/strict";
import current from "./fixtures/ephemeris-current.json" with { type: "json" };
import invalidVersion from "./fixtures/ephemeris-invalid-version.json" with { type: "json" };
import { readFile } from "node:fs/promises";

const mod = await import(process.env.EPHEMERIS_CONTRACT_MODULE);
test("accepts current ephemeris fixture and preserves units/basis", () => {
  const value = mod.validateEphemeris(current);
  assert.equal(value.schema, "ephemeris.v1");
  assert.equal(value.time.time_basis, "UTC");
  assert.equal(value.position.latitude_deg, 52.2297);
  assert.equal(value.moon.lunar_state.illumination_pct, 63);
});
test("rejects incompatible schema version", () => {
  assert.throws(() => mod.validateEphemeris(invalidVersion), /schema.*ephemeris\.v1/);
});
test("rejects local timestamps and invalid coordinates", () => {
  assert.throws(() => mod.validateEphemeris({ ...current, time: { ...current.time, timestamp_utc: "2026-09-08T05:00:00+02:00" } }), /timestamp_utc/);
  assert.throws(() => mod.validateEphemeris({ ...current, position: { ...current.position, latitude_deg: 91 } }), /latitude_deg/);
});
test("schema documents the version and required sections", async () => {
  const schema = JSON.parse(await readFile("schemas/ephemeris.v1.schema.json", "utf8"));
  assert.equal(schema.properties.schema.const, "ephemeris.v1");
  assert.deepEqual(schema.required, ["schema", "time", "position", "sun", "moon", "provider"]);
});
