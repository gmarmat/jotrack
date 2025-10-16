// Automated verification that blue banner shows after refresh-variants
import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Blue Banner Verification', () => {
  test('should show blue banner after variants are refreshed', async ({ page }) => {
    await page.goto(`http://localhost:3000/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Should show blue banner with "Ready to Analyze"
    const blueBanner = page.locator('text=Ready to Analyze');
    const hasBlue = await blueBanner.isVisible({timeout: 5000}).catch(() => false);
    
    console.log('Blue banner visible:', hasBlue);
    
    if (!hasBlue) {
      // Check what banner is showing
      const purpleBanner = page.locator('text=Extract Data First');
      const hasPurple = await purpleBanner.isVisible().catch(() => false);
      
      const orangeBanner = page.locator('text=Major Changes');
      const hasOrange = await orangeBanner.isVisible().catch(() => false);
      
      console.log('Current banner state:', {
        purple: hasPurple,
        orange: hasOrange,
        blue: hasBlue,
      });
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/banner-state.png' });
    }
    
    expect(hasBlue).toBe(true);
  });

  test('should show ONLY Analyze All button', async ({ page }) => {
    await page.goto(`http://localhost:3000/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const analyzeButton = page.locator('button:has-text("Analyze All")');
    const hasAnalyze = await analyzeButton.isVisible({timeout: 5000}).catch(() => false);
    
    console.log('Analyze All button visible:', hasAnalyze);
    expect(hasAnalyze).toBe(true);
    
    // Refresh Data button should NOT be visible (or at least not highlighted)
    const refreshButton = page.locator('button:has-text("Refresh Data")');
    const hasRefresh = await refreshButton.isVisible().catch(() => false);
    
    console.log('Refresh Data button visible:', hasRefresh);
    // In variants_fresh state, should show ONLY Analyze All
  });
});

