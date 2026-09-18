import { test, expect } from "@playwright/test";

test("Platform Context propagates observer and live/manual time over the weather store", async ({ page }) => {
  await page.goto("/widget-host/", { waitUntil: "domcontentloaded" });

  const contract = await page.evaluate(async () => {
    const state = await import("/weather/core/state.js");
    const { createPlatformContext } = await import("/weather/core/context.js");
    const initial = state.getState();
    const context = createPlatformContext(state, { locale: "en-GB", theme: "dark" });
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
      const live = context.update({
        time: { mode: "live", datetimeISO: null },
      });

      return {
        manual,
        live,
        observer: context.getObserver(),
        received,
        fields: Object.keys(context.get()).sort(),
      };
    } finally {
      unsubscribe();
      context.destroy();
      state.setState({
        location: initial.location,
        time: initial.time,
        profile: initial.profile,
        range: initial.range,
        source: initial.source,
      });
    }
  });

  expect(contract.fields).toEqual(["locale", "observer", "theme", "time"]);
  expect(contract.manual).toMatchObject({
    observer: {
      name: "Prague",
      lat: 50.0755,
      lon: 14.4378,
      timezone: "Europe/Prague",
      source: "user",
    },
    time: { mode: "manual", datetimeISO: "2026-09-09T21:00:00Z" },
    locale: "en-GB",
    theme: "dark",
  });
  expect(contract.live.time).toEqual({ mode: "live", datetimeISO: null });
  expect(contract.observer).toEqual(contract.manual.observer);
  expect(contract.received).toHaveLength(2);
  expect(contract.received[0]).toMatchObject({
    observer: { name: "Prague", timezone: "Europe/Prague" },
    time: { mode: "manual", datetimeISO: "2026-09-09T21:00:00Z" },
  });
  expect(contract.received[1].time).toEqual({ mode: "live", datetimeISO: null });
});
