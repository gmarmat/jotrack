import { test, expect } from '@playwright/test';

test('shows status badge in list and detail', async ({ page }) => {
  await page.goto('/');

  // Wait for jobs to load
  await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 5000 });

  // Check that badges appear in the list
  const firstBadge = page.locator('[data-testid^="status-badge-"]').first();
  await expect(firstBadge).toBeVisible();

  // Click into a job detail
  const firstJobLink = page.locator('[data-testid^="job-link-"]').first();
  await firstJobLink.click();

  // Verify badge appears in detail header
  await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/);
  const detailBadge = page.locator('[data-testid^="status-badge-"]').first();
  await expect(detailBadge).toBeVisible();
});

