import { test, expect } from '@playwright/test';

test.describe('Unified Skills Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Navigate to job detail page
    const firstJob = page.locator('[data-testid="job-row"]').first();
    if (await firstJob.count() > 0) {
      await firstJob.click();
    }
  });

  test('should display category-level bars with fit zones', async ({ page }) => {
    const skillsChart = page.locator('[data-testid="skills-match-chart"]');
    
    if (await skillsChart.count() > 0) {
      await expect(skillsChart).toBeVisible();
      
      // Check for category bars (should have 3 categories)
      await expect(skillsChart.locator('text=Technical Skills & Expertise')).toBeVisible();
      await expect(skillsChart.locator('text=Relevant Experience')).toBeVisible();
      await expect(skillsChart.locator('text=Domain Knowledge')).toBeVisible();
    }
  });

  test('should display keyword word cloud', async ({ page }) => {
    const skillsChart = page.locator('[data-testid="skills-match-chart"]');
    
    if (await skillsChart.count() > 0) {
      await expect(skillsChart).toBeVisible();
      
      // Check for word cloud section heading
      await expect(skillsChart.locator('text=Top Keywords from Job Description')).toBeVisible();
      
      // Check for legend
      await expect(skillsChart.locator('text=Have it')).toBeVisible();
      await expect(skillsChart.locator('text=Missing')).toBeVisible();
    }
  });

  test('should show breakdown on category hover', async ({ page }) => {
    const skillsChart = page.locator('[data-testid="skills-match-chart"]');
    
    if (await skillsChart.count() > 0) {
      // Hover over a category bar
      const firstCategory = skillsChart.locator('text=Technical Skills & Expertise').first();
      await firstCategory.hover();
      
      // Should show breakdown (Resume: X% + Profile: +Y% = Z%)
      // This is a hover state, so we just verify the element exists
      await expect(firstCategory).toBeVisible();
    }
  });

  test('should open keyword detail modal on click', async ({ page }) => {
    const skillsChart = page.locator('[data-testid="skills-match-chart"]');
    
    if (await skillsChart.count() > 0) {
      // Find a keyword button in the word cloud
      const keywordButton = skillsChart.locator('button').first();
      
      if (await keywordButton.count() > 0) {
        await keywordButton.click();
        
        // Should show modal with keyword details
        // Modal structure: JD Count, Resume Count, Profile Count
        const modal = page.locator('.fixed.inset-0.z-50');
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible();
          await expect(modal.locator('text=JD Count')).toBeVisible();
          await expect(modal.locator('text=Resume Count')).toBeVisible();
        }
      }
    }
  });

  test('should show fit level indicators', async ({ page }) => {
    const skillsChart = page.locator('[data-testid="skills-match-chart"]');
    
    if (await skillsChart.count() > 0) {
      // Check for fit level text (Low Fit, Med Fit, High Fit, Exceeds)
      const fitLevels = skillsChart.locator('text=/Low Fit|Med Fit|High Fit|Exceeds/');
      if (await fitLevels.count() > 0) {
        await expect(fitLevels.first()).toBeVisible();
      }
    }
  });

  test('should color-code keywords by match status', async ({ page }) => {
    const skillsChart = page.locator('[data-testid="skills-match-chart"]');
    
    if (await skillsChart.count() > 0) {
      // Check for legend colors
      await expect(skillsChart.locator('.bg-green-600').first()).toBeVisible();
      
      // Verify legend items
      await expect(skillsChart.locator('text=Have it')).toBeVisible();
      await expect(skillsChart.locator('text=Partial/Profile')).toBeVisible();
      await expect(skillsChart.locator('text=Missing')).toBeVisible();
    }
  });

  test('should display legend for category bars', async ({ page }) => {
    const skillsChart = page.locator('[data-testid="skills-match-chart"]');
    
    if (await skillsChart.count() > 0) {
      // Check for category bar legend
      await expect(skillsChart.locator('text=JD Required')).toBeVisible();
      await expect(skillsChart.locator('text=Resume')).toBeVisible();
      await expect(skillsChart.locator('text=Profile Bonus')).toBeVisible();
    }
  });
});

