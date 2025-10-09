import { test, expect } from "@playwright/test";

test("status filter chips update list and URL", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForSelector('h1:has-text("Jotrack")', { state: "visible" });

  const timestamp = Date.now();
  const wipJobTitle = `WIP Job ${timestamp}`;
  const appliedJobTitle = `Applied Job ${timestamp}`;

  // Create 2 jobs with different statuses
  // Job 1: ON_RADAR
  await page.fill('input[placeholder*="Senior React Developer"]', wipJobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Acme Filter Test");
  await page.selectOption('select', "ON_RADAR");
  
  const createJob1 = page.waitForResponse(resp => resp.url().includes('/api/jobs') && resp.request().method() === 'POST');
  await page.getByRole("button", { name: /add job application/i }).click();
  await createJob1;

  // Wait for the job to appear in the list
  await page.waitForSelector(`a:has-text("${wipJobTitle}")`, { state: 'visible', timeout: 5000 });

  // Job 2: APPLIED
  await page.fill('input[placeholder*="Senior React Developer"]', appliedJobTitle);
  await page.fill('input[placeholder*="TechCorp"]', "Zen Filter Test");
  await page.selectOption('select', "APPLIED");
  
  const createJob2 = page.waitForResponse(resp => resp.url().includes('/api/jobs') && resp.request().method() === 'POST');
  await page.getByRole("button", { name: /add job application/i }).click();
  await createJob2;

  // Wait for the second job to appear in the list
  await page.waitForSelector(`a:has-text("${appliedJobTitle}")`, { state: 'visible', timeout: 5000 });

  // Verify both jobs are visible initially
  await expect(page.getByText(wipJobTitle)).toBeVisible();
  await expect(page.getByText(appliedJobTitle)).toBeVisible();

  // Click On Radar chip
  await page.getByTestId("chip-ON_RADAR").click();
  await expect(page).toHaveURL(/status=ON_RADAR/);
  
  // Wait a bit for filtering to happen
  await page.waitForTimeout(500);
  
  // WIP Job should be visible, Applied Job should not
  await expect(page.getByText(wipJobTitle)).toBeVisible();
  await expect(page.getByText(appliedJobTitle)).not.toBeVisible();

  // Click APPLIED chip
  await page.getByTestId("chip-APPLIED").click();
  await expect(page).toHaveURL(/status=APPLIED/);
  
  // Wait a bit for filtering to happen
  await page.waitForTimeout(500);
  
  // Applied Job should be visible, WIP Job should not
  await expect(page.getByText(appliedJobTitle)).toBeVisible();
  await expect(page.getByText(wipJobTitle)).not.toBeVisible();

  // Back to All
  await page.getByTestId("chip-ALL").click();
  await expect(page).not.toHaveURL(/status=/);
  
  // Wait a bit for filtering to happen
  await page.waitForTimeout(500);
  
  // Both jobs should be visible
  await expect(page.getByText(wipJobTitle)).toBeVisible();
  await expect(page.getByText(appliedJobTitle)).toBeVisible();
});

