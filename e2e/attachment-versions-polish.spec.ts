import { test, expect } from "@playwright/test";
import path from "path";

test("delete active file auto-promotes next highest version", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Auto-Promote Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Auto-Promote Co");
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

  // Upload Resume v1
  const resumeAPath = path.join(__dirname, "fixtures", "sample-resume.txt");
  const upload1Promise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resumeAPath);
  await upload1Promise;
  await expect(page.locator('text=sample-resume.txt')).toBeVisible({ timeout: 3000 });

  // Upload Resume v2 (this will become active)
  const resumeBPath = path.join(__dirname, "fixtures", "sample-jd.txt");
  const upload2Promise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resumeBPath);
  await upload2Promise;
  await page.waitForTimeout(1000);

  // Verify the second file (sample-jd.txt) is shown in the main area (active file)
  const activeFileArea = page.locator('.bg-gray-50').first();
  await expect(activeFileArea).toContainText('sample-jd.txt');
  const initialVersion = await activeFileArea.textContent();
  const versionMatch = initialVersion?.match(/v(\d+)/);
  expect(versionMatch).toBeTruthy();
  const activeVersionNumber = parseInt(versionMatch![1]);

  // Delete the active file
  const deleteBtn = page.getByTestId(/^att-delete-/).first();
  const deletePromise = page.waitForResponse((resp) => resp.url().includes('/api/attachments/') && resp.url().includes('/delete'));
  await deleteBtn.click();
  await deletePromise;

  // Wait for auto-promote to complete
  await page.waitForTimeout(2000);

  // Verify the first file (sample-resume.txt) is now shown as active in the main area
  const newActiveArea = page.locator('.bg-gray-50').first();
  await expect(newActiveArea).toContainText('sample-resume.txt');
  const newVersion = await newActiveArea.textContent();
  const newVersionMatch = newVersion?.match(/v(\d+)/);
  expect(newVersionMatch).toBeTruthy();
  const newActiveVersionNumber = parseInt(newVersionMatch![1]);
  
  // Verify the version number changed (auto-promoted a different version)
  expect(newActiveVersionNumber).not.toBe(activeVersionNumber);
});

test("deep-link to #versions auto-expands versions section", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible", timeout: 10000 });

  const timestamp = Date.now();
  const jobTitle = `Deep-Link Test ${timestamp}`;

  // Create a job
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Deep-Link Co");
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

  // Navigate to job detail page (without hash)
  await page.goto(`/jobs/${jobId}`);
  await expect(page.getByTestId("attachments-panel")).toBeVisible();

  // Upload a resume
  const resumePath = path.join(__dirname, "fixtures", "sample-resume.txt");
  const uploadPromise = page.waitForResponse(
    (resp) => resp.url().includes(`/api/jobs/${jobId}/attachments`) && resp.request().method() === "POST"
  );
  await page.locator('input[type="file"]').first().setInputFiles(resumePath);
  await uploadPromise;
  await page.waitForTimeout(1000);

  // Verify versions section is NOT expanded initially
  const versionsToggle = page.getByTestId("ver-toggle-resume");
  await expect(versionsToggle).toBeVisible();
  
  // Click the toggle to open versions
  await versionsToggle.click();
  await page.waitForTimeout(500);
  
  // Verify URL has #versions hash
  expect(page.url()).toContain('#versions');
  
  // Verify versions list is visible
  const versionRow = page.locator('.bg-blue-50').filter({ hasText: 'v1' });
  await expect(versionRow).toBeVisible();

  // Now navigate to the same page WITH #versions hash
  await page.goto(`/jobs/${jobId}#versions`);
  await page.waitForTimeout(1000);

  // Verify versions section is auto-expanded
  const versionRowAfterReload = page.locator('.bg-blue-50').filter({ hasText: 'v1' });
  await expect(versionRowAfterReload).toBeVisible({ timeout: 5000 });
});

