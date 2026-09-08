import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const schema = JSON.parse(fs.readFileSync(new URL("../schemas/lunar-snapshot.v1.schema.json", import.meta.url)));
const valid = JSON.parse(fs.readFileSync(new URL("./fixtures/lunar-snapshot-valid.json", import.meta.url)));
const invalid = JSON.parse(fs.readFileSync(new URL("./fixtures/lunar-snapshot-invalid.json", import.meta.url)));

test("valid fixture declares the versioned ownership and units", () => {
  assert.equal(valid.schema_version, "lunar-snapshot.v1");
  assert.equal(schema.properties.lunar.properties.illuminated_percent.maximum, 100);
  assert.equal(valid.lunar.illuminated_percent, valid.lunar.illuminated_fraction * 100);
});

test("invalid fixture is rejected by contract invariants", () => {
  assert.notEqual(invalid.schema_version, schema.properties.schema_version.const);
  assert.ok(invalid.lunar.cycle_phase < 0 || invalid.lunar.cycle_phase > 1);
});
