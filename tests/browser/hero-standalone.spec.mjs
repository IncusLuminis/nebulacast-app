import { test, expect } from "@playwright/test";

for (const orientation of ["horizontal", "vertical"]) {
  test(`Hero standalone route fills its ${orientation} host`, async ({ page }) => {
    await page.goto(`/hero/?orientation=${orientation}`, { waitUntil: "domcontentloaded" });
    const hero = page.locator("#heroRoot");
    await expect(hero).toHaveAttribute("data-nc-widget", "hero");
    await expect(hero).toHaveAttribute("data-nc-orientation", orientation);
    await expect(hero.locator(".hero-card").first()).toBeVisible();
    const bounds = await hero.evaluate(element => {
      const root = element.getBoundingClientRect();
      const card = element.querySelector(".hero-card")?.getBoundingClientRect();
      return { rootWidth: root.width, rootHeight: root.height, cardWidth: card?.width || 0, cardHeight: card?.height || 0 };
    });
    expect(bounds.rootWidth).toBeGreaterThan(0);
    expect(bounds.rootHeight).toBeGreaterThan(0);
    expect(bounds.cardWidth).toBeGreaterThan(0);
    expect(bounds.cardHeight).toBeGreaterThan(0);
  });
}
