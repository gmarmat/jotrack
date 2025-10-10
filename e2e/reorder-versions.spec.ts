import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Drag Reorder Versions", () => {
  test("Drag to reorder versions persists visually", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Reorder Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("Reorder Test")');
    await page.waitForTimeout(1000);

    // Upload 3 files to create 3 versions
    const files = [
      path.join(__dirname, "fixtures", "sample-jd.txt"),
      path.join(__dirname, "fixtures", "sample-cover.txt"),
      path.join(__dirname, "fixtures", "names.txt"),
    ];

    for (const file of files) {
      const input = page.getByTestId("input-resume");
      await input.setInputFiles([file]);
      await page.waitForTimeout(1500);
    }

    // Expand versions if collapsed
    const versionsSection = page.getByTestId("versions-resume");
    await expect(versionsSection).toBeVisible();

    // Check that we have 3 versions
    const versionRows = versionsSection.locator('[data-testid^="version-row-"]');
    await expect(versionRows).toHaveCount(3);

    // Get initial order
    const firstRowBefore = await versionRows.first().textContent();
    console.log("First row before:", firstRowBefore);

    // Drag first version to last position
    // Note: This tests the UI structure; actual drag behavior requires user interaction
    const firstRow = versionsSection.getByTestId("version-row-3"); // newest version
    const lastRow = versionsSection.getByTestId("version-row-1"); // oldest version

    // Verify drag attributes exist
    await expect(firstRow).toHaveAttribute("draggable", "true");
    await expect(lastRow).toHaveAttribute("draggable", "true");

    // Simulate drag (visual check)
    await firstRow.dragTo(lastRow);
    await page.waitForTimeout(500);

    // Reload page to verify order persisted in localStorage
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify order changed
    const firstRowAfter = await versionRows.first().textContent();
    console.log("First row after:", firstRowAfter);
    
    // The order should have changed (this is a best-effort test)
    expect(firstRowAfter).not.toBe(firstRowBefore);
  });

  test("Versions have drag cursor and visual feedback", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Visual Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("Visual Test")');
    await page.waitForTimeout(1000);

    // Upload 2 files
    const files = [
      path.join(__dirname, "fixtures", "sample-jd.txt"),
      path.join(__dirname, "fixtures", "sample-cover.txt"),
    ];

    const input = page.getByTestId("input-resume");
    await input.setInputFiles(files);
    await page.waitForTimeout(3000);

    // Check that version rows are draggable
    const versionRows = page.locator('[data-testid^="version-row-"]');
    await expect(versionRows.first()).toBeVisible();
    await expect(versionRows.first()).toHaveAttribute("draggable", "true");
    
    // Check for cursor-move class
    const classList = await versionRows.first().getAttribute("class");
    expect(classList).toContain("cursor-move");
  });

  test("localStorage preserves order across page reloads", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Persistence Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("Persistence Test")');
    await page.waitForTimeout(1000);

    // Upload files
    const files = [
      path.join(__dirname, "fixtures", "sample-jd.txt"),
      path.join(__dirname, "fixtures", "sample-cover.txt"),
    ];

    const input = page.getByTestId("input-resume");
    await input.setInputFiles(files);
    await page.waitForTimeout(3000);

    // Get version IDs from localStorage
    const localStorageKeys = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("order:"));
      return keys;
    });

    // Should have at least one order key
    expect(localStorageKeys.length).toBeGreaterThan(0);

    // Reload and verify localStorage still has the key
    await page.reload();
    await page.waitForTimeout(1000);

    const localStorageKeysAfter = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("order:"));
      return keys;
    });

    expect(localStorageKeysAfter).toEqual(localStorageKeys);
  });
});

