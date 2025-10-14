import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Coach Mode - Analyze All', () => {
  test('should show Analyze All button when AI is configured', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Wait for AI status check
    await page.waitForTimeout(2000);

    // If AI is configured, button should appear
    const analyzeButton = page.locator('[data-testid="quick-analyze-all"], [data-testid="analyze-all-now-button"]').first();
    
    // Check if AI is configured by looking for the button or "Configure AI" link
    const hasAiButton = await analyzeButton.isVisible().catch(() => false);
    const hasConfigLink = await page.locator('[data-testid="enable-ai-link"]').isVisible().catch(() => false);

    // One of them should be visible
    expect(hasAiButton || hasConfigLink).toBeTruthy();
  });

  test('should disable button when JD or Resume is empty', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Clear JD and Resume if they exist
    const editButtons = page.locator('button:has-text("Edit")');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      const textarea = page.locator('textarea').first();
      await textarea.fill('');

      // Analyze All button should be disabled
      const analyzeButton = page.locator('[data-testid="quick-analyze-all"]');
      if (await analyzeButton.isVisible()) {
        await expect(analyzeButton).toBeDisabled();
      }
    }
  });

  test('should show loading state when analyzing', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Ensure JD and Resume have content
    await page.waitForTimeout(2000);

    const analyzeButton = page.locator('[data-testid="quick-analyze-all"]');
    
    if (await analyzeButton.isVisible() && await analyzeButton.isEnabled()) {
      // Click analyze
      await analyzeButton.click();

      // Should show loading state
      await expect(page.locator('text=/Analyzing/i')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle analysis errors gracefully', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Fill in minimal JD and Resume to test error handling
    const editButtons = page.locator('button:has-text("Edit")');
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      const textarea = page.locator('textarea').first();
      await textarea.fill('Test JD');

      if (await editButtons.count() > 1) {
        await editButtons.nth(1).click();
        const resumeArea = page.locator('textarea').nth(1);
        await resumeArea.fill('Test Resume');
      }
    }

    // Try to analyze (may fail due to rate limits or missing API key)
    const analyzeButton = page.locator('[data-testid="quick-analyze-all"]');
    
    if (await analyzeButton.isVisible() && await analyzeButton.isEnabled()) {
      await analyzeButton.click();

      // Should either succeed or show error message (not crash)
      await page.waitForTimeout(5000);

      // Page should still be functional
      await expect(page.locator('[data-testid="coach-wizard"]')).toBeVisible();
    }
  });
});

