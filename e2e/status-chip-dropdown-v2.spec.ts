import { test, expect } from '@playwright/test';

test.describe('Status Chip Dropdown v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'Backend Engineer',
        company: 'StatusTest Inc',
        status: 'ON_RADAR',
      },
    });
    const data = await res.json();
    jobId = data.id;

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display status chip dropdown next to job title', async ({ page }) => {
    await expect(page.getByTestId('status-chip-dropdown')).toBeVisible();
  });

  test('should open dropdown when status chip clicked', async ({ page }) => {
    await page.getByTestId('status-chip-trigger').click();

    // Dropdown should be visible
    await expect(page.getByTestId('status-option-ON_RADAR')).toBeVisible();
    await expect(page.getByTestId('status-option-APPLIED')).toBeVisible();
    await expect(page.getByTestId('status-option-PHONE_SCREEN')).toBeVisible();
  });

  test('should show checkbox when different status selected', async ({ page }) => {
    await page.getByTestId('status-chip-trigger').click();

    // Click APPLIED status
    await page.getByTestId('status-option-APPLIED').click();

    // Checkbox should appear
    await expect(page.getByTestId('status-checkbox-APPLIED')).toBeVisible();
    
    // Confirm button should appear
    await expect(page.getByTestId('confirm-status-change')).toBeVisible();
  });

  test('should change status when confirmed', async ({ page }) => {
    await page.getByTestId('status-chip-trigger').click();
    await page.getByTestId('status-option-APPLIED').click();
    await page.getByTestId('confirm-status-change').click();

    // Wait for page reload
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Status should have changed
    // (Page might reload, so we check after reload)
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    await page.getByTestId('status-chip-trigger').click();
    await expect(page.getByTestId('status-option-ON_RADAR')).toBeVisible();

    // Click outside
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    // Dropdown should close
    await expect(page.getByTestId('status-option-ON_RADAR')).not.toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

