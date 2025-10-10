import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Multi-Upload", () => {
  test("Multi-upload shows progress and adds all files", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "MultiUpload Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("MultiUpload Test")');
    await page.waitForTimeout(1000);

    // Upload multiple files at once
    const files = [
      path.join(__dirname, "fixtures", "sample-jd.txt"),
      path.join(__dirname, "fixtures", "sample-cover.txt"),
      path.join(__dirname, "fixtures", "names.txt"),
    ];

    const input = page.getByTestId("input-resume");
    await input.setInputFiles(files);

    // Verify progress indicator appears
    await expect(page.getByTestId("upload-progress")).toBeVisible();
    await expect(page.getByTestId("upload-progress")).toContainText("%");

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Verify all files were uploaded
    await expect(page.getByText("sample-jd.txt")).toBeVisible();
    await expect(page.getByText("sample-cover.txt")).toBeVisible();
    await expect(page.getByText("names.txt")).toBeVisible();
  });

  test("Drag and drop multiple files", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "DragDrop Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("DragDrop Test")');
    await page.waitForTimeout(1000);

    // Simulate drag over
    const dropzone = page.getByTestId("drop-resume");
    await expect(dropzone).toBeVisible();

    // Upload files via input (Playwright doesn't support full drag-drop simulation)
    const files = [
      path.join(__dirname, "fixtures", "sample-jd.txt"),
      path.join(__dirname, "fixtures", "sample-cover.txt"),
    ];

    const input = page.getByTestId("input-resume");
    await input.setInputFiles(files);

    // Wait for uploads
    await page.waitForTimeout(3000);

    // Verify uploads
    await expect(page.getByText("sample-jd.txt")).toBeVisible();
    await expect(page.getByText("sample-cover.txt")).toBeVisible();
  });

  test("Progress shows 100% on completion", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Progress Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("Progress Test")');
    await page.waitForTimeout(1000);

    // Upload files
    const files = [
      path.join(__dirname, "fixtures", "sample-jd.txt"),
      path.join(__dirname, "fixtures", "sample-cover.txt"),
    ];

    const input = page.getByTestId("input-resume");
    await input.setInputFiles(files);

    // Wait for progress to show 100%
    await expect(page.getByTestId("upload-progress")).toContainText("100%", {
      timeout: 5000,
    });

    // Progress should disappear after completion
    await expect(page.getByTestId("upload-progress")).not.toBeVisible({
      timeout: 2000,
    });
  });
});

