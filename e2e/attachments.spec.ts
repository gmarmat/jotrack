import { test, expect } from '@playwright/test';

test.describe('attachments', () => {
  // Run serial to avoid cross-test interference with the same job row
  test.describe.configure({ mode: 'serial' });

  test('upload then list + preview (stable)', async ({ page }) => {
    await page.goto('/');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    await firstRow.getByRole('button', { name: 'Attachments' }).click();
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

    // Unique filename to avoid collisions
    const filename = `e2e-upload-${Date.now()}.txt`;
    const payload = {
      name: filename,
      mimeType: 'text/plain',
      buffer: Buffer.from('hello jotrack e2e'),
    };

    const input = page.getByLabel('Upload attachment');

    // Strictly wait for the POST /attachments network response
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/attachments') && r.request().method() === 'POST' && r.ok()),
      input.setInputFiles(payload),
    ]);

    // Ensure server acknowledged before asserting UI
    expect(res.ok()).toBeTruthy();

    // Now assert the item shows with a download link (optimistic replaced by real)
    const item = page.locator(`li:has-text("${filename}")`).first();
    await expect(item).toBeVisible();
    await expect(item.getByRole('link', { name: 'Download' })).toBeVisible();
    await expect(item.locator('img')).toHaveCount(0); // non-image, no preview
  });

  test('delete removes item (stable)', async ({ page }) => {
    await page.goto('/');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    await firstRow.getByRole('button', { name: 'Attachments' }).click();
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

    // Ensure there is an attachment; upload a fresh one
    const filename = `e2e-delete-${Date.now()}.txt`;
    const input = page.getByLabel('Upload attachment');
    const payload = {
      name: filename,
      mimeType: 'text/plain',
      buffer: Buffer.from('delete me'),
    };

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/attachments') && r.request().method() === 'POST' && r.ok()),
      input.setInputFiles(payload),
    ]);

    const row = page.locator(`li:has-text("${filename}")`).first();
    await expect(row.getByRole('link', { name: 'Download' })).toBeVisible();

    // Confirm delete (override native confirm)
    await page.evaluate(() => { window.confirm = () => true; });

    // Wait for DELETE network response explicitly, then assert disappearance
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/attachments?attachment=') && r.request().method() === 'DELETE' && r.ok()),
      row.getByRole('button', { name: 'Delete' }).click(),
    ]);

    await expect(row).toHaveCount(0);
  });
});
