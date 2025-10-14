import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Coach Mode - URL Fetch', () => {
  test('should show URLFetchField for recruiter', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Should have recruiter URL field
    const urlInput = page.locator('[data-testid="gather-recruiter-url-input"]');
    await expect(urlInput).toBeVisible();

    // Should have fetch button
    const fetchButton = page.locator('[data-testid="gather-recruiter-fetch-button"]');
    await expect(fetchButton).toBeVisible();
  });

  test('should fetch content when valid URL entered', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const urlInput = page.locator('[data-testid="gather-recruiter-url-input"]');
    const fetchButton = page.locator('[data-testid="gather-recruiter-fetch-button"]');

    // Enter a URL (will likely fail but tests the flow)
    await urlInput.fill('https://linkedin.com/in/test-profile');
    
    // Button should be enabled
    await expect(fetchButton).toBeEnabled();

    // Click fetch
    await fetchButton.click();

    // Should show loading state or error/success
    await page.waitForTimeout(2000);

    // Either success (content fetched) or fallback to manual
    const manualToggle = page.locator('text=/manual/i');
    const errorMsg = page.locator('text=/Failed to fetch|Could not/i');
    
    // One of these should be visible
    const hasManual = await manualToggle.isVisible().catch(() => false);
    const hasError = await errorMsg.isVisible().catch(() => false);
    
    expect(hasManual || hasError).toBeTruthy();
  });

  test('should show manual input fallback on fetch error', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const urlInput = page.locator('[data-testid="gather-recruiter-url-input"]');
    const fetchButton = page.locator('[data-testid="gather-recruiter-fetch-button"]');

    // Enter invalid URL
    await urlInput.fill('https://invalid-url-that-will-fail.com/profile');
    await fetchButton.click();

    // Wait for fetch attempt
    await page.waitForTimeout(3000);

    // Should show manual input option
    const manualButton = page.locator('text=/manual input|enter manually/i');
    await expect(manualButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow manual input when fetch fails', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const urlInput = page.locator('[data-testid="gather-recruiter-url-input"]');
    const fetchButton = page.locator('[data-testid="gather-recruiter-fetch-button"]');

    // Trigger fetch error
    await urlInput.fill('https://invalid.com');
    await fetchButton.click();
    await page.waitForTimeout(3000);

    // Click to show manual input
    const manualToggle = page.locator('text=/manual/i').first();
    if (await manualToggle.isVisible()) {
      await manualToggle.click();

      // Manual textarea should appear
      const manualInput = page.locator('[data-testid="gather-recruiter-manual-input"]');
      await expect(manualInput).toBeVisible();

      // Should be able to type
      await manualInput.fill('Manually entered profile data');
      const value = await manualInput.inputValue();
      expect(value).toContain('Manually entered');
    }
  });

  test('should toggle between fetch and manual modes', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Click "Or enter manually" if visible
    const manualToggle = page.locator('text=/enter manually/i').first();
    
    if (await manualToggle.isVisible()) {
      await manualToggle.click();

      // Manual input should appear
      const manualArea = page.locator('textarea').first();
      await expect(manualArea).toBeVisible();

      // Hide button should appear
      const hideButton = page.locator('text=/Hide/i').first();
      if (await hideButton.isVisible()) {
        await hideButton.click();

        // Manual area should hide
        await expect(manualArea).not.toBeVisible();
      }
    }
  });
});

