import { test, expect } from "@playwright/test";
import path from "path";

test("attachment icon actions (preview/download/delete/undo)", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Icon Actions Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Actions Test Co");
  await page.selectOption("select", "APPLIED");

  const createJobPromise = page.waitForResponse(
    (resp) => resp.url().includes("/api/jobs") && resp.request().method() === "POST",
    { timeout: 10000 }
  );
  await page.getByRole("button", { name: /add job application/i }).click();
  const jobResponse = await createJobPromise;
  const jobData = await jobResponse.json();
  const jobId = jobData.job?.id;

  expect(jobId).toBeTruthy();

  // Navigate to job detail page
  await page.goto(`/jobs/${jobId}`);
  await expect(page.getByTestId("attachments-panel")).toBeVisible();

  // Upload a previewable file (txt)
  const resumePath = path.join(__dirname, "fixtures", "sample-resume.txt");
  const resumeUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resumePath);
  await resumeUpload;
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 5000 });

  // Get the file ID from one of the action buttons
  const fileRow = page.locator('[data-testid^="att-name-"]').first();
  await expect(fileRow).toBeVisible();

  // Verify filename has tooltip
  const filename = await fileRow.getAttribute("title");
  expect(filename).toContain("sample-resume.txt");

  // Verify preview button is visible for txt file
  const previewBtn = page.locator('[data-testid^="att-preview-"]').first();
  await expect(previewBtn).toBeVisible();

  // Verify download button is visible
  const downloadBtn = page.locator('[data-testid^="att-download-"]').first();
  await expect(downloadBtn).toBeVisible();

  // Verify delete button is visible
  const deleteBtn = page.locator('[data-testid^="att-delete-"]').first();
  await expect(deleteBtn).toBeVisible();

  // Click delete
  const deleteResponse = page.waitForResponse(
    (resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/delete')
  );
  await deleteBtn.click();
  await deleteResponse;

  // Wait a moment for UI update
  await page.waitForTimeout(500);

  // Verify undo button appears with countdown
  const undoBtn = page.locator('[data-testid^="att-undo-"]').first();
  await expect(undoBtn).toBeVisible({ timeout: 2000 });
  await expect(undoBtn).toContainText(/Undo \(\d+s\)/);

  // Verify the file is in pending delete state (yellow bg)
  const pendingFile = page.locator('.bg-yellow-50').getByText('sample-resume.txt');
  await expect(pendingFile).toBeVisible();

  // Click undo
  const restoreResponse = page.waitForResponse(
    (resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/restore')
  );
  await undoBtn.click();
  await restoreResponse;

  // Wait a moment for UI update
  await page.waitForTimeout(500);

  // Verify file is back in active list with delete button
  await expect(page.locator('.bg-gray-50').getByText('sample-resume.txt')).toBeVisible({ timeout: 3000 });
  await expect(undoBtn).not.toBeVisible();
  
  // Verify delete button is back
  const deleteButtonRestored = page.locator('[data-testid^="att-delete-"]').first();
  await expect(deleteButtonRestored).toBeVisible();
});

