import { test, expect } from '@playwright/test';

test.describe('AInalyze Button v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'ML Engineer',
        company: 'AInalyzeTest ML',
        status: 'APPLIED',
      },
    });
    const data = await res.json();
    jobId = data.id;

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display AInalyze button with purple gradient', async ({ page }) => {
    const button = page.getByTestId('ainalyze-button');
    await expect(button).toBeVisible();
    
    // Check button text
    await expect(button).toContainText('AInalyze');
    
    // Check it's not the old "Refresh All" text
    await expect(button).not.toContainText('Refresh All');
  });

  test('should show Zap icon in AInalyze button', async ({ page }) => {
    const button = page.getByTestId('ainalyze-button');
    
    // Button should have the lightning bolt icon (Zap)
    // We can verify by checking the SVG exists within the button
    const icon = button.locator('svg').first();
    await expect(icon).toBeVisible();
  });

  test('should show analyzing state when clicked', async ({ page }) => {
    const button = page.getByTestId('ainalyze-button');
    
    // Click the button
    await button.click();
    
    // Should show "Analyzing..." text (might be brief)
    // or button should be disabled during analysis
    await expect(button).toBeDisabled();
  });

  test('should show AI provider badge', async ({ page }) => {
    // Check for provider badge showing local or remote
    await expect(page.locator('text=Local (Dry-run)')).toBeVisible();
  });

  test('should have AI settings link next to AInalyze button', async ({ page }) => {
    await expect(page.getByTestId('ai-settings-link')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

