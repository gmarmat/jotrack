import { test, expect } from "./_setup";
import path from "path";

test.describe("Attachments Integration - End to End", () => {
  test("should upload file and display in versions list", async ({ page }) => {
    // Create job
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Integration Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    // Navigate to job detail
    await page.click('a:has-text("Integration Test")');
    await page.waitForTimeout(1000);

    // Verify AttachmentsSection is present
    await expect(page.getByTestId("attachments-section")).toBeVisible();
    await expect(page.getByTestId("zone-resume")).toBeVisible();

    // Upload a file
    const filePath = path.join(__dirname, "fixtures", "sample-jd.txt");
    await page.getByTestId("input-resume").setInputFiles([filePath]);

    // Wait for upload
    await page.waitForTimeout(2000);

    // Verify file appears in versions list
    const versionsTable = page.getByTestId("versions-resume");
    await expect(versionsTable).toBeVisible();
    
    const versionRows = versionsTable.locator('[role="row"]');
    await expect(versionRows).toHaveCount(1);

    // Verify file content is displayed
    await expect(versionsTable.getByText("sample-jd.txt")).toBeVisible();
    await expect(versionsTable.getByText(/v1/)).toBeVisible();
  });

  test("should upload multiple files to different zones", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Multi-Zone Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Multi-Zone Test")');
    await page.waitForTimeout(1000);

    // Upload to resume
    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-jd.txt"),
    ]);
    await page.waitForTimeout(1500);

    // Upload to jd
    await page.getByTestId("input-jd").setInputFiles([
      path.join(__dirname, "fixtures", "sample-cover.txt"),
    ]);
    await page.waitForTimeout(1500);

    // Upload to cover_letter
    await page.getByTestId("input-cover_letter").setInputFiles([
      path.join(__dirname, "fixtures", "names.txt"),
    ]);
    await page.waitForTimeout(1500);

    // Verify all three zones have files
    await expect(page.getByTestId("versions-resume")).toBeVisible();
    await expect(page.getByTestId("versions-jd")).toBeVisible();
    await expect(page.getByTestId("versions-cover_letter")).toBeVisible();

    // Verify each has one version
    await expect(page.getByTestId("versions-resume").locator('[role="row"]')).toHaveCount(1);
    await expect(page.getByTestId("versions-jd").locator('[role="row"]')).toHaveCount(1);
    await expect(page.getByTestId("versions-cover_letter").locator('[role="row"]')).toHaveCount(1);
  });

  test("should show preview button for previewable files", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Preview Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Preview Test")');
    await page.waitForTimeout(1000);

    // Upload a text file (previewable)
    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-jd.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Verify preview button exists
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await expect(previewBtn).toBeVisible();
  });

  test("should show download button for all files", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Download Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Download Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "names.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Verify download link exists
    const downloadLink = page.locator('a[aria-label="Download"]').first();
    await expect(downloadLink).toBeVisible();
    
    const href = await downloadLink.getAttribute("href");
    expect(href).toContain("/api/files/stream?path=");
  });

  test("should handle delete and show undo button", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Delete Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Delete Test")');
    await page.waitForTimeout(1000);

    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-jd.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Click delete
    await page.locator('button[aria-label="Delete"]').first().click();
    await page.waitForTimeout(1000);

    // Verify undo button appears
    await expect(page.locator('button[aria-label="Undo"]').first()).toBeVisible();
  });

  test("should handle errors gracefully when upload fails", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Error Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Error Test")');
    await page.waitForTimeout(1000);

    // Listen for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Try to upload an empty file (should not crash)
    try {
      await page.getByTestId("input-resume").setInputFiles([
        path.join(__dirname, "fixtures", "empty.txt"),
      ]);
      await page.waitForTimeout(2000);
    } catch (error) {
      // Expected to potentially fail, but should not crash the app
    }

    // Verify page is still functional
    await expect(page.getByTestId("attachments-section")).toBeVisible();
  });

  test("should maintain state across page reload", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder*="Senior React Developer"]', "Persist Test");
    await page.fill('input[placeholder*="TechCorp"]', "Test Company");
    await page.selectOption("select", "ON_RADAR");
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Persist Test")');
    await page.waitForTimeout(1000);

    // Upload files
    await page.getByTestId("input-resume").setInputFiles([
      path.join(__dirname, "fixtures", "sample-jd.txt"),
    ]);
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify file still appears
    await expect(page.getByTestId("versions-resume")).toBeVisible();
    await expect(page.getByText("sample-jd.txt")).toBeVisible();
  });
});

