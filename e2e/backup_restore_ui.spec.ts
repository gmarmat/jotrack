import { test, expect } from '@playwright/test';

test('backup button triggers a .zip download', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait for page to fully load
  await page.waitForSelector('[data-testid="backup-btn"]', { state: 'visible' });

  // Button visible
  const backupBtn = page.locator('[data-testid="backup-btn"]');
  await expect(backupBtn).toBeVisible();

  // Capture the download event triggered by the button
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    backupBtn.click(),
  ]);

  const name = download.suggestedFilename();
  expect(name.toLowerCase()).toContain('jotrack-backup');
  expect(name.toLowerCase()).toMatch(/\.zip$/);
  
  // Verify download has content
  const path = await download.path();
  expect(path).toBeTruthy();
  
  // Verify success toast appears
  await expect(page.getByText('Backup complete', { exact: false })).toBeVisible({ timeout: 3000 });
});

test('restore modal stages a plan when a zip is uploaded', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait for page to load
  await page.waitForSelector('[data-testid="restore-btn"]', { state: 'visible' });

  // Open modal
  const restoreBtn = page.locator('[data-testid="restore-btn"]');
  await restoreBtn.click();
  await expect(page.getByRole('heading', { name: 'Restore (Stage Only)' })).toBeVisible();

  // Get a fresh backup zip via API to feed the input
  const resp = await page.request.get('http://localhost:3000/api/backup');
  expect(resp.ok()).toBeTruthy();
  const buf = await resp.body();

  // Upload the zip
  const input = page.getByLabel('Upload backup zip');
  await input.setInputFiles({ name: 'test-backup.zip', mimeType: 'application/zip', buffer: buf });

  // Wait for upload to complete
  await page.waitForTimeout(3000);

  // Verify plan summary is visible
  const summary = page.locator('[data-testid="restore-plan-summary"]');
  await expect(summary).toBeVisible();
  
  // Expect summary to render with stagingId and counts
  await expect(summary.getByText('Staging ID:')).toBeVisible();
  await expect(summary.getByText('DB files detected:')).toBeVisible();
  
  // Verify staging success toast
  await expect(page.getByText('Restore staged', { exact: false })).toBeVisible({ timeout: 3000 });
  
  // Wait for dedup analysis
  await page.waitForTimeout(2000);
  
  // Verify duplicates preview section appears
  await expect(page.getByText('Duplicates Preview')).toBeVisible();
  await expect(page.getByText('Within current DB:')).toBeVisible();
  await expect(page.getByText('Within staged ZIP:')).toBeVisible();
  await expect(page.getByText('Overlap (current ↔ staged):')).toBeVisible();
  
  // Verify Apply Restore section is visible
  const applyBtn = page.getByRole('button', { name: 'Apply restore now' });
  await expect(applyBtn).toBeVisible();
  
  // Click Apply Restore
  await applyBtn.click();

  // Wait for summary JSON to appear
  await expect(page.getByText('Apply Summary')).toBeVisible({ timeout: 10000 });
  
  // Basic sanity checks - look for strategy and mode in the JSON
  const applySum = page.locator('[data-testid="apply-summary"]');
  await expect(applySum).toContainText('skip-duplicates');
  await expect(applySum).toContainText('merge');
  await expect(applySum).toContainText('autosavePath');
  
  // Verify apply success toast
  await expect(page.getByText('Restore applied', { exact: false })).toBeVisible({ timeout: 3000 });
});

