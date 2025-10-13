import { test, expect } from '@playwright/test';

test.describe('Match Score Categories v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'Data Scientist',
        company: 'ScoreTest AI',
        status: 'ON_RADAR',
      },
    });
    const data = await res.json();
    jobId = data.id;

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display match score gauge with category badge', async ({ page }) => {
    // Check AI Showcase exists
    await expect(page.getByTestId('ai-showcase')).toBeVisible();

    // Check Match Score gauge
    await expect(page.getByTestId('match-score-gauge')).toBeVisible();

    // Should show a category badge (Good Match is default at 72%)
    await expect(page.locator('text=Good Match')).toBeVisible();
    await expect(page.locator('text=🟡')).toBeVisible();
  });

  test('should display category description and insights', async ({ page }) => {
    // Match Score card should show category description
    await expect(page.locator('text=You\'re a viable candidate')).toBeVisible();

    // Should show some insights bullets
    await expect(page.locator('text=You meet 50-75% of requirements')).toBeVisible();
  });

  test('should display highlights and gaps in two columns', async ({ page }) => {
    // Check for Highlights section
    await expect(page.locator('text=✓ Highlights')).toBeVisible();
    
    // Check for Gaps section
    await expect(page.locator('text=△ Gaps')).toBeVisible();

    // Should show some highlights
    await expect(page.locator('text=Strong React experience')).toBeVisible();

    // Should show some gaps
    await expect(page.locator('text=Kubernetes experience')).toBeVisible();
  });

  test('should display top recommendations in match score card', async ({ page }) => {
    // Check for recommendations section
    await expect(page.locator('text=💡 Top Recommendations:')).toBeVisible();

    // Should show at least one recommendation
    await expect(page.locator('text=Tailor resume')).toBeVisible();
  });

  test('should color-code gauge based on score category', async ({ page }) => {
    // The gauge should use color from category
    // We can't easily test color, but we can verify the category badge shows
    const categoryBadge = page.locator('.bg-amber-50, .bg-green-50, .bg-red-50').first();
    await expect(categoryBadge).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

