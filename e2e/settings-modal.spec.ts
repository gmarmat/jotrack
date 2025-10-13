import { test, expect } from '@playwright/test';

test.describe('Settings Modal v2.0', () => {
  test('should open settings modal from header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click settings button
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(500);

    // Should see settings modal
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
    await expect(page.locator('h2:has-text("Settings")')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(500);

    // Check AI tab (default)
    await expect(page.locator('[data-testid="tab-ai"]')).toBeVisible();
    
    // Switch to Data Management
    await page.click('[data-testid="tab-data"]');
    await expect(page.locator('h3:has-text("Backup & Restore")')).toBeVisible();
    
    // Switch to Preferences
    await page.click('[data-testid="tab-preferences"]');
    await expect(page.locator('text=Timeline Settings')).toBeVisible();
    
    // Switch back to AI
    await page.click('[data-testid="tab-ai"]');
    await expect(page.locator('text=AI Configuration')).toBeVisible();
  });

  test('should close settings modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(500);

    // Close modal
    await page.click('button:has-text("Close")');
    await page.waitForTimeout(500);

    // Modal should be gone
    await expect(page.locator('[data-testid="settings-modal"]')).not.toBeVisible();
  });
});
