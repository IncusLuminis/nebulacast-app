import test from "node:test";
import assert from "node:assert/strict";

import { widgetCatalog } from "../sites/staging/shared/widget-catalog.mjs";
import {
  createAstronomyRuntimeRoot,
  createResourceLedger,
  createTrackedContext,
  installSunMoonEnvironment,
} from "./fixtures/astronomy-platform-fixture.mjs";
import { createWidgetLifecycleHarness } from "./fixtures/widget-lifecycle-harness.mjs";
import { runWidgetLifecycleContract } from "./fixtures/widget-lifecycle-contract.mjs";

const FOUNDATION_TYPES = ["astro", "sun-moon"];
const INITIAL_STATE = {
  observer: {
    name: "Warsaw",
    lat: 52.2297,
    lon: 21.0122,
    timezone: "Europe/Warsaw",
    source: "fixture",
  },
  time: { mode: "manual", datetimeISO: "2026-09-09T12:00:00Z" },
};

function expectedResources(type, count) {
  return type === "sun-moon"
    ? { timers: count, observers: count, subscriptions: count }
    : { timers: 0, observers: 0, subscriptions: count };
}

test("reuses one lifecycle contract across the real Astro and Sun/Moon adapters", async () => {
  const ledger = createResourceLedger();
  const events = [];
  const restore = installSunMoonEnvironment(ledger, events);

  try {
    const context = createTrackedContext(ledger, INITIAL_STATE);
    const definitions = widgetCatalog.filter(definition => FOUNDATION_TYPES.includes(definition.type));
    const harness = createWidgetLifecycleHarness({
      context,
      definitions,
      ledger,
      rootFactory: createAstronomyRuntimeRoot,
    });

    for (const [index, type] of FOUNDATION_TYPES.entries()) {
      const roots = index === 0
        ? { first: harness.roots.one, second: harness.roots.two }
        : { first: harness.roots.foundationOne, second: harness.roots.foundationTwo };
      const mountedResources = expectedResources(type, 1);
      const twoResources = expectedResources(type, 2);

      await runWidgetLifecycleContract({
        harness,
        type,
        roots,
        config: { orientation: "horizontal", theme: "dark", density: "compact" },
        remountConfig: { orientation: "vertical", theme: "light", density: "comfortable" },
        contextPatch: { observer: { name: "Contract observer" } },
        assertMounted: ({ instance, root, remount = false }) => {
          assert.equal(root.getAttribute("data-nc-widget"), type);
          assert.equal(root.getAttribute("data-nc-state"), "ready");
          assert.equal(instance.config.theme, remount ? "light" : "dark");
          if (type === "astro") assert.ok(root.querySelector(".widget-location-info"));
          if (type === "sun-moon") assert.ok(root.querySelector("[data-role=hour-line]"));
        },
        assertUpdated: ({ root }) => {
          assert.equal(root.getAttribute("data-nc-orientation"), "vertical");
        },
        captureContext: ({ root }) => type === "astro"
          ? root.querySelector(".widget-location-info")?.textContent
          : events.length,
        assertContext: ({ root, before }) => {
          if (type === "astro") {
            assert.notEqual(root.querySelector(".widget-location-info")?.textContent, before);
            assert.equal(root.querySelector(".widget-location-info")?.textContent, "Location: Contract observer");
          } else {
            assert.ok(events.length > before);
            assert.ok(events.some(event => event.type === "nc:sun-times"));
          }
        },
        assertIsolation: ({ firstRoot, secondRoot }) => {
          assert.equal(firstRoot.getAttribute("data-nc-theme"), "dark");
          assert.equal(secondRoot.getAttribute("data-nc-theme"), "light");
          assert.equal(firstRoot.getAttribute("data-nc-widget"), type);
          assert.equal(secondRoot.getAttribute("data-nc-widget"), type);
        },
        assertResources: ({ phase }) => {
          const expected = {
            mounted: mountedResources,
            destroyed: expectedResources(type, 0),
            "remount-destroyed": expectedResources(type, 0),
            "two-mounted": twoResources,
            "one-destroyed": mountedResources,
            "all-destroyed": expectedResources(type, 0),
          }[phase];
          assert.deepEqual(ledger.snapshot(), expected, `${type} resources after ${phase}`);
        },
      });
    }
  } finally {
    restore();
  }
});
