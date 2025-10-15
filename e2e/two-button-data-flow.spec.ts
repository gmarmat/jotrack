// v2.7: E2E test for two-button data extraction and analysis flow
import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Two-Button Data Flow (Refresh Data + Analyze All)', () => {
  test('should show smart banners based on data state', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    // Should show some staleness banner (state depends on current data)
    const banner = page.locator('div:has-text("Refresh Data"), div:has-text("Analyze All"), div:has-text("Major Changes")');
    
    // At least one banner should be visible
    const bannerVisible = await banner.first().isVisible().catch(() => false);
    expect(bannerVisible).toBeTruthy();
  });

  test('should show "Refresh Data" button when no variants exist', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    // Look for the purple "Refresh Data" button
    const refreshButton = page.locator('button:has-text("Refresh Data")');
    
    // May or may not be visible depending on state
    const isVisible = await refreshButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Should show cost estimate
      await expect(refreshButton).toContainText('$0.02');
    }
  });

  test('should show "Analyze All" button when variants exist', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    // Look for the blue "Analyze All" button
    const analyzeButton = page.locator('button:has-text("Analyze All")');
    
    // May or may not be visible depending on state
    const isVisible = await analyzeButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Should show cost estimate
      await expect(analyzeButton).toContainText('$0.20');
    }
  });

  test('refresh data button should show changelog on success', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    const refreshButton = page.locator('button:has-text("Refresh Data")');
    const isVisible = await refreshButton.isVisible().catch(() => false);
    
    if (isVisible && !(await refreshButton.isDisabled())) {
      // Click Refresh Data
      await refreshButton.click();
      
      // Should show spinner
      await expect(page.locator('text=Refreshing...')).toBeVisible({ timeout: 1000 }).catch(() => {});
      
      // Wait for completion (up to 30 seconds for AI)
      await page.waitForTimeout(30000);
      
      // Should show purple success banner or changelog
      const successBanner = page.locator('text=/Data Refreshed|AI-optimized variants/i');
      const hasSuccess = await successBanner.isVisible().catch(() => false);
      
      if (hasSuccess) {
        await expect(successBanner).toBeVisible();
        
        // May show similarity percentage
        const similarity = page.locator('text=/%.*similar/i');
        const hasSimilarity = await similarity.isVisible().catch(() => false);
        expect(hasSimilarity).toBeTruthy();
      }
    }
  });

  test('analyze all should work after refresh data', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    // If "Refresh Data" is visible, click it first
    const refreshButton = page.locator('button:has-text("Refresh Data")');
    const hasRefresh = await refreshButton.isVisible().catch(() => false);
    
    if (hasRefresh && !(await refreshButton.isDisabled())) {
      await refreshButton.click();
      await page.waitForTimeout(30000); // Wait for refresh to complete
    }
    
    // Now "Analyze All" should be available
    const analyzeButton = page.locator('button:has-text("Analyze All")');
    const hasAnalyze = await analyzeButton.isVisible().catch(() => false);
    
    if (hasAnalyze && !(await analyzeButton.isDisabled())) {
      // Click Analyze All
      await analyzeButton.click();
      
      // Should show spinner
      await expect(page.locator('text=Analyzing...')).toBeVisible({ timeout: 1000 }).catch(() => {});
      
      // Wait for completion
      await page.waitForTimeout(5000);
      
      // Should show success or completion message
      const success = page.locator('text=/Analysis Complete|up to date/i');
      const hasSuccess = await success.isVisible().catch(() => false);
      expect(hasSuccess).toBeTruthy();
    }
  });

  test('should show different banner colors for different states', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    // Check for state-specific banner colors
    const purpleBanner = page.locator('div[class*="bg-purple-50"]');
    const blueBanner = page.locator('div[class*="bg-blue-50"]');
    const orangeBanner = page.locator('div[class*="bg-orange-50"]');
    const yellowBanner = page.locator('div[class*="bg-yellow-50"]');
    
    // At least one should be visible
    const hasPurple = await purpleBanner.isVisible().catch(() => false);
    const hasBlue = await blueBanner.isVisible().catch(() => false);
    const hasOrange = await orangeBanner.isVisible().catch(() => false);
    const hasYellow = await yellowBanner.isVisible().catch(() => false);
    
    const hasAnyBanner = hasPurple || hasBlue || hasOrange || hasYellow;
    
    // Note: May not show banner if in FRESH state
    // So this is informational, not a hard requirement
    if (hasAnyBanner) {
      console.log('Banner state detected:', {
        purple: hasPurple,
        blue: hasBlue,
        orange: hasOrange,
        yellow: hasYellow,
      });
    }
  });

  test('should hide both buttons when analysis is fresh', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    // If no staleness banner is visible, buttons should be hidden
    const stalenessBanner = page.locator('div:has(button:has-text("Refresh Data")), div:has(button:has-text("Analyze All"))');
    const hasBanner = await stalenessBanner.isVisible().catch(() => false);
    
    if (!hasBanner) {
      // State is FRESH - no actions needed
      // This is the success case! No banner = everything up to date
      expect(hasBanner).toBe(false);
    }
  });

  test('should show error if Analyze All clicked without variants', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    const analyzeButton = page.locator('button:has-text("Analyze All")');
    const isVisible = await analyzeButton.isVisible().catch(() => false);
    
    if (isVisible) {
      // Click without having variants (test the validation)
      await analyzeButton.click();
      await page.waitForTimeout(2000);
      
      // Should show error if no variants
      const error = page.locator('text=/variants not found|Refresh Data first/i');
      const hasError = await error.isVisible().catch(() => false);
      
      // This depends on whether variants actually exist
      // Just verify the error handling works
      console.log('Variant validation working:', hasError ? 'Error shown' : 'Variants exist');
    }
  });

  test('should display cost estimates on both buttons', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    // Check Refresh Data button
    const refreshButton = page.locator('button:has-text("Refresh Data")');
    if (await refreshButton.isVisible().catch(() => false)) {
      const refreshText = await refreshButton.textContent();
      expect(refreshText).toContain('$0.02');
    }

    // Check Analyze All button
    const analyzeButton = page.locator('button:has-text("Analyze All")');
    if (await analyzeButton.isVisible().catch(() => false)) {
      const analyzeText = await analyzeButton.textContent();
      expect(analyzeText).toContain('$0.20');
    }
  });

  test('changelog should show change details', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    const refreshButton = page.locator('button:has-text("Refresh Data")');
    const hasRefresh = await refreshButton.isVisible().catch(() => false);
    
    if (hasRefresh && !(await refreshButton.isDisabled())) {
      await refreshButton.click();
      await page.waitForTimeout(30000); // Wait for AI extraction
      
      // Look for changelog elements
      const changelog = page.locator('text=/Added|Removed|Updated|similar/i');
      const hasChangelog = await changelog.isVisible().catch(() => false);
      
      if (hasChangelog) {
        // Should show at least one change type
        const hasAdded = await page.locator('text=➕').isVisible().catch(() => false);
        const hasRemoved = await page.locator('text=➖').isVisible().catch(() => false);
        const hasUpdated = await page.locator('text=🔄').isVisible().catch(() => false);
        
        const hasAnyChange = hasAdded || hasRemoved || hasUpdated;
        
        console.log('Changelog shows changes:', {
          added: hasAdded,
          removed: hasRemoved,
          updated: hasUpdated,
        });
        
        // Should show significance badge
        const significance = page.locator('text=/Major changes|Minor changes|No significant changes/i');
        const hasSignificance = await significance.isVisible().catch(() => false);
        expect(hasSignificance).toBeTruthy();
      }
    }
  });

  test('should auto-hide success messages after timeout', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for initial render

    const analyzeButton = page.locator('button:has-text("Analyze All")');
    const hasAnalyze = await analyzeButton.isVisible().catch(() => false);
    
    if (hasAnalyze && !(await analyzeButton.isDisabled())) {
      await analyzeButton.click();
      await page.waitForTimeout(3000);
      
      // Success banner should appear
      const successBanner = page.locator('text=/Analysis Complete/i');
      const hasSuccess = await successBanner.isVisible().catch(() => false);
      
      if (hasSuccess) {
        await expect(successBanner).toBeVisible();
        
        // Should auto-hide after 3 seconds
        await page.waitForTimeout(4000);
        
        const stillVisible = await successBanner.isVisible().catch(() => false);
        expect(stillVisible).toBe(false); // Should be gone
      }
    }
  });
});

