import { test, expect } from '@playwright/test';

test.describe('Job Delete & Restore v2.0', () => {
  test('should delete job and move to trash with countdown', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create a test job
    await page.fill('input[placeholder*="Job Title"]', 'Test Delete Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Find the job and click delete
    const jobRow = page.locator('tr:has-text("Test Delete Job")').first();
    await jobRow.locator('[data-testid^="delete-btn-"]').click();
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);

    // Job should disappear from main list
    await expect(page.locator('text=Test Delete Job')).not.toBeVisible();

    // Open trash
    await page.click('[data-testid="view-trash-btn"]');
    await page.waitForTimeout(500);

    // Should see trash modal
    await expect(page.locator('[data-testid="trash-modal"]')).toBeVisible();
    
    // Should see the deleted job with countdown
    await expect(page.locator('text=Test Delete Job')).toBeVisible();
    await expect(page.locator('text=Auto-delete in')).toBeVisible();
    await expect(page.locator('text=day')).toBeVisible();
  });

  test('should restore job from trash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create and delete a job
    await page.fill('input[placeholder*="Job Title"]', 'Test Restore Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    const jobRow = page.locator('tr:has-text("Test Restore Job")').first();
    await jobRow.locator('[data-testid^="delete-btn-"]').click();
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);

    // Open trash and restore
    await page.click('[data-testid="view-trash-btn"]');
    await page.waitForTimeout(500);

    const restoreBtn = page.locator('[data-testid^="restore-btn-"]').first();
    await restoreBtn.click();
    await page.waitForTimeout(1000);

    // Close trash modal
    await page.click('button:has-text("✕")');
    await page.waitForTimeout(500);

    // Job should be back in main list
    await expect(page.locator('text=Test Restore Job')).toBeVisible();
  });

  test('should permanently delete job', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create and delete a job
    await page.fill('input[placeholder*="Job Title"]', 'Test Purge Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    const jobRow = page.locator('tr:has-text("Test Purge Job")').first();
    await jobRow.locator('[data-testid^="delete-btn-"]').click();
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);

    // Open trash and purge
    await page.click('[data-testid="view-trash-btn"]');
    await page.waitForTimeout(500);

    const purgeBtn = page.locator('[data-testid^="purge-btn-"]').first();
    await purgeBtn.click();
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);

    // Job should be gone from trash
    await expect(page.locator('text=Test Purge Job')).not.toBeVisible();
  });
});
