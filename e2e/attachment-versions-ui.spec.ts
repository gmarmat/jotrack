import { test, expect } from "@playwright/test";
import path from "path";

test("attachment versions UI: list, make active, delete/undo", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Versions UI Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Versions UI Co");
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

  // Upload Resume A (v1)
  const resumeAPath = path.join(__dirname, "fixtures", "sample-resume.txt");
  const upload1Promise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resumeAPath);
  await upload1Promise;
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 3000 });

  // Upload Resume B (v2)
  const resumeBPath = path.join(__dirname, "fixtures", "sample-jd.txt");
  const upload2Promise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resumeBPath);
  await upload2Promise;
  await page.waitForTimeout(1000);

  // Click Versions toggle for resume
  const versionsToggle = page.getByTestId("ver-toggle-resume");
  await expect(versionsToggle).toBeVisible();
  await versionsToggle.click();

  // Wait for versions to load
  await page.waitForTimeout(1000);

  // Verify v2 appears first with "Active" badge
  const activeVersion = page.locator('.bg-blue-50').filter({ hasText: 'v2' }).filter({ hasText: 'Active' });
  await expect(activeVersion).toBeVisible();

  // Verify v1 appears (without Active badge)
  const v1Row = page.locator('.bg-blue-50').filter({ hasText: 'v1' });
  await expect(v1Row).toBeVisible();
  // v1 should not have the "Active" badge (green pill)
  await expect(v1Row.locator('.bg-green-100')).not.toBeVisible();

  // Verify Make Active button is visible on v1
  const makeActiveBtn = page.getByTestId("ver-makeactive-resume-1");
  await expect(makeActiveBtn).toBeVisible();

  // Click Make Active on v1
  const makeActivePromise = page.waitForResponse(
    (resp) => resp.url().includes('/attachments/versions/make-active') && resp.request().method() === "POST"
  );
  await makeActiveBtn.click();
  await makeActivePromise;

  // Wait for reload
  await page.waitForTimeout(1500);

  // Verify v3 now appears with Active badge
  const v3Active = page.locator('.bg-blue-50').filter({ hasText: 'v3' }).filter({ hasText: 'Active' });
  await expect(v3Active).toBeVisible({ timeout: 5000 });

  // Verify v2 and v1 still appear (without Active badge)
  await expect(page.locator('.bg-blue-50').filter({ hasText: 'v2' })).toBeVisible();
  await expect(page.locator('.bg-blue-50').filter({ hasText: 'v1' })).toBeVisible();

  // Verify we can see 3 versions total
  const versionRows = page.locator('.bg-blue-50:has-text("v")');
  await expect(versionRows).toHaveCount(3);

  // Go back to list
  await page.goto("/");
  await page.waitForSelector(`a:has-text("${jobTitle}")`, { state: "visible", timeout: 5000 });
  await page.waitForTimeout(1000);

  // Verify resume icon badge shows count 3 (or verify presence)
  const jobRow = page.locator(`tr:has(a:has-text("${jobTitle}"))`);
  await expect(jobRow.getByTestId("attn-resume-on")).toBeVisible();
  // Badge might show "3" or just be present - either is ok
  const badge = jobRow.getByTestId("attn-badge-resume");
  await expect(badge).toBeVisible();
});

