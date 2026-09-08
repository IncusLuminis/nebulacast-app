import test from "node:test";
import assert from "node:assert/strict";
import { createLifecycle } from "../sites/staging/shared/lifecycle.mjs";

test("createLifecycle runs cleanup once and clears registrations", () => {
  const lifecycle = createLifecycle();
  let calls = 0;
  lifecycle.add(() => { calls += 1; });
  lifecycle.add(() => { calls += 1; });
  lifecycle.dispose();
  lifecycle.dispose();
  assert.equal(calls, 2);
});

test("cleanup registered after dispose runs immediately", () => {
  const lifecycle = createLifecycle();
  lifecycle.dispose();
  let calls = 0;
  lifecycle.add(() => { calls += 1; });
  assert.equal(calls, 1);
});
