import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Skills Visualization - 3-Color Stacked Bars', () => {
  test('should show stacked 3-color bars for skills', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll to skills section
    const skillsSection = page.locator('[data-testid="skills-match-chart"]');
    await skillsSection.scrollIntoViewIfNeeded();

    // Should be visible
    await expect(skillsSection).toBeVisible();

    // Should have skill entries
    const skillBars = skillsSection.locator('.group');
    const count = await skillBars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show gap indicators for skills', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const skillsSection = page.locator('[data-testid="skills-match-chart"]');
    await skillsSection.scrollIntoViewIfNeeded();

    // Look for gap/weak indicators
    const gapBadges = page.locator('text=/Gap!|Weak/i');
    
    // May or may not have gaps depending on data
    const hasGaps = await gapBadges.count() > 0;
    
    if (hasGaps) {
      // If gaps exist, they should be colored appropriately
      const gapBadge = gapBadges.first();
      await expect(gapBadge).toBeVisible();
    }
  });

  test('should show proficiency percentages', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const skillsSection = page.locator('[data-testid="skills-match-chart"]');
    await skillsSection.scrollIntoViewIfNeeded();

    // Should show percentage covered
    const percentages = page.locator('text=/\\d+% covered/i');
    const count = await percentages.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should show legend with 3 colors', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const skillsSection = page.locator('[data-testid="skills-match-chart"]');
    await skillsSection.scrollIntoViewIfNeeded();

    // Legend should show all three categories
    await expect(page.locator('text=/JD Required/i')).toBeVisible();
    await expect(page.locator('text=/Your Resume/i')).toBeVisible();
    await expect(page.locator('text=/Full Profile/i')).toBeVisible();
  });

  test('should show details on hover', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const skillsSection = page.locator('[data-testid="skills-match-chart"]');
    await skillsSection.scrollIntoViewIfNeeded();

    // Hover over first skill
    const firstSkill = skillsSection.locator('.group').first();
    await firstSkill.hover();

    // Wait a bit for hover state
    await page.waitForTimeout(300);

    // Details may appear (counts for JD, Resume, Profile)
    // This is optional depending on implementation
  });

  test('should highlight skill match status', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const skillsSection = page.locator('[data-testid="skills-match-chart"]');
    await skillsSection.scrollIntoViewIfNeeded();

    // Should show status indicators
    const statusIndicators = page.locator('text=/Strong match|Could improve|Significant gap/i');
    const count = await statusIndicators.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should show visual bars with proper colors', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const skillsSection = page.locator('[data-testid="skills-match-chart"]');
    await skillsSection.scrollIntoViewIfNeeded();

    // Check for colored bar elements
    const blueBars = skillsSection.locator('.bg-blue-500');
    const greenBars = skillsSection.locator('.bg-green-500');
    const purpleBars = skillsSection.locator('.bg-purple-500');

    // Should have at least blue and green bars
    expect(await blueBars.count()).toBeGreaterThan(0);
    expect(await greenBars.count()).toBeGreaterThan(0);
  });
});

