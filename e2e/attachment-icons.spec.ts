import { test, expect } from "@playwright/test";
import path from "path";

test("attachment presence icons in list with counts and deep link", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Icons Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Icons Test Co");
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

  // Upload resume
  const resumePath = path.join(__dirname, "fixtures", "sample-resume.txt");
  const resumeUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[accept*="pdf"]').first().setInputFiles(resumePath);
  await resumeUpload;
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 3000 });

  // Upload JD
  const jdPath = path.join(__dirname, "fixtures", "sample-jd.txt");
  const jdUpload = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[accept*="pdf"]').nth(1).setInputFiles(jdPath);
  await jdUpload;
  await expect(page.locator('text=sample-jd.txt')).toBeVisible({ timeout: 3000 });

  // Go back to list
  await page.goto("/");
  await page.waitForSelector(`a:has-text("${jobTitle}")`, { state: "visible", timeout: 5000 });

  // Wait for jobs list to fully load with attachment data
  await page.waitForTimeout(1000);

  // Find the row for our job
  const jobRow = page.locator(`tr:has(a:has-text("${jobTitle}"))`);
  await expect(jobRow).toBeVisible();

  // Verify resume icon is "on" (filled)
  await expect(jobRow.getByTestId("attn-resume-on")).toBeVisible();
  await expect(jobRow.getByTestId("attn-badge-resume")).toBeVisible();
  await expect(jobRow.getByTestId("attn-badge-resume")).toHaveText("1");

  // Verify JD icon is "on" (filled)
  await expect(jobRow.getByTestId("attn-jd-on")).toBeVisible();
  await expect(jobRow.getByTestId("attn-badge-jd")).toBeVisible();
  await expect(jobRow.getByTestId("attn-badge-jd")).toHaveText("1");

  // Verify cover_letter icon is "off" (empty)
  await expect(jobRow.getByTestId("attn-cover_letter-off")).toBeVisible();
  await expect(jobRow.getByTestId("attn-badge-cover_letter")).not.toBeVisible();

  // Click resume icon (should navigate to job detail with #attachments)
  await jobRow.getByTestId("attn-resume-on").click();

  // Verify URL includes #attachments
  await expect(page).toHaveURL(new RegExp(`/jobs/${jobId}#attachments`));

  // Verify attachments panel is in view
  await expect(page.getByTestId("attachments-panel")).toBeVisible();
});

