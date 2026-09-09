import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createSkyBrowserFixture,
  createSkyRoot,
  flush,
  installSkyBrowserGlobals,
} from "./fixtures/sky-platform-fixture.mjs";

const quietSkyOptions = {
  showGridAz: false,
  showGridEq: false,
  showConstellations: false,
  showMeridian: false,
  showEquator: false,
  showEcliptic: false,
  showMilkyWay: false,
  showObjects: false,
  showAlerts: false,
  showMessier: false,
  showSunMoon: false,
  showPlanets: false,
};
const quietSkyUI = {
  components: {
    sideToolbar: false,
    bottomToolbar: false,
    popover: false,
    modal: false,
    player: false,
  },
};

test("standalone Sky bootstrap builds config from the URL and owns the legacy globals", async () => {
  const fixture = createSkyBrowserFixture();
  const root = createSkyRoot("legacy", { width: 640, height: 480 }, fixture.document);
  root.id = "skyMount";
  const previousGetElementById = fixture.document.getElementById;
  fixture.document.getElementById = id => id === "skyMount"
    ? root
    : previousGetElementById.call(fixture.document, id);

  const restore = installSkyBrowserGlobals(fixture);
  const previousCSS = globalThis.CSS;
  const css = { escape: value => String(value) };
  fixture.window.CSS = css;
  globalThis.CSS = css;
  fixture.window.location.pathname = "/sky/";
  fixture.window.location.search = "?lat=40.7128&lon=-74.006&datetime=2026-09-09T21:00:00Z";

  let handle;
  try {
    await import(`../sites/staging/sky/legacy-bootstrap.mjs?test=${Date.now()}`);
    for (let attempt = 0; attempt < 10 && !fixture.window.__skyWidget; attempt += 1) await flush();

    handle = fixture.window.__skyWidget;
    assert.equal(typeof handle?.update, "function");
    assert.equal(typeof handle?.resize, "function");
    assert.equal(typeof handle?.destroy, "function");
    assert.deepEqual(
      {
        baseUrl: fixture.window.SKY_CONFIG.baseUrl,
        mountId: fixture.window.SKY_CONFIG.mountId,
        lat: fixture.window.SKY_CONFIG.lat,
        lon: fixture.window.SKY_CONFIG.lon,
        datetimeISO: fixture.window.SKY_CONFIG.datetimeISO,
      },
      {
        baseUrl: "/sky",
        mountId: "skyMount",
        lat: 40.7128,
        lon: -74.006,
        datetimeISO: "2026-09-09T21:00:00Z",
      },
    );
    assert.ok(root.querySelector(".sky-root"));
    assert.match(root.querySelector(".sky-status").textContent, /lat 40\.71°/);
  } finally {
    handle?.destroy();
    restore();
    if (previousCSS === undefined) delete globalThis.CSS;
    else globalThis.CSS = previousCSS;
  }
});

test("Sky implementation contains no legacy global bridge", async () => {
  const source = await readFile(new URL("../sites/staging/sky/widget.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /SKY_CONFIG|__skyWidget/);
  assert.match(
    await readFile(new URL("../sites/staging/sky/legacy-bootstrap.mjs", import.meta.url), "utf8"),
    /window\.SKY_CONFIG[\s\S]*window\.__skyWidget/,
  );
});

test("standalone Sky config parses URL values and applies bounded fallbacks", async () => {
  const fixture = createSkyBrowserFixture();
  const restore = installSkyBrowserGlobals(fixture);
  let buildStandaloneSkyConfig;
  try {
    ({ buildStandaloneSkyConfig } = await import(`../sites/staging/sky/legacy-bootstrap.mjs?config-test=${Date.now()}`));
  } finally {
    restore();
  }

  assert.deepEqual(buildStandaloneSkyConfig("?lat=40.7128&lon=-74.006&datetime=2026-09-09T21:00:00Z"), {
    baseUrl: "/sky",
    mountId: "skyMount",
    lat: 40.7128,
    lon: -74.006,
    datetimeISO: "2026-09-09T21:00:00Z",
  });
  assert.deepEqual(buildStandaloneSkyConfig("?lat=90.1&lon=-180.1&datetime="), {
    baseUrl: "/sky",
    mountId: "skyMount",
    lat: 52.2297,
    lon: 21.0122,
    datetimeISO: null,
  });
  assert.deepEqual(buildStandaloneSkyConfig("?lat=not-a-number&lon=not-a-number"), {
    baseUrl: "/sky",
    mountId: "skyMount",
    lat: 52.2297,
    lon: 21.0122,
    datetimeISO: null,
  });
});
