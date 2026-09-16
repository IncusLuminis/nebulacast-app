import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import { createShowcaseEmbedPage, getEmbedCatalog } from "../sites/staging/showcase-embed/showcase-embed.mjs";

test("embed catalog shows every registered widget and preserves capability metadata", () => {
  const catalog = getEmbedCatalog(widgetCatalog);
  assert.deepEqual(catalog.map(definition => definition.type), widgetCatalog.map(definition => definition.type));
  assert.equal(catalog.filter(definition => definition.divEmbed === true).length, 4);
  assert.equal(catalog.some(definition => definition.type === "hero"), true);
  assert.equal(catalog.find(definition => definition.type === "hero").standaloneHost, undefined);
});

test("embed test page imports only the public runtime and keeps snippets on safe helpers", async () => {
  const source = await readFile(new URL("../sites/staging/showcase-embed/showcase-embed.mjs", import.meta.url), "utf8");
  assert.match(source, /from \"\.\.\/widgets\/runtime\/index\.mjs\"/);
  assert.match(source, /serializeJavascriptEmbedSpecification/);
  assert.match(source, /buildIframeEmbedSnippet/);
  assert.doesNotMatch(source, /createNebulacast|widget-runtime\.mjs|widgetRuntime/);
  assert.doesNotMatch(source, /\.innerHTML\s*=|<script/);
});

test("embed page shell is separate from the existing Showcase", async () => {
  const source = await readFile(new URL("../sites/staging/showcase-embed/index.html", import.meta.url), "utf8");
  assert.match(source, /showcase-embed\.mjs/);
  assert.match(source, /showcase-embed\.css/);
  assert.doesNotMatch(source, /showcase\/showcase\.mjs|showcase\/showcase\.css/);
});

test("page factory rejects a missing DOM root before touching runtime internals", () => {
  assert.throws(() => createShowcaseEmbedPage({ root: null }), /requires a root element/);
});
