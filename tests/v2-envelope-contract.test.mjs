import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "tests", "fixtures", "v2-envelope");
const schemas = path.join(root, "schemas", "v2");
const utc = /^\d{4}-\d{2}-\d{2}T.*Z$/;
const checksum = /^[a-f0-9]{64}$/;

async function load(dir, name) {
  return JSON.parse(await readFile(path.join(dir, name), "utf8"));
}

function core(value) {
  for (const key of ["dataset_id", "dataset_release_id", "generated_at_utc", "payload_checksum_sha256", "provenance", "payload"]) {
    assert.ok(key in value, `missing ${key}`);
  }
  assert.match(value.dataset_id, /^[a-z][a-z0-9._-]*$/);
  assert.match(value.generated_at_utc, utc);
  assert.match(value.payload_checksum_sha256, checksum);
  assert.ok(Array.isArray(value.provenance) && value.provenance.length > 0);
}

function dataset(value) {
  core(value);
  for (const key of ["release_set_id", "input_refs", "freshness", "status"]) assert.ok(key in value, `missing ${key}`);
  assert.ok(Array.isArray(value.input_refs));
  assert.ok(["fresh", "stale", "expired"].includes(value.freshness.state));
  assert.ok(["ok", "partial", "unavailable", "error"].includes(value.status));
  if (value.status !== "ok") assert.ok(value.errors?.length, "non-ok response must include an error reason");
}

function contextual(value) {
  dataset(value);
  for (const key of ["snapshot_id", "observer_revision", "time_revision", "context", "requested_at_utc", "effective_at_utc", "served_at_utc"]) assert.ok(key in value, `missing ${key}`);
  assert.match(value.requested_at_utc, utc);
  assert.match(value.served_at_utc, utc);
  assert.match(value.context.selected_at_utc, utc);
  assert.ok(value.effective_at_utc === null || utc.test(value.effective_at_utc));
}

test("v2 schema documents are parseable and independently versioned", async () => {
  for (const name of ["envelope-core.v1.schema.json", "base-dataset-envelope.v1.schema.json", "dataset-envelope.v1.schema.json", "contextual-read-model-envelope.v1.schema.json"]) {
    const schema = await load(schemas, name);
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(schema.$id, /^https:\/\/nebulacast\.app\/schemas\/v2\//);
  }
});

test("fixtures express the required v2 success and failure states", async () => {
  const base = await load(fixtures, "base-ok.json");
  core(base);
  assert.equal(base.schema_version, "nebulacast.base-dataset-envelope.v1");

  const partial = await load(fixtures, "dataset-partial.json");
  dataset(partial);
  assert.equal(partial.status, "partial");

  const ok = await load(fixtures, "contextual-ok.json");
  contextual(ok);
  assert.equal(ok.status, "ok");

  for (const name of ["contextual-unavailable.json", "contextual-expired-snapshot.json", "invalid-request.json"]) {
    const value = await load(fixtures, name);
    contextual(value);
    assert.equal(value.status, name === "contextual-unavailable.json" ? "unavailable" : "error");
  }
});
