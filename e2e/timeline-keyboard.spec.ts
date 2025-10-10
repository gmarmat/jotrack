import { test, expect } from "./_setup";

test.describe("Timeline Keyboard Navigation", () => {
  test("can navigate timeline with arrow keys", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Keyboard Nav Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Keyboard Nav Test")');
    await page.waitForTimeout(1000);

    // Focus PHONE_SCREEN node
    const phoneScreenNode = page.getByTestId("timeline-PHONE_SCREEN");
    await phoneScreenNode.focus();

    // Press right arrow → should move to ONSITE
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);

    // Should open ONSITE detail panel
    await expect(page.getByTestId("status-detail-panel")).toBeVisible();

    // Press left arrow → should go back to PHONE_SCREEN
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(300);
  });

  test("Enter key opens status detail panel", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Enter Key Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "APPLIED");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Enter Key Test")');
    await page.waitForTimeout(1000);

    // Focus ON_RADAR
    const onRadarNode = page.getByTestId("timeline-ON_RADAR");
    await onRadarNode.focus();

    // Press Enter
    await page.keyboard.press("Enter");

    // Should open detail panel
    await expect(page.getByTestId("status-detail-panel")).toBeVisible();
  });

  test("Space key also opens detail panel", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Space Key Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "OFFER");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Space Key Test")');
    await page.waitForTimeout(1000);

    const offerNode = page.getByTestId("timeline-OFFER");
    await offerNode.focus();
    await page.keyboard.press(" ");

    await expect(page.getByTestId("status-detail-panel")).toBeVisible();
  });

  test("timeline is sticky at top", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Sticky Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Sticky Test")');
    await page.waitForTimeout(1000);

    // Get timeline position
    const timeline = page.getByTestId("horizontal-timeline");
    await expect(timeline).toBeVisible();

    const classList = await timeline.getAttribute("class");
    expect(classList).toContain("sticky");
    expect(classList).toContain("top-0");
    expect(classList).toContain("z-40");
  });
});

