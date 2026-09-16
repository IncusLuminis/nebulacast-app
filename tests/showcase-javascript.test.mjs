import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SHOWCASE_GROUPS, buildEmbedUrl, buildStandaloneUrl, createShowcaseGallery } from "../sites/staging/showcase-javascript/showcase.mjs";
import { createGalleryRoot } from "./fixtures/showcase-gallery-fixture.mjs";

test("experimental showcase keeps the card-only staging catalog presentation", async () => {
  const source = await readFile(new URL("../sites/staging/showcase-javascript/index.html", import.meta.url), "utf8");
  const original = await readFile(new URL("../sites/staging/showcase/index.html", import.meta.url), "utf8");
  assert.match(source, /Widget Showcase/);
  assert.match(source, /Staging catalog/);
  assert.doesNotMatch(source, /widget-lab-stage/);
  assert.match(original, /widget-lab-stage/);
});

test("cards are split into Observation and Events with direct staging actions", async () => {
  const { documentRef, root } = createGalleryRoot();
  await createShowcaseGallery({ root, documentRef }).mount();
  assert.deepEqual(SHOWCASE_GROUPS.map(group => group.title), ["Observation", "Events"]);
  assert.equal(root.querySelectorAll("[data-widget-title]").length, 9);
  const sky = root.querySelector('[data-widget-title="Sky"]');
  assert.equal(sky.querySelector('[data-showcase-action="standalone"]').getAttribute("href"), "https://staging.nebulacast.app/sky/");
  assert.equal(sky.querySelector('[data-showcase-action="embed"]').getAttribute("href"), "/embed/?src=%2Fsky%2F&title=Sky");
  assert.equal(sky.querySelectorAll("select").length, 0);
  assert.equal(sky.querySelectorAll("input").length, 0);
});

test("URL helpers retain staging standalone routes and local shared embed sandbox source paths", () => {
  assert.equal(buildStandaloneUrl("/weather/"), "https://staging.nebulacast.app/weather/");
  assert.equal(buildEmbedUrl("/sky/alerts.html", "Sky Alerts"), "/embed/?src=%2Fsky%2Falerts.html&title=Sky+Alerts");
});
