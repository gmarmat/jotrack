import { test, expect } from "@playwright/test";
import path from "path";

test("attachment versioning: auto-increment, list, make-active", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Versioning Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Versioning Co");
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

  // Upload first resume (v1)
  const resume1Path = path.join(__dirname, "fixtures", "sample-resume.txt");
  const upload1Promise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resume1Path);
  await upload1Promise;
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 3000 });

  // Upload second resume (v2) - use different file
  const resume2Path = path.join(__dirname, "fixtures", "sample-jd.txt");
  const upload2Promise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resume2Path);
  await upload2Promise;
  await page.waitForTimeout(500);

  // Fetch versions list via API
  const versionsResponse = await page.request.get(
    `http://localhost:3000/api/jobs/${jobId}/attachments/versions?kind=resume`
  );
  expect(versionsResponse.ok()).toBeTruthy();
  const versionsData = await versionsResponse.json();

  expect(versionsData.versions).toHaveLength(2);
  expect(versionsData.versions[0].version).toBe(2); // Most recent first
  expect(versionsData.versions[1].version).toBe(1);

  // Make v1 active (should create v3)
  const makeActiveResponse = await page.request.post(
    `http://localhost:3000/api/jobs/${jobId}/attachments/versions/make-active`,
    {
      data: { version: 1, kind: 'resume' },
      headers: { 'Content-Type': 'application/json' },
    }
  );
  expect(makeActiveResponse.ok()).toBeTruthy();
  const makeActiveData = await makeActiveResponse.json();
  expect(makeActiveData.newVersion).toBe(3);

  // Fetch versions list again
  const versionsResponse2 = await page.request.get(
    `http://localhost:3000/api/jobs/${jobId}/attachments/versions?kind=resume`
  );
  const versionsData2 = await versionsResponse2.json();

  expect(versionsData2.versions).toHaveLength(3);
  expect(versionsData2.versions[0].version).toBe(3); // New clone of v1
  expect(versionsData2.versions[1].version).toBe(2);
  expect(versionsData2.versions[2].version).toBe(1);
  
  // Verify v3 has the same filename as v1
  expect(versionsData2.versions[0].filename).toBe(versionsData2.versions[2].filename);
});

