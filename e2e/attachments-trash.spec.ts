import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Attachments Trash", () => {
  test("can view trash, restore, and purge items", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Trash Test Job");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("Trash Test Job")');
    await expect(page.getByTestId("job-title")).toContainText("Trash Test Job");

    // Upload a file
    const filePath = path.join(__dirname, "fixtures", "sample-jd.txt");
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);

    // Delete the file (soft delete)
    const deleteBtn = page.locator('button[aria-label="Delete"]').first();
    await deleteBtn.click();

    // Open trash
    await page.getByTestId("open-trash").click();
    await expect(page.getByTestId("trash-panel")).toBeVisible();

    // Verify trash item appears
    await expect(page.getByTestId("trash-row").first()).toBeVisible();
    await expect(page.getByTestId("trash-panel").getByText("sample-jd.txt")).toBeVisible();

    // Test restore
    await page.locator('button[aria-label="Restore"]').first().click();
    await page.waitForTimeout(1000);

    // Trash should be empty after restore
    await expect(page.getByText("No trashed items")).toBeVisible();

    // Close trash
    await page.click('button:has-text("Close")');
    await expect(page.getByTestId("trash-panel")).not.toBeVisible();

    // Verify file is back in attachments (look in attachments section, not toast)
    await expect(page.locator('[data-testid="attachments-section"]').getByText("sample-jd.txt")).toBeVisible();

    // Delete again
    await page.locator('button[aria-label="Delete"]').first().click();
    await page.waitForTimeout(1000);

    // Open trash again
    await page.getByTestId("open-trash").click();
    await expect(page.getByTestId("trash-row").first()).toBeVisible();

    // Purge single item
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Permanently delete");
      dialog.accept();
    });
    await page.locator('button[aria-label="Purge"]').first().click();
    await page.waitForTimeout(1000);

    // Trash should be empty
    await expect(page.getByText("No trashed items")).toBeVisible();
  });

  test("can purge all trash items at once", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Bulk Trash Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("Bulk Trash Test")');

    // Upload multiple files
    const files = [
      path.join(__dirname, "fixtures", "sample-jd.txt"),
      path.join(__dirname, "fixtures", "sample-cover.txt"),
    ];

    for (const file of files) {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(file);
      await page.waitForTimeout(1500);
    }

    // Delete both files
    const deleteButtons = page.locator('button[aria-label="Delete"]');
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
      await page.waitForTimeout(500);
    }

    // Open trash
    await page.getByTestId("open-trash").click();
    await expect(page.getByTestId("trash-panel")).toBeVisible();

    // Verify multiple items in trash
    const trashRows = page.getByTestId("trash-row");
    await expect(trashRows).toHaveCount(count);

    // Purge all
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Permanently delete all");
      dialog.accept();
    });
    await page.getByTestId("purge-all").click();
    await page.waitForTimeout(1000);

    // Trash should be empty
    await expect(page.getByText("No trashed items")).toBeVisible();
  });

  test("trash panel displays item metadata correctly", async ({ page }) => {
    // Create a job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Metadata Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');

    // Navigate to job detail
    await page.click('a:has-text("Metadata Test")');
    
    await page.waitForTimeout(1000);

    // Upload a file
    const filePath = path.join(__dirname, "fixtures", "names.txt");
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);

    // Wait for upload to complete - check for file in attachments list
    await page.waitForSelector('text=names.txt', { timeout: 10000 });

    // Delete the file
    const deleteBtn = page.locator('button[aria-label="Delete"]').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await page.waitForTimeout(1500);

    // Open trash
    await page.getByTestId("open-trash").click();
    await expect(page.getByTestId("trash-panel")).toBeVisible();

    // Verify metadata
    await expect(page.getByTestId("trash-row")).toBeVisible({ timeout: 5000 });
    const trashRow = page.getByTestId("trash-row").first();
    await expect(trashRow.getByText("names.txt")).toBeVisible();
    await expect(trashRow.getByText(/v\d+/)).toBeVisible(); // Version number
  });
});

