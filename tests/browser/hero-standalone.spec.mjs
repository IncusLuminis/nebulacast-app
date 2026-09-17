import { test, expect } from "@playwright/test";

for (const orientation of ["horizontal", "vertical"]) {
  test(`Hero standalone route fills its ${orientation} host`, async ({ page }) => {
    await page.goto(`/hero/?orientation=${orientation}`, { waitUntil: "domcontentloaded" });
    const hero = page.locator("#heroRoot");
    await expect(hero).toHaveAttribute("data-nc-widget", "hero");
    await expect(hero).toHaveAttribute("data-nc-orientation", orientation);
    await expect(hero.locator(".hero-card").first()).toBeVisible();
    await expect(hero.locator('[data-role="clock-date"]')).toBeVisible({ timeout: 15_000 });
    const bounds = await hero.evaluate(element => {
      const root = element.getBoundingClientRect();
      const card = element.querySelector(".hero-card")?.getBoundingClientRect();
      return { rootLeft: root.left, rootRight: root.right, rootWidth: root.width, rootHeight: root.height, cardWidth: card?.width || 0, cardHeight: card?.height || 0 };
    });
    expect(bounds.rootWidth).toBeGreaterThan(0);
    expect(bounds.rootHeight).toBeGreaterThan(0);
    expect(bounds.cardWidth).toBeGreaterThan(0);
    expect(bounds.cardHeight).toBeGreaterThan(0);
    if (orientation === "horizontal") {
      await expect(hero.locator('.hero-card[data-panel="weather"] .pressure')).toHaveText(/\d|—/);
    }
    if (orientation === "vertical") {
      const layout = await hero.locator(".hero-card").evaluateAll(elements => Object.fromEntries(elements.map(element => {
        const rect = element.getBoundingClientRect();
        const row = element.querySelector(".hero-card-row")?.getBoundingClientRect();
        const profiles = element.querySelector(".nop-profiles")?.getBoundingClientRect();
        const weatherChips = element.querySelector(".hero-weather-chips")?.getBoundingClientRect();
        const weatherChipsStyle = element.querySelector(".hero-weather-chips") ? getComputedStyle(element.querySelector(".hero-weather-chips")) : null;
        const weatherMetrics = element.querySelectorAll(".hero-weather-chips .metric").length;
        const weatherMetricTops = Array.from(element.querySelectorAll(".hero-weather-chips .metric"), metric => metric.getBoundingClientRect().top);
        const date = element.querySelector('[data-role="clock-date"]')?.getBoundingClientRect();
        const time = element.querySelector('[data-role="clock-time"]')?.getBoundingClientRect();
        const timeStyle = element.querySelector('[data-role="clock-time"]') ? getComputedStyle(element.querySelector('[data-role="clock-time"]')) : null;
        const dateStyle = element.querySelector('[data-role="clock-date"]') ? getComputedStyle(element.querySelector('[data-role="clock-date"]')) : null;
        const nqi = element.querySelector(".nqi-value")?.getBoundingClientRect();
        const nqiStyle = element.querySelector(".nqi-value") ? getComputedStyle(element.querySelector(".nqi-value")) : null;
        const windowTime = element.querySelector(".window-time")?.getBoundingClientRect();
        const windowPrefix = element.querySelector(".window-prefix")?.getBoundingClientRect();
        const windowRange = element.querySelector(".window-range")?.getBoundingClientRect();
        const windowRangeStyle = element.querySelector(".window-range") ? getComputedStyle(element.querySelector(".window-range")) : null;
        const summary = element.querySelector(".nop-summary-text")?.getBoundingClientRect();
        return [element.dataset.panel, {
          top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right,
          row: row && { top: row.top, bottom: row.bottom, left: row.left, right: row.right },
          profiles: profiles && { top: profiles.top, bottom: profiles.bottom, left: profiles.left, right: profiles.right },
          weatherChips: weatherChips && { top: weatherChips.top, bottom: weatherChips.bottom, left: weatherChips.left, right: weatherChips.right },
          weatherChipsStyle: weatherChipsStyle && { flexDirection: weatherChipsStyle.flexDirection, flexWrap: weatherChipsStyle.flexWrap, whiteSpace: weatherChipsStyle.whiteSpace },
          weatherMetrics,
          weatherMetricTops,
          date: date && { top: date.top, bottom: date.bottom, left: date.left, right: date.right },
          time: time && { top: time.top, bottom: time.bottom, left: time.left, right: time.right },
          timeStyle: timeStyle && { fontSize: timeStyle.fontSize },
          dateStyle: dateStyle && { fontSize: dateStyle.fontSize },
          nqi: nqi && { top: nqi.top, bottom: nqi.bottom, left: nqi.left, right: nqi.right },
          nqiStyle: nqiStyle && { fontSize: nqiStyle.fontSize },
          windowTime: windowTime && { top: windowTime.top, bottom: windowTime.bottom, left: windowTime.left, right: windowTime.right },
          windowPrefix: windowPrefix && { top: windowPrefix.top, bottom: windowPrefix.bottom },
          windowRange: windowRange && { top: windowRange.top, bottom: windowRange.bottom, left: windowRange.left, right: windowRange.right },
          windowRangeStyle: windowRangeStyle && { fontSize: windowRangeStyle.fontSize, display: windowRangeStyle.display },
          summary: summary && { top: summary.top, bottom: summary.bottom, left: summary.left, right: summary.right },
        }];
      })));
      for (const panel of ["weather", "matrix", "window"]) {
        expect(layout[panel].left).toBeGreaterThanOrEqual(bounds.rootLeft - 1);
        expect(layout[panel].right).toBeLessThanOrEqual(bounds.rootRight + 1);
        expect(layout[panel].right - layout[panel].left).toBeGreaterThan(bounds.rootWidth - 25);
      }
      expect(layout.sunmoon.top).toBeGreaterThanOrEqual(layout.window.bottom - 1);
      expect(layout.solar.top).toBeGreaterThanOrEqual(layout.window.bottom - 1);
      expect(Math.abs(layout.sunmoon.top - layout.solar.top)).toBeLessThanOrEqual(1);
      expect(layout.sunmoon.right).toBeLessThanOrEqual(layout.solar.left + 2);
      expect(layout.helio.top).toBeGreaterThanOrEqual(layout.sunmoon.bottom - 1);
      const helioCards = await hero.locator('.hero-card[data-panel="helio"]').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, left: rect.left, right: rect.right };
      }));
      expect(helioCards).toHaveLength(2);
      expect(Math.abs(helioCards[0].top - helioCards[1].top)).toBeLessThanOrEqual(1);
      expect(helioCards[0].right).toBeLessThanOrEqual(helioCards[1].left + 2);
      expect(layout.weather.date.bottom).toBeLessThanOrEqual(layout.weather.time.top + 2);
      expect(layout.weather.weatherChips.left).toBeGreaterThanOrEqual(layout.weather.date.right - 2);
      expect(layout.weather.weatherChipsStyle.flexDirection).toBe("column");
      expect(layout.weather.weatherChipsStyle.flexWrap).toBe("nowrap");
      expect(layout.weather.weatherChipsStyle.whiteSpace).toBe("nowrap");
      expect(layout.weather.weatherMetrics).toBe(3);
      expect(parseFloat(layout.weather.dateStyle.fontSize)).toBeGreaterThanOrEqual(28);
      expect(Math.max(...layout.weather.weatherMetricTops) - Math.min(...layout.weather.weatherMetricTops)).toBeGreaterThan(10);
      await expect(hero.locator('.hero-card[data-panel="weather"] .kp')).toHaveText(/\d|—/);
      expect(parseFloat(layout.weather.timeStyle.fontSize)).toBeGreaterThanOrEqual(50);
      expect(parseFloat(layout.matrix.nqiStyle.fontSize)).toBeGreaterThanOrEqual(80);
      expect(parseFloat(layout.window.windowRangeStyle.fontSize)).toBeGreaterThanOrEqual(22);
      expect(layout.window.windowPrefix.bottom).toBeLessThanOrEqual(layout.window.windowRange.top);
      expect(layout.window.windowRangeStyle.display).toBe("block");
      expect(layout.matrix.profiles.top).toBeGreaterThanOrEqual(layout.matrix.row.top - 1);
      expect(layout.matrix.profiles.bottom).toBeLessThanOrEqual(layout.matrix.row.bottom + 1);
      expect(layout.window.windowTime.right).toBeLessThanOrEqual(layout.window.summary.left + 2);
      expect(await hero.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
  });
}
