import { test, expect } from '@playwright/test';

test('opens job detail page and shows status control', async ({ page }) => {
  await page.goto('/');

  // Wait for jobs to load
  await page.waitForSelector('table tbody tr', { state: 'visible', timeout: 5000 });

  // Click the first job link
  const firstJobLink = page.locator('[data-testid^="job-link-"]').first();
  await firstJobLink.click();

  // Assert we're on the detail page and it renders
  await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/);
  await expect(page.getByTestId('job-title')).toBeVisible();
  await expect(page.getByTestId('job-company')).toBeVisible();
  
  // Status select should be visible
  const statusSelect = page.locator('select').first();
  await expect(statusSelect).toBeVisible();
  
  // Back link should work
  await page.getByRole('link', { name: /back to list/i }).click();
  await expect(page).toHaveURL('/');
});

