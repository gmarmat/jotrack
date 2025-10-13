import { test, expect } from '@playwright/test';

test.describe('No Utility Rail v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'UX Designer',
        company: 'RailTest Design',
        status: 'ON_RADAR',
      },
    });
    const data = await res.json();
    jobId = data.id;

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should NOT display floating utility rail', async ({ page }) => {
    // Old utility rail should not exist
    await expect(page.getByTestId('utility-rail-collapsed')).not.toBeVisible();
  });

  test('should NOT have keyboard shortcuts for rail (f, m, g)', async ({ page }) => {
    // Press 'f' key
    await page.keyboard.press('f');
    await page.waitForTimeout(500);

    // Utility rail should not appear
    await expect(page.getByTestId('utility-rail-expanded')).not.toBeVisible();
  });

  test('should have job settings modal instead of utility rail', async ({ page }) => {
    // Settings should be in modal, not rail
    await page.getByTestId('open-job-settings').click();
    
    // Modal should open
    await expect(page.getByTestId('job-settings-modal')).toBeVisible();
    
    // Modal should have Files, Meta, Notes tabs
    await expect(page.getByTestId('tab-files')).toBeVisible();
    await expect(page.getByTestId('tab-meta')).toBeVisible();
    await expect(page.getByTestId('tab-notes')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

