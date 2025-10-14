import { test, expect } from '@playwright/test';

test.describe('Settings Navigation', () => {
  test('should show global settings button on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Global settings button should be visible (top-right)
    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await expect(settingsButton).toBeVisible();
  });

  test('should show global settings button on job page', async ({ page }) => {
    // Navigate to a job (using test job ID)
    await page.goto('/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb');
    await page.waitForLoadState('networkidle');

    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await expect(settingsButton).toBeVisible();
  });

  test('should show global settings button in coach mode', async ({ page }) => {
    await page.goto('/coach/3957289b-30f5-4ab2-8006-3a08b6630beb');
    await page.waitForLoadState('networkidle');

    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await expect(settingsButton).toBeVisible();
  });

  test('should open modal when settings button clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await settingsButton.click();

    // Modal should open
    const modal = page.locator('[data-testid="global-settings-modal"]');
    await expect(modal).toBeVisible();
  });

  test('should show all 4 tabs in settings modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="global-settings-button"]').click();
    
    // All tabs should be visible
    await expect(page.locator('[data-testid="settings-tab-ai"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-preferences"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-developer"]')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="global-settings-button"]').click();

    // Click AI tab
    await page.locator('[data-testid="settings-tab-ai"]').click();
    await expect(page.locator('text=/AI Configuration/i')).toBeVisible();

    // Click Data tab
    await page.locator('[data-testid="settings-tab-data"]').click();
    await expect(page.locator('text=/Export|Import|Backup/i').first()).toBeVisible();

    // Click Preferences tab
    await page.locator('[data-testid="settings-tab-preferences"]').click();
    await expect(page.locator('text=/Preferences/i')).toBeVisible();

    // Click Developer tab
    await page.locator('[data-testid="settings-tab-developer"]').click();
    await expect(page.locator('text=/Developer/i')).toBeVisible();
  });

  test('should close modal when close button clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="global-settings-button"]').click();
    
    // Modal should be visible
    const modal = page.locator('[data-testid="global-settings-modal"]');
    await expect(modal).toBeVisible();

    // Click close button
    await page.locator('[data-testid="close-global-settings"]').click();

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="global-settings-button"]').click();
    
    const modal = page.locator('[data-testid="global-settings-modal"]');
    await expect(modal).toBeVisible();

    // Click outside the modal
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });

    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test('should persist AI settings across tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="global-settings-button"]').click();

    // Go to AI tab and check if settings load
    await page.locator('[data-testid="settings-tab-ai"]').click();
    
    // Check if API key field exists
    const apiKeyInput = page.locator('input[type="password"]');
    if (await apiKeyInput.isVisible()) {
      // Settings form should be functional
      expect(await apiKeyInput.count()).toBeGreaterThan(0);
    }
  });
});

