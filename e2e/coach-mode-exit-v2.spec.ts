import { test, expect } from '@playwright/test';

test.describe('Coach Mode Exit & Navigation v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'DevOps Engineer',
        company: 'CoachTest Systems',
        status: 'ON_RADAR',
      },
    });
    const data = await res.json();
    jobId = data.id;
  });

  test('should display breadcrumb in Coach Mode', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);
    await page.waitForLoadState('networkidle');

    // Check breadcrumb exists
    await expect(page.getByTestId('breadcrumb')).toBeVisible();
    
    // Check breadcrumb items
    await expect(page.getByTestId('breadcrumb-link-0')).toHaveText('Home');
    await expect(page.getByTestId('breadcrumb-link-1')).toHaveText('Job');
    await expect(page.getByTestId('breadcrumb-current-2')).toHaveText('Coach Mode');
  });

  test('should display Exit Coach Mode button', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('exit-coach-mode')).toBeVisible();
    await expect(page.getByTestId('exit-coach-mode')).toContainText('Exit Coach Mode');
  });

  test('should show auto-save indicator', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);
    await page.waitForLoadState('networkidle');

    // Check for auto-save text
    await expect(page.locator('text=Auto-save enabled')).toBeVisible();
    
    // Check for pulse indicator (green dot)
    const pulseIndicator = page.locator('.bg-green-500.animate-pulse');
    await expect(pulseIndicator).toBeVisible();
  });

  test('should exit to job page when Exit button clicked', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);
    await page.waitForLoadState('networkidle');

    // Set up dialog handler
    page.once('dialog', dialog => dialog.accept());

    // Click exit button
    await page.getByTestId('exit-coach-mode').click();
    
    // Wait for navigation
    await page.waitForURL(`/jobs/${jobId}`);
    
    // Should be on job page
    await expect(page.getByTestId('job-header')).toBeVisible();
  });

  test('should navigate from breadcrumb back to job', async ({ page }) => {
    await page.goto(`/coach/${jobId}`);
    await page.waitForLoadState('networkidle');

    // Click "Job" link in breadcrumb
    await page.getByTestId('breadcrumb-link-1').click();
    await page.waitForLoadState('networkidle');

    // Should be on job page
    await expect(page.getByTestId('job-header')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

