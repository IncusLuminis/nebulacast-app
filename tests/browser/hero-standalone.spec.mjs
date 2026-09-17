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
      return { rootLeft: root.left, rootRight: root.right, rootWidth: root.width, rootHeight: root.height, cardWidth: card?.width || 0, cardHeight: card?.height || 0 };
    });
    expect(bounds.rootWidth).toBeGreaterThan(0);
    expect(bounds.rootHeight).toBeGreaterThan(0);
    expect(bounds.cardWidth).toBeGreaterThan(0);
    expect(bounds.cardHeight).toBeGreaterThan(0);
    if (orientation === "vertical") {
      const cards = await hero.locator(".hero-card").evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        const row = element.querySelector(".hero-card-row")?.getBoundingClientRect();
        const profiles = element.querySelector(".nop-profiles")?.getBoundingClientRect();
        const rowChildren = [...(element.querySelectorAll(".hero-card-row > *") || [])].map(child => child.getBoundingClientRect());
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, rowWidth: row?.width || 0, profilesWidth: profiles?.width || 0, rowChildren };
      }));
      expect(cards.length).toBeGreaterThan(1);
      for (let index = 1; index < cards.length; index += 1) {
        expect(cards[index].top).toBeGreaterThanOrEqual(cards[index - 1].bottom - 1);
        expect(cards[index].left).toBeGreaterThanOrEqual(cards[0].left);
        expect(cards[index].right).toBeLessThanOrEqual(bounds.rootRight + 1);
      }
      const matrix = cards.find(card => card.rowWidth > 0);
      expect(matrix).toBeTruthy();
      expect(matrix.rowWidth).toBeGreaterThan(0);
      expect(matrix.profilesWidth).toBeGreaterThan(0);
      expect(matrix.rowChildren.length).toBeGreaterThan(1);
      expect(matrix.rowChildren[1].top).toBeGreaterThanOrEqual(matrix.rowChildren[0].bottom - 1);
      expect(await hero.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
  });
}
