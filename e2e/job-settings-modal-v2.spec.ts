import { test, expect } from '@playwright/test';

test.describe('Job Settings Modal v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'Product Manager',
        company: 'ModalTest Inc',
        status: 'APPLIED',
        notes: 'Testing job settings modal',
      },
    });
    const data = await res.json();
    jobId = data.id;

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should open job settings modal from header gear icon', async ({ page }) => {
    // Click settings button in job header
    await page.getByTestId('open-job-settings').click();

    // Modal should be visible
    await expect(page.getByTestId('job-settings-modal')).toBeVisible();
    
    // Check modal title
    await expect(page.locator('h2:has-text("⚙️ Job Settings")')).toBeVisible();
  });

  test('should display all 4 tabs in job settings modal', async ({ page }) => {
    await page.getByTestId('open-job-settings').click();

    // Check all tabs exist
    await expect(page.getByTestId('tab-files')).toBeVisible();
    await expect(page.getByTestId('tab-meta')).toBeVisible();
    await expect(page.getByTestId('tab-notes')).toBeVisible();
    await expect(page.getByTestId('tab-actions')).toBeVisible();
  });

  test('should switch between tabs in job settings modal', async ({ page }) => {
    await page.getByTestId('open-job-settings').click();

    // Click Meta tab
    await page.getByTestId('tab-meta').click();
    await expect(page.locator('text=Job ID:')).toBeVisible();

    // Click Notes tab
    await page.getByTestId('tab-notes').click();
    await expect(page.locator('text=Global Notes Hub')).toBeVisible();

    // Click Actions tab
    await page.getByTestId('tab-actions').click();
    await expect(page.locator('text=Quick Actions')).toBeVisible();
  });

  test('should close modal with Esc key', async ({ page }) => {
    await page.getByTestId('open-job-settings').click();
    await expect(page.getByTestId('job-settings-modal')).toBeVisible();

    // Press Esc
    await page.keyboard.press('Escape');

    // Modal should be hidden
    await expect(page.getByTestId('job-settings-modal')).not.toBeVisible();
  });

  test('should close modal with X button', async ({ page }) => {
    await page.getByTestId('open-job-settings').click();
    await expect(page.getByTestId('job-settings-modal')).toBeVisible();

    // Click close button
    await page.getByTestId('close-job-settings').click();

    // Modal should be hidden
    await expect(page.getByTestId('job-settings-modal')).not.toBeVisible();
  });

  test('should show AI Settings link in Actions tab', async ({ page }) => {
    await page.getByTestId('open-job-settings').click();
    await page.getByTestId('tab-actions').click();

    // Check AI Settings link
    await expect(page.locator('text=⚙️ AI Settings')).toBeVisible();
  });

  test('should show Coach Mode link in Actions tab', async ({ page }) => {
    await page.getByTestId('open-job-settings').click();
    await page.getByTestId('tab-actions').click();

    // Check Coach Mode link
    await expect(page.locator('text=🎯 Open Coach Mode')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

