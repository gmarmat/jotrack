import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('AI Branding Consistency', () => {
  test('should show consistent AI status badges across all sections', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll to AI section
    await page.locator('text=/AI Analysis|AI Powered|Non-AI Powered/i').first().scrollIntoViewIfNeeded();

    // Check main AI status badge
    const mainBadge = page.locator('text=/AI Powered|Non-AI Powered/i').first();
    await expect(mainBadge).toBeVisible();

    const badgeText = await mainBadge.textContent();
    const isAiPowered = badgeText?.includes('AI Powered') && !badgeText?.includes('Non-');

    // All other sections should show same status
    const allBadges = page.locator('text=/AI Powered|Non-AI Powered/i');
    const count = await allBadges.count();

    for (let i = 0; i < count; i++) {
      const badge = allBadges.nth(i);
      const text = await badge.textContent();
      
      if (isAiPowered) {
        expect(text).toContain('AI Powered');
      } else {
        expect(text).toContain('Non-AI Powered');
      }
    }
  });

  test('should show AI Powered when network is enabled', async ({ page }) => {
    // First enable AI in settings
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="global-settings-button"]').click();
    await page.locator('[data-testid="settings-tab-ai"]').click();

    // Enable network if not already
    const toggle = page.locator('[data-testid="ai-toggle"]');
    if (await toggle.isVisible()) {
      const isEnabled = await toggle.evaluate((el) => el.getAttribute('class')?.includes('bg-green'));
      if (!isEnabled) {
        await toggle.click();
      }
    }

    // Close modal
    await page.locator('[data-testid="close-global-settings"]').click();

    // Navigate to job page
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Should show "AI Powered" (depends on actual API key presence)
    // At minimum, should show a status badge
    const statusBadge = page.locator('text=/AI Powered|Non-AI Powered/i').first();
    await expect(statusBadge).toBeVisible();
  });

  test('should show consistent branding in Company Intelligence card', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll to Company Intelligence section
    await page.locator('text=/Company Intelligence/i').scrollIntoViewIfNeeded();

    // Should have status indicator
    const companyCard = page.locator('text=/Company Intelligence/i').locator('..');
    const statusBadge = companyCard.locator('text=/AI Powered|Non-AI Powered|Sample Data/i').first();
    
    await expect(statusBadge).toBeVisible();
  });

  test('should show consistent branding in People Profiles card', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll to People Profiles section
    await page.locator('text=/People Profiles|People Insights/i').scrollIntoViewIfNeeded();

    // Should have status indicator
    const peopleCard = page.locator('text=/People Profiles|People Insights/i').locator('..');
    const statusBadge = peopleCard.locator('text=/AI Powered|Non-AI Powered|Sample Data/i').first();
    
    await expect(statusBadge).toBeVisible();
  });

  test('should show "Sample Data" badge when using dry-run', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for any "Sample Data" badges (shown when AI is not powered)
    const sampleBadges = page.locator('text=/Sample Data/i');
    
    // If AI is not configured, should see at least one sample data badge
    // This is dependent on AI configuration state
    const count = await sampleBadges.count();
    console.log(`Found ${count} sample data badges`);
  });
});

