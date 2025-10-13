import { test, expect } from '@playwright/test';

test.describe('Unified AI Panel v2.0', () => {
  test('should access AI panel from any status', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create a test job
    await page.fill('input[placeholder*="Job Title"]', 'Test AI Access');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Navigate to job
    await page.click('a:has-text("Test AI Access")');
    await page.waitForTimeout(1000);

    // Open AI panel (should work from ON_RADAR status)
    await page.locator('button[title*="AI Analysis"]').first().click();
    await page.waitForTimeout(500);

    // Should see AI panel
    await expect(page.locator('[data-testid="unified-ai-panel"]')).toBeVisible();
    await expect(page.locator('text=Quick Insights')).toBeVisible();
  });

  test('should show refresh buttons on each AI section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Job Title"]', 'Test Refresh');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    await page.click('a:has-text("Test Refresh")');
    await page.waitForTimeout(1000);

    await page.locator('button[title*="AI Analysis"]').first().click();
    await page.waitForTimeout(500);

    // Each section should have a refresh button
    const quickSection = page.locator('[data-testid="ai-section-quick"]');
    const refreshBtn = quickSection.locator('button[title="Refresh"]');
    await expect(refreshBtn).toBeVisible();
  });

  test('should display visualizations when data available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Job Title"]', 'Test Viz');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    await page.click('a:has-text("Test Viz")');
    await page.waitForTimeout(1000);

    await page.locator('button[title*="AI Analysis"]').first().click();
    await page.waitForTimeout(500);

    // Generate quick insights
    const generateBtn = page.locator('button:has-text("Generate Insights")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(2000);

      // Should see fit score gauge
      await expect(page.locator('[data-testid="fit-score-gauge"]')).toBeVisible();
    }
  });
});
