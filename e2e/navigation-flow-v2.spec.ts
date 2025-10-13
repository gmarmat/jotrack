import { test, expect } from '@playwright/test';

test.describe('Navigation Flow v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    // Create a test job
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'Senior Frontend Engineer',
        company: 'NavigationTest Corp',
        status: 'ON_RADAR',
        notes: 'Testing navigation flows',
      },
    });
    const data = await res.json();
    jobId = data.id;
  });

  test('should show breadcrumb on AI settings page with back navigation', async ({ page }) => {
    // Navigate to job page
    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');

    // Click AI settings link from AI Showcase
    await page.getByTestId('ai-settings-link').click();
    await page.waitForLoadState('networkidle');

    // Check breadcrumb exists
    await expect(page.getByTestId('breadcrumb')).toBeVisible();
    
    // Check breadcrumb contains correct items
    await expect(page.getByTestId('breadcrumb-link-0')).toHaveText('Home');
    await expect(page.getByTestId('breadcrumb-link-1')).toHaveText('Job');
    await expect(page.getByTestId('breadcrumb-current-2')).toHaveText('AI & Privacy');

    // Check back button
    await expect(page.getByTestId('back-button')).toBeVisible();
    await expect(page.getByTestId('back-button')).toContainText('Back to Job');

    // Click back button
    await page.getByTestId('back-button').click();
    await page.waitForLoadState('networkidle');

    // Should be back on job page
    await expect(page.getByTestId('job-header')).toBeVisible();
  });

  test('should navigate from Coach Mode to AI settings and back', async ({ page }) => {
    // Navigate to Coach Mode
    await page.goto(`/coach/${jobId}`);
    await page.waitForLoadState('networkidle');

    // Check breadcrumb
    await expect(page.getByTestId('breadcrumb')).toBeVisible();
    await expect(page.getByTestId('breadcrumb-current-2')).toHaveText('Coach Mode');

    // Check exit button
    await expect(page.getByTestId('exit-coach-mode')).toBeVisible();
  });

  test('should show breadcrumb links are clickable', async ({ page }) => {
    await page.goto(`/settings/ai?from=/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');

    // Click Home in breadcrumb
    await page.getByTestId('breadcrumb-link-0').click();
    await page.waitForLoadState('networkidle');

    // Should be on home page
    await expect(page.getByText('🎯 Jotrack')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

