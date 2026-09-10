import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const stagingRoot = fileURLToPath(new URL("../sites/staging/", import.meta.url));

async function findCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await findCssFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(path);
  }
  return files;
}

function selectorsWithWidgetMetadata(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g)]
    .flatMap(match => match[1].split(","))
    .map(selector => selector.trim())
    .filter(selector => /\[data-nc-[\w-]+\s*=/.test(selector));
}

test("widget CSS scopes every data-nc selector to the Runtime widget root", async () => {
  const cssFiles = await findCssFiles(stagingRoot);
  assert.ok(cssFiles.length > 0, "expected widget stylesheets under sites/staging");

  for (const file of cssFiles) {
    const css = await readFile(file, "utf8");
    for (const selector of selectorsWithWidgetMetadata(css)) {
      assert.match(
        selector,
        /^\.nc-widget(?:[.#:\[]|\s|$)/,
        `${file} contains an unscoped data-nc selector: ${selector}`,
      );
    }
  }
});

test("Alerts metadata selectors remain rooted on the Alerts widget host", async () => {
  const stylesheet = await readFile(join(stagingRoot, "alerts/widget.css"), "utf8");
  for (const attribute of ["density", "theme", "orientation"]) {
    assert.match(
      stylesheet,
      new RegExp(`\\.nc-widget\\[data-nc-widget="alerts"\\]\\[data-nc-${attribute}=`),
    );
  }
});
