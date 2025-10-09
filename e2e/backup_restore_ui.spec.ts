import { test, expect } from '@playwright/test';

test('backup button triggers a .zip download', async ({ page }) => {
  await page.goto('/');

  const backupBtn = page.getByRole('button', { name: 'Backup (ZIP)' });
  await expect(backupBtn).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    backupBtn.click(),
  ]);

  const name = download.suggestedFilename();
  expect(name.toLowerCase()).toContain('jotrack-backup');
  expect(name.toLowerCase()).toMatch(/\.zip$/);
});

test('restore modal stages a plan and dedup appears', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open restore modal' }).click();
  await expect(page.getByRole('heading', { name: 'Restore (Stage Only)' })).toBeVisible();

  // Fetch a fresh backup to upload
  const resp = await page.request.get('/api/backup');
  expect(resp.ok()).toBeTruthy();
  const buf = await resp.body();

  const input = page.getByLabel('Upload backup zip');
  const [stageRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/restore') && r.request().method() === 'POST' && r.ok()),
    input.setInputFiles({ name: 'test-backup.zip', mimeType: 'application/zip', buffer: buf }),
  ]);
  expect(stageRes.ok()).toBeTruthy();

  // Dedup heading should appear after staging completes
  await expect(page.getByText('Duplicates Preview')).toBeVisible();
});
