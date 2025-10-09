import { test, expect } from "@playwright/test";

test("bulk status update applies to multiple rows", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible" });

  const timestamp = Date.now();

  // Create 3 jobs
  const jobs = [
    { title: `Bulk A ${timestamp}`, company: "Company X" },
    { title: `Bulk B ${timestamp}`, company: "Company Y" },
    { title: `Bulk C ${timestamp}`, company: "Company Z" },
  ];

  for (const job of jobs) {
    await page.fill('input[placeholder*="Senior React Developer"]', job.title);
    await page.fill('input[placeholder*="TechCorp"]', job.company);
    await page.selectOption("select", "APPLIED");

    const createJob = page.waitForResponse(
      (resp) => resp.url().includes("/api/jobs") && resp.request().method() === "POST"
    );
    await page.getByRole("button", { name: /add job application/i }).click();
    await createJob;

    // Wait for the job to appear
    await page.waitForSelector(`a:has-text("${job.title}")`, { state: "visible", timeout: 5000 });
  }

  // Wait a bit for the table to stabilize
  await page.waitForTimeout(1000);

  // Get all row checkboxes (excluding the select-all checkbox)
  const firstJobCheckbox = page.locator(`input[data-testid^="row-select-"]`).first();
  const secondJobCheckbox = page.locator(`input[data-testid^="row-select-"]`).nth(1);
  
  await firstJobCheckbox.check();
  await secondJobCheckbox.check();

  // Verify selection bar appears
  await expect(page.getByTestId("bulk-status-select")).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=/2 selected/i')).toBeVisible();

  // Bulk set to ON_RADAR
  await page.getByTestId("bulk-status-select").selectOption("ON_RADAR");
  
  const bulkUpdate = page.waitForResponse(
    (resp) => resp.url().includes("/api/jobs/bulk-status") && resp.request().method() === "POST"
  );
  await page.getByTestId("bulk-status-apply").click();
  await bulkUpdate;

  // Wait for page reload
  await page.waitForLoadState("networkidle");

  // Verify the first two jobs have On Radar badges
  const onRadarBadges = page.locator('span:has-text("ON RADAR")');
  await expect(onRadarBadges.nth(0)).toBeVisible();
  await expect(onRadarBadges.nth(1)).toBeVisible();
});

