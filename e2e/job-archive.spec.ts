import { test, expect } from '@playwright/test';

test.describe('Job Archive v2.0', () => {
  test('should archive and unarchive job', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create a test job
    await page.fill('input[placeholder*="Job Title"]', 'Test Archive Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Archive the job
    const jobRow = page.locator('tr:has-text("Test Archive Job")').first();
    await jobRow.locator('[data-testid^="archive-btn-"]').click();
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);

    // Job should disappear from main list
    await expect(page.locator('text=Test Archive Job')).not.toBeVisible();

    // Open archived view
    await page.click('[data-testid="view-archived-btn"]');
    await page.waitForTimeout(500);

    // Should see archived modal
    await expect(page.locator('[data-testid="archived-modal"]')).toBeVisible();
    
    // Should see the archived job
    await expect(page.locator('text=Test Archive Job')).toBeVisible();
    await expect(page.locator('text=Archived')).toBeVisible();

    // Unarchive
    const unarchiveBtn = page.locator('[data-testid^="unarchive-btn-"]').first();
    await unarchiveBtn.click();
    await page.waitForTimeout(1000);

    // Close modal
    await page.click('button:has-text("✕")');
    await page.waitForTimeout(500);

    // Job should be back in main list
    await expect(page.locator('text=Test Archive Job')).toBeVisible();
  });
});
