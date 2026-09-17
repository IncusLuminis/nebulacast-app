import test from "node:test";
import assert from "node:assert/strict";
import { orientationFromSearch } from "../sites/staging/hero/page-composer.mjs";

test("Hero standalone route accepts only horizontal and vertical orientations", () => {
  assert.equal(orientationFromSearch("?orientation=vertical"), "vertical");
  assert.equal(orientationFromSearch("?orientation=horizontal"), "horizontal");
  assert.equal(orientationFromSearch("?orientation=unexpected"), "horizontal");
});
