import { test, expect } from '@playwright/test';

test('homepage displays correctly', async ({ page }) => {
  await page.goto('/');
  
  await expect(page.locator('h1')).toContainText('Jotrack is running');
  
  await expect(page.locator('text=Node.js:')).toBeVisible();
  await expect(page.locator('text=Next.js:')).toBeVisible();
});

