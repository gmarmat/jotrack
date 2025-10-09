import { test, expect } from "@playwright/test";
import path from "path";

test("attachments panel with three dropzones", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible" });

  const timestamp = Date.now();
  const jobTitle = `Attachments Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Attachment Test Co");
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

  // Wait for attachments panel to load
  await expect(page.getByTestId("attachments-panel")).toBeVisible();

  // Verify all three dropzones are present
  await expect(page.getByTestId("dropzone-resume")).toBeVisible();
  await expect(page.getByTestId("dropzone-jd")).toBeVisible();
  await expect(page.getByTestId("dropzone-cover_letter")).toBeVisible();

  // Upload resume
  const resumePath = path.join(__dirname, "fixtures", "sample-resume.txt");
  const resumeUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.setInputFiles('input[accept*="pdf"]', resumePath);
  await resumeUpload;

  // Verify resume appears in the list
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 5000 });

  // Upload JD
  const jdPath = path.join(__dirname, "fixtures", "sample-jd.txt");
  const jdUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  const jdInputs = await page.locator('input[accept*="pdf"]').all();
  await jdInputs[1].setInputFiles(jdPath);
  await jdUpload;

  // Verify JD appears
  await expect(page.locator('text=sample-jd.txt')).toBeVisible({ timeout: 5000 });

  // Upload cover letter
  const coverPath = path.join(__dirname, "fixtures", "sample-cover.txt");
  const coverUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  const coverInputs = await page.locator('input[accept*="pdf"]').all();
  await coverInputs[2].setInputFiles(coverPath);
  await coverUpload;

  // Verify cover letter appears
  await expect(page.locator('text=sample-cover.txt')).toBeVisible({ timeout: 5000 });

  // Verify preview buttons exist for txt files
  const previewButtons = page.getByTestId(/^preview-/);
  await expect(previewButtons.first()).toBeVisible();

  // Reload page and verify persistence
  await page.reload();
  await expect(page.getByTestId("attachments-panel")).toBeVisible();
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=sample-jd.txt')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=sample-cover.txt')).toBeVisible({ timeout: 5000 });
});

