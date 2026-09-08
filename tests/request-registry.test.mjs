import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLocation, RequestRegistry } from "../sites/staging/shared/request-registry.mjs";

test("normalizes equivalent locations to one key", () => {
  assert.equal(normalizeLocation({ lat: 52.2297001, lon: 21.0122001, tz: "Europe/Warsaw" }), "52.2297,21.0122,Europe/Warsaw");
  assert.equal(normalizeLocation({ lat: "52", lon: 21 }), null);
});

test("deduplicates identical requests and cancels obsolete locations", async () => {
  const registry = new RequestRegistry();
  let calls = 0;
  let aborted = false;
  const first = registry.getOrCreate("a", signal => new Promise((resolve, reject) => {
    calls++;
    signal.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); });
    setTimeout(() => resolve("a"), 10);
  }));
  const second = registry.getOrCreate("a", () => { calls++; return Promise.resolve("duplicate"); });
  assert.equal(first, second);
  await new Promise(resolve => setTimeout(resolve, 0));
  registry.getOrCreate("b", () => Promise.resolve("b"));
  registry.cancelExcept("b");
  await assert.rejects(first, /aborted/);
  assert.equal(aborted, true);
  assert.equal(calls, 1);
});
