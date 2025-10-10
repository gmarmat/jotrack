import { test, expect } from "./_setup";
import path from "path";

test.describe("Utility Rail", () => {
  test("rail starts collapsed and shows icon buttons", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Rail Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Rail Test")');
    await page.waitForTimeout(1000);

    // Should show collapsed rail
    await expect(page.getByTestId("utility-rail-collapsed")).toBeVisible();
    
    // Should NOT show expanded rail initially
    await expect(page.getByTestId("utility-rail-expanded")).not.toBeVisible();
  });

  test("clicking Files icon expands rail to Files tab", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Files Tab Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Files Tab Test")');
    await page.waitForTimeout(1000);

    // Click Files icon
    await page.locator('button[aria-label="Open files"]').click();

    // Rail should expand
    await expect(page.getByTestId("utility-rail-expanded")).toBeVisible();
    
    // Files tab should be active
    const filesTab = page.getByTestId("tab-files");
    const tabClass = await filesTab.getAttribute("class");
    expect(tabClass).toContain("border-blue-600");
  });

  test("keyboard shortcut 'f' opens Files tab", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Keyboard F Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Keyboard F Test")');
    await page.waitForTimeout(1000);

    // Press 'f'
    await page.keyboard.press("f");

    // Rail should expand to Files tab
    await expect(page.getByTestId("utility-rail-expanded")).toBeVisible();
    await expect(page.getByTestId("tab-files")).toHaveClass(/border-blue-600/);
  });

  test("keyboard shortcut 'm' opens Meta tab", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Keyboard M Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Keyboard M Test")');
    await page.waitForTimeout(1000);

    // Press 'm'
    await page.keyboard.press("m");

    await expect(page.getByTestId("utility-rail-expanded")).toBeVisible();
    await expect(page.getByTestId("tab-meta")).toHaveClass(/border-blue-600/);
  });

  test("Escape key closes rail", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Escape Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Escape Test")');
    await page.waitForTimeout(1000);

    // Open rail with 'f'
    await page.keyboard.press("f");
    await expect(page.getByTestId("utility-rail-expanded")).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Rail should collapse
    await expect(page.getByTestId("utility-rail-expanded")).not.toBeVisible();
    await expect(page.getByTestId("utility-rail-collapsed")).toBeVisible();
  });

  test("Files tab shows uploaded files with preview links", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Files Preview Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Files Preview Test")');
    await page.waitForTimeout(1000);

    // Upload a file
    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-jd.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Open Files tab
    await page.keyboard.press("f");
    await expect(page.getByTestId("utility-rail-expanded")).toBeVisible();

    // Should show the file
    const fileLinks = page.locator('[data-testid^="file-"]');
    await expect(fileLinks).toHaveCount(1);

    // File should be a link (not download trigger)
    const firstLink = fileLinks.first();
    const href = await firstLink.getAttribute("href");
    expect(href).toContain("/api/files/stream");

    // Should open in new tab
    const target = await firstLink.getAttribute("target");
    expect(target).toBe("_blank");
  });

  test("Meta tab shows job details", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Meta Tab Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "OFFER");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Meta Tab Test")');
    await page.waitForTimeout(1000);

    // Open Meta tab
    await page.getByTestId("tab-meta").click();

    // Should show job details
    await expect(page.getByText("Meta Tab Test")).toBeVisible();
    await expect(page.getByText("Test Company")).toBeVisible();
    await expect(page.getByText(/OFFER/)).toBeVisible();
  });

  test("rail width is approximately 320px", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Width Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Width Test")');
    await page.waitForTimeout(1000);

    await page.keyboard.press("f");

    const rail = page.getByTestId("utility-rail-expanded");
    const classList = await rail.getAttribute("class");
    expect(classList).toContain("w-80"); // 320px in Tailwind
  });
});

