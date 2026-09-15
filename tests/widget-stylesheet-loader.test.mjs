import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  createStylesheetLoader,
  getWidgetStylesheets,
  normalizeStylesheetPath,
} from "../sites/staging/shared/widget-stylesheet-loader.mjs";

function createDocument() {
  const links = [];
  return {
    links,
    createElement(tagName) {
      const listeners = new Map();
      return {
        tagName: tagName.toUpperCase(),
        attributes: new Map(),
        setAttribute(name, value) { this.attributes.set(name, String(value)); },
        addEventListener(type, listener) { listeners.set(type, listener); },
        dispatch(type) { listeners.get(type)?.(); this[`on${type}`]?.(); },
      };
    },
    head: {
      appendChild(link) {
        links.push(link);
        link.remove = () => {
          const index = links.indexOf(link);
          if (index !== -1) links.splice(index, 1);
        };
        return link;
      },
    },
  };
}

test("stylesheet paths are same-origin CSS paths and manifests are explicit", () => {
  assert.equal(normalizeStylesheetPath("/widgets/weather.css"), "/widgets/weather.css");
  for (const path of [
    "https://evil.example/widget.css",
    "//evil.example/widget.css",
    "/../widget.css",
    "/safe/%2e%2e/evil.css",
    "/safe/%2E%2E%2Fevil.css",
    "/widgets/widget.css?cache=1",
    "/widgets/widget.mjs",
    "/widgets/<style>.css",
  ]) {
    assert.throws(() => normalizeStylesheetPath(path), /safe same-origin/);
  }

  assert.deepEqual(getWidgetStylesheets({ type: "test", stylesheets: ["/a.css", "/a.css", "/b.css"] }), ["/a.css", "/b.css"]);
  assert.deepEqual(getWidgetStylesheets({ type: "legacy", standaloneStylesheet: "/legacy.css" }), ["/legacy.css"]);
  assert.deepEqual(getWidgetStylesheets({ type: "none", stylesheets: [] }), []);
});

test("every registered widget declares a resolvable stylesheet manifest", async () => {
  assert.equal(widgetCatalog.length, 13);
  for (const definition of widgetCatalog) {
    assert.ok(Array.isArray(definition.stylesheets), `${definition.type} must declare stylesheets`);
    for (const path of definition.stylesheets) {
      await access(new URL(`../sites/staging${path}`, import.meta.url));
    }
  }
});

test("Sandbox chrome stylesheet is scoped to its host and uses namespaced tokens", async () => {
  const stylesheet = await readFile(new URL("../sites/staging/console-sandbox/console-sandbox.css", import.meta.url), "utf8");
  assert.match(stylesheet, /^@scope \(html\.nc-console-sandbox-host\) \{/);
  assert.doesNotMatch(stylesheet, /^\s*:root\s*\{/m);
  assert.match(stylesheet, /--nc-sandbox-bg/);
  assert.doesNotMatch(stylesheet, /var\(--(?:bg|surface|line|text|muted|title|link|good|bad)\)/);
});

test("acquire inserts immediately, deduplicates by href, and releases references", () => {
  const documentRef = createDocument();
  const loader = createStylesheetLoader({ documentRef, timeoutMs: 20 });
  const definition = { type: "weather", stylesheets: ["/shared.css", "/widget.css"] };
  const first = loader.acquire(definition, { attributeName: "data-one" });
  const second = loader.acquire(definition, { attributeName: "data-two" });

  assert.equal(documentRef.links.length, 2);
  assert.equal(documentRef.links[0].getAttribute?.("data-one"), undefined);
  first.release();
  assert.equal(documentRef.links.length, 2);
  first.release();
  second.release();
  assert.equal(documentRef.links.length, 0);
});

test("load waits for every manifest stylesheet and cleans up on failure", async () => {
  const documentRef = createDocument();
  const loader = createStylesheetLoader({ documentRef, timeoutMs: 100 });
  const loading = loader.load({ type: "astro", stylesheets: ["/one.css", "/two.css"] });
  assert.equal(documentRef.links.length, 2);
  documentRef.links[0].dispatch("load");
  let settled = false;
  loading.then(() => { settled = true; });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(settled, false);
  documentRef.links[1].dispatch("load");
  const handle = await loading;
  assert.deepEqual(handle.paths, ["/one.css", "/two.css"]);
  handle.release();
  assert.equal(documentRef.links.length, 0);

  const failedDocument = createDocument();
  const failedLoader = createStylesheetLoader({ documentRef: failedDocument, timeoutMs: 100 });
  const failed = failedLoader.load({ type: "broken", stylesheets: ["/broken.css"] });
  failedDocument.links[0].dispatch("error");
  await assert.rejects(failed, /failed to load/);
  assert.equal(failedDocument.links.length, 0);
});
