import { test, expect } from "@playwright/test";
import path from "path";

test("per-item undo with countdown supports concurrent deletes", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible" });

  const timestamp = Date.now();
  const jobTitle = `Concurrent Delete Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Concurrent Test Co");
  await page.selectOption("select", "APPLIED");

  const createJob = page.waitForResponse(
    (resp) => resp.url().includes("/api/jobs") && resp.request().method() === "POST"
  );
  await page.getByRole("button", { name: /add job application/i }).click();
  const jobResponse = await createJob;
  const jobData = await jobResponse.json();
  const jobId = jobData.job?.id;

  expect(jobId).toBeTruthy();

  // Navigate to job detail page
  await page.goto(`/jobs/${jobId}`);
  await expect(page.getByTestId("attachments-panel")).toBeVisible();

  // Upload 2 files to different zones
  const resumePath = path.join(__dirname, "fixtures", "sample-resume.txt");
  const jdPath = path.join(__dirname, "fixtures", "sample-jd.txt");

  // Upload resume
  const resumeUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[accept*="pdf"]').first().setInputFiles(resumePath);
  await resumeUpload;
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 3000 });

  // Upload JD
  const jdUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[accept*="pdf"]').nth(1).setInputFiles(jdPath);
  await jdUpload;
  await expect(page.locator('text=sample-jd.txt')).toBeVisible({ timeout: 3000 });

  // Delete both files quickly
  const deleteButtons = page.getByTestId(/^att-delete-/);
  
  const delete1 = page.waitForResponse(
    (resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/delete')
  );
  await deleteButtons.first().click();
  await delete1;

  const delete2 = page.waitForResponse(
    (resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/delete')
  );
  await deleteButtons.first().click(); // first() again because previous one is gone
  await delete2;

  // Verify both undo buttons appear with countdown
  const undoButtons = page.getByTestId(/^att-undo-/);
  await expect(undoButtons).toHaveCount(2);
  await expect(undoButtons.first()).toContainText(/Undo \(\d+s\)/);
  await expect(undoButtons.nth(1)).toContainText(/Undo \(\d+s\)/);

  // Click undo on first file
  const restore1 = page.waitForResponse(
    (resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/restore')
  );
  await undoButtons.first().click();
  await restore1;

  // Wait for state update
  await page.waitForTimeout(1000);

  // Verify first file reappears
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 3000 });

  // Wait a bit more and verify only one undo button remains
  await page.waitForTimeout(1000);
  const remainingUndoButtons = await page.getByTestId(/^undo-btn-/).count();
  expect(remainingUndoButtons).toBe(1);

  // Wait for second undo to expire (11s total)
  await page.waitForTimeout(11000);

  // Verify second undo button disappears
  await expect(page.getByTestId(/^undo-btn-/)).toHaveCount(0);

  // Reload page
  await page.reload();
  await expect(page.getByTestId("attachments-panel")).toBeVisible();

  // Verify first file persists (restored)
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 3000 });

  // Verify second file stays gone (deleted)
  await expect(page.locator('text=sample-jd.txt')).not.toBeVisible();
});

