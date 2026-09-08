import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contracts = await import(process.env.PROVIDER_CONTRACTS_MODULE);
const fixture = async (name) => JSON.parse(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));

test("accepts nullable and incomplete Open-Meteo hourly data", async () => {
  const result = contracts.validateOpenMeteoResponse(await fixture("open-meteo-valid.json"));
  assert.deepEqual(result.hourly.cloudcover, [null, 42]);
  assert.equal(result.hourly.precipitation, undefined);
});

test("rejects Open-Meteo arrays with a mismatched length", () => {
  assert.throws(
    () => contracts.validateOpenMeteoResponse({ hourly: { time: ["2026-01-01T00:00"], cloudcover: [] } }),
    /Open-Meteo response contract: hourly\.cloudcover length 0 does not match/,
  );
});

test("rejects malformed Open-Meteo values with an actionable field path", () => {
  assert.throws(
    () => contracts.validateOpenMeteoResponse({ hourly: { time: ["2026-01-01T00:00"], visibility: ["unknown"] } }),
    /hourly\.visibility\[0\] must be a finite number/,
  );
});

test("accepts Nominatim results with nullable optional fields", async () => {
  const result = contracts.validateNominatimSearchResponse(await fixture("nominatim-search-valid.json"));
  assert.equal(result[0].lat, "52.2297");
  assert.equal(result[1].address, undefined);
});

test("accepts an empty Nominatim search response", () => {
  assert.deepEqual(contracts.validateNominatimSearchResponse([]), []);
});

test("rejects malformed Nominatim coordinates with an actionable field path", () => {
  assert.throws(
    () => contracts.validateNominatimSearchResponse([{ lat: "unknown", lon: "21" }]),
    /Nominatim response contract: \$\[0\]\.lat must contain a finite coordinate/,
  );
});

test("allows an incomplete reverse result but rejects a malformed top level", () => {
  assert.deepEqual(contracts.validateNominatimReverseResponse({}), { display_name: undefined, address: undefined });
  assert.throws(
    () => contracts.validateNominatimReverseResponse(null),
    /Nominatim response contract: \$ reverse response must be an object/,
  );
});
