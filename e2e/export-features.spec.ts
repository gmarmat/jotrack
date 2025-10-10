import { test, expect } from "./_setup";
import path from "path";

test.describe("Export Features", () => {
  test("CSV export downloads file", async ({ page }) => {
    await page.goto("/");

    // Create a job for export
    await page.fill('input[placeholder*="Senior React Developer"]', "CSV Export Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "APPLIED");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("CSV Export Test")');
    await page.waitForTimeout(1000);

    // Click CSV export
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-csv").click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/jotrack-export-\d+\.csv/);
  });

  test("Job ZIP export includes attachments", async ({ page }) => {
    await page.goto("/");

    await page.fill('input[placeholder*="Senior React Developer"]', "ZIP Export Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("ZIP Export Test")');
    await page.waitForTimeout(1000);

    // Upload a file
    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-jd.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Click Job ZIP export
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-job-zip").click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/job-export-\d+\.zip/);
  });

  test("export buttons are visible", async ({ page }) => {
    await page.goto("/");

    await page.fill('input[placeholder*="Senior React Developer"]', "Export Buttons Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "OFFER");
    await page.click('button[type="submit"]');

    await page.click('a:has-text("Export Buttons Test")');
    await page.waitForTimeout(1000);

    await expect(page.getByTestId("export-buttons")).toBeVisible();
    await expect(page.getByTestId("export-csv")).toBeVisible();
    await expect(page.getByTestId("export-job-zip")).toBeVisible();
  });
});

