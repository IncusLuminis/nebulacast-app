import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPlatformContext } from "../sites/staging/weather/core/context.js";
import * as realState from "../sites/staging/weather/core/state.js";

function makeStore(initial) {
  let state = structuredClone(initial);
  const listeners = new Set();
  return {
    getState: () => structuredClone(state),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState(patch) {
      if (patch.location) state.location = { ...state.location, ...patch.location };
      if (patch.time) state.time = { ...state.time, ...patch.time };
      if (patch.source !== undefined) state.source = patch.source;
      const snapshot = structuredClone(state);
      for (const listener of [...listeners]) listener(snapshot);
      return snapshot;
    },
    emit(patch) {
      state = { ...state, ...structuredClone(patch) };
      const snapshot = structuredClone(state);
      for (const listener of [...listeners]) listener(snapshot);
    },
  };
}

const WARSAW_STATE = {
  location: { name: "Warsaw", lat: 52.2297, lon: 21.0122, tz: "Europe/Warsaw" },
  time: { mode: "live", datetimeISO: null },
  profile: "default",
  range: "today",
  source: "url",
};

test("returns the exact Platform Context snapshot shape and preserves raw store compatibility", () => {
  const store = makeStore(WARSAW_STATE);
  const context = createPlatformContext(store, { locale: "en-GB", theme: "dark" });

  assert.deepEqual(context.get(), {
    observer: { name: "Warsaw", lat: 52.2297, lon: 21.0122, timezone: "Europe/Warsaw", source: "url" },
    time: { mode: "live", datetimeISO: null },
    locale: "en-GB",
    theme: "dark",
  });
  assert.strictEqual(context.storeApi, store);
  assert.deepEqual(context.getObserver(), context.get().observer);
});

test("keeps snapshots immutable and does not expose profile, range, or widget data", () => {
  const context = createPlatformContext(makeStore(WARSAW_STATE));
  const snapshot = context.get();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.observer), true);
  assert.equal(Object.isFrozen(snapshot.time), true);
  assert.throws(() => { snapshot.observer.name = "Changed"; }, TypeError);
  assert.equal(context.get().observer.name, "Warsaw");
  assert.deepEqual(Object.keys(snapshot).sort(), ["locale", "observer", "theme", "time"]);
});

test("maps observer/time transitions and state source without changing compatibility semantics", () => {
  const store = makeStore(WARSAW_STATE);
  const context = createPlatformContext(store, { locale: "en", theme: "auto" });
  const received = [];
  context.subscribe(snapshot => received.push(snapshot));

  const result = context.update({
    observer: { name: "Prague", lat: 50.0755, lon: 14.4378, timezone: "Europe/Prague", source: "user" },
    time: { mode: "manual", datetimeISO: "2026-09-09T21:00:00Z" },
  });

  assert.deepEqual(result, context.get());
  assert.deepEqual(context.get(), {
    observer: { name: "Prague", lat: 50.0755, lon: 14.4378, timezone: "Europe/Prague", source: "user" },
    time: { mode: "manual", datetimeISO: "2026-09-09T21:00:00Z" },
    locale: "en",
    theme: "auto",
  });
  assert.equal(received.length, 1);
});

test("filters profile/range-only store emissions", () => {
  const store = makeStore(WARSAW_STATE);
  const context = createPlatformContext(store);
  let calls = 0;
  context.subscribe(() => { calls += 1; });

  store.emit({ profile: "visual", range: "48h" });
  assert.equal(calls, 0);
  assert.equal(context.get().observer.source, "url");
});

test("unsubscribe stops context notifications and unsupported patches are ignored", () => {
  const store = makeStore(WARSAW_STATE);
  const context = createPlatformContext(store);
  let calls = 0;
  const unsubscribe = context.subscribe(() => { calls += 1; });

  const before = context.get();
  const unsupportedResult = context.update({ profile: "planetary", range: "7d", widget: { type: "weather" } });
  assert.strictEqual(unsupportedResult, before);
  assert.equal(calls, 0);

  unsubscribe();
  context.update({ time: { mode: "manual", datetimeISO: "2026-09-09T22:00:00Z" } });
  assert.equal(calls, 0);
});

test("supports context-local locale/theme patches while rejecting invalid values", () => {
  const context = createPlatformContext(makeStore(WARSAW_STATE), { locale: "en", theme: "auto" });
  let calls = 0;
  context.subscribe(() => { calls += 1; });

  context.update({ locale: "pl", theme: "dark", profile: "visual" });
  assert.equal(context.get().locale, "pl");
  assert.equal(context.get().theme, "dark");
  assert.equal(calls, 1);

  context.update({ locale: 42, theme: "neon" });
  assert.equal(context.get().locale, "pl");
  assert.equal(context.get().theme, "dark");
  assert.equal(calls, 1);
});

test("does not require browser globals", async () => {
  const source = await readFile(new URL("../sites/staging/weather/core/context.js", import.meta.url), "utf8");
  for (const name of ["window", "document", "URL", "localStorage"]) {
    assert.doesNotMatch(source, new RegExp(`\\b${name}\\b`));
  }
  const context = createPlatformContext(makeStore(WARSAW_STATE));
  assert.equal(context.get().observer.source, "url");
});

test("adapts the real state store in Node without page globals", () => {
  assert.equal(globalThis.window, undefined);
  assert.equal(globalThis.document, undefined);
  assert.equal(globalThis.localStorage, undefined);

  const initial = realState.getState();
  const context = createPlatformContext(realState, { locale: "en", theme: "auto" });
  const received = [];
  const unsubscribe = context.subscribe(snapshot => received.push(snapshot));

  try {
    const manual = context.update({
      observer: {
        name: "Prague",
        lat: 50.0755,
        lon: 14.4378,
        timezone: "Europe/Prague",
        source: "user",
      },
      time: { mode: "manual", datetimeISO: "2026-09-09T21:00:00Z" },
    });
    assert.equal(manual.observer.timezone, "Europe/Prague");
    assert.equal(manual.observer.source, "user");
    assert.equal(manual.time.mode, "manual");
    assert.equal(manual.time.datetimeISO, "2026-09-09T21:00:00Z");

    const live = context.update({
      observer: { timezone: "Europe/Warsaw" },
      time: { mode: "live", datetimeISO: null },
    });
    assert.equal(live.observer.timezone, "Europe/Warsaw");
    assert.equal(live.time.mode, "live");
    assert.equal(live.time.datetimeISO, null);
    assert.equal(received.length, 2);
  } finally {
    unsubscribe();
    realState.setState({
      location: initial.location,
      time: initial.time,
      source: initial.source,
      profile: initial.profile,
      range: initial.range,
    });
  }
});
