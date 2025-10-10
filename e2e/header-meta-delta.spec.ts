import { test, expect } from "./_setup";

test.describe("Header Meta Delta", () => {
  test("header shows posting link that opens in new tab", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Posting Link Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.fill('input[placeholder*="example.com"]', "https://careers.example.com/job/123");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Posting Link Test")');
    await page.waitForTimeout(1000);

    // Posting link should be visible
    const postingLink = page.getByTestId("posting-link");
    await expect(postingLink).toBeVisible();

    // Should open in new tab (not download)
    const target = await postingLink.getAttribute("target");
    expect(target).toBe("_blank");

    const href = await postingLink.getAttribute("href");
    expect(href).toBe("https://careers.example.com/job/123");
  });

  test("header shows created and updated timestamps", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Timestamps Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "APPLIED");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Timestamps Test")');
    await page.waitForTimeout(1000);

    const headerMeta = page.getByTestId("header-meta");
    await expect(headerMeta).toBeVisible();

    // Should show created and updated labels
    await expect(headerMeta.getByText(/Created:/)).toBeVisible();
    await expect(headerMeta.getByText(/Updated:/)).toBeVisible();
  });

  test("delta chip has proper styling", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Delta Styling");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Delta Styling")');
    await page.waitForTimeout(1000);

    const deltaChip = page.getByTestId("timeline-current-delta");
    
    if (await deltaChip.isVisible()) {
      const classList = await deltaChip.getAttribute("class");
      // Should have rounded-full and color classes
      expect(classList).toContain("rounded-full");
      expect(classList).toMatch(/(bg-blue|bg-amber)/);
    }
  });
});

