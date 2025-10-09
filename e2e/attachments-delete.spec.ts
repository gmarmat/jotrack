import { test, expect } from "@playwright/test";
import path from "path";

test("attachment soft-delete with undo", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible" });

  const timestamp = Date.now();
  const jobTitle = `Delete Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Delete Test Co");
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

  // Upload a file to cover_letter
  const coverPath = path.join(__dirname, "fixtures", "sample-cover.txt");
  const uploadResponse = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  const coverInput = page.locator('input[accept*="pdf"]').nth(2);
  await coverInput.setInputFiles(coverPath);
  await uploadResponse;

  // Verify file appears
  await expect(page.locator('text=sample-cover.txt')).toBeVisible({ timeout: 5000 });

  // Get the file ID from the delete button
  const deleteButton = page.getByTestId(/^delete-/).first();
  await expect(deleteButton).toBeVisible();

  // Click delete
  const deleteResponse = page.waitForResponse(
    (resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/delete')
  );
  await deleteButton.click();
  await deleteResponse;

  // Verify undo toast appears
  await expect(page.getByTestId("undo-delete-btn")).toBeVisible({ timeout: 2000 });
  await expect(page.locator('text=/Attachment deleted/i')).toBeVisible();

  // Verify file is hidden
  await expect(page.locator('text=sample-cover.txt')).not.toBeVisible();

  // Click undo
  const restoreResponse = page.waitForResponse(
    (resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/restore')
  );
  await page.getByTestId("undo-delete-btn").click();
  await restoreResponse;

  // Wait a moment for state update
  await page.waitForTimeout(500);

  // Verify file reappears
  await expect(page.locator('text=sample-cover.txt')).toBeVisible({ timeout: 3000 });
  await expect(page.getByTestId("undo-delete-btn")).not.toBeVisible();

  // Delete again and wait for undo window to expire
  const deleteButton2 = page.getByTestId(/^delete-/).first();
  await deleteButton2.click();
  await page.waitForTimeout(11000); // Wait 11 seconds for undo window to expire

  // Verify undo toast is gone
  await expect(page.getByTestId("undo-delete-btn")).not.toBeVisible();

  // Reload page
  await page.reload();
  await expect(page.getByTestId("attachments-panel")).toBeVisible();

  // Verify file stays gone (soft-deleted)
  await expect(page.locator('text=sample-cover.txt')).not.toBeVisible();
});

