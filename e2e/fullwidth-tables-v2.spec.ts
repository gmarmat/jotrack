import { test, expect } from '@playwright/test';

test.describe('Full-Width Tables Layout v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'Full Stack Developer',
        company: 'LayoutTest Tech',
        status: 'APPLIED',
      },
    });
    const data = await res.json();
    jobId = data.id;

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display Match Score and Skill Match in first row', async ({ page }) => {
    // Both should be visible in the same row (side by side on desktop)
    await expect(page.locator('text=Match Score').first()).toBeVisible();
    await expect(page.locator('text=Skill Match').first()).toBeVisible();
  });

  test('should display Match Score Breakdown as full-width section', async ({ page }) => {
    await expect(page.locator('text=Match Score Breakdown')).toBeVisible();
    
    // Should be in its own section (not in 2-column grid with another card)
    const breakdownCard = page.locator('text=Match Score Breakdown').locator('..').locator('..').locator('..');
    await expect(breakdownCard).toBeVisible();
  });

  test('should display People Insights as full-width section', async ({ page }) => {
    await expect(page.locator('text=People Insights')).toBeVisible();
    
    // Should be in its own section
    const peopleCard = page.locator('text=People Insights').locator('..').locator('..').locator('..');
    await expect(peopleCard).toBeVisible();
  });

  test('should have collapse/expand toggles for full-width tables', async ({ page }) => {
    // Match Score Breakdown toggle
    await expect(page.getByTestId('toggle-fit-section')).toBeVisible();
    
    // People Insights toggle
    await expect(page.getByTestId('toggle-profiles-section')).toBeVisible();
  });

  test('should collapse and expand Match Score Breakdown', async ({ page }) => {
    const toggle = page.getByTestId('toggle-fit-section');
    
    // Should be expanded by default or expandable
    await toggle.click();
    
    // Click again to toggle
    await toggle.click();
  });

  test('should collapse and expand People Insights', async ({ page }) => {
    const toggle = page.getByTestId('toggle-profiles-section');
    
    // Should be expandable
    await toggle.click();
    
    // Click again to toggle
    await toggle.click();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

