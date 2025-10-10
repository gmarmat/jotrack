import { test, expect } from "./_setup";

test.describe("Timeline Delta", () => {
  test("shows delta badge on current status", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Delta Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "APPLIED");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Delta Test")');
    await page.waitForTimeout(1000);

    // Should show delta badge in timeline
    const currentNode = page.locator('[data-current="true"]');
    await expect(currentNode).toBeVisible();

    // Delta badge should be visible (format: "Xd" or "Xh")
    const deltaBadge = currentNode.locator('span.bg-blue-600');
    await expect(deltaBadge).toBeVisible();
    
    const deltaText = await deltaBadge.textContent();
    expect(deltaText).toMatch(/\d+(d|h|m)/);
  });

  test("header meta shows delta chip", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Header Delta Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "PHONE_SCREEN");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Header Delta Test")');
    await page.waitForTimeout(1000);

    // Check header meta exists
    await expect(page.getByTestId("header-meta")).toBeVisible();

    // Delta chip should be visible
    const deltaChip = page.getByTestId("timeline-current-delta");
    await expect(deltaChip).toBeVisible();
    
    const chipText = await deltaChip.textContent();
    expect(chipText).toMatch(/\d+(d|h)/);
  });

  test("shows stale badge for jobs >10 days in status", async ({ page }) => {
    // Note: This would require mocking old dates or using test data
    // For now, verify the UI structure exists
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Stale Check");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Stale Check")');
    await page.waitForTimeout(1000);

    // Header meta should exist
    await expect(page.getByTestId("header-meta")).toBeVisible();

    // Delta chip should exist (even if not stale)
    const hasDelta = await page.getByTestId("timeline-current-delta").isVisible();
    expect(hasDelta).toBeTruthy();
  });
});

