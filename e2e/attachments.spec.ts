import { test, expect } from '@playwright/test';

test.describe('attachments', () => {
  // Run serial to avoid cross-test interference with the same job row
  test.describe.configure({ mode: 'serial' });

  test('upload then list + preview (stable)', async ({ page }) => {
    await page.goto('/');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the job title link to navigate to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

    // Unique filename to avoid collisions
    const filename = `e2e-upload-${Date.now()}.txt`;
    const payload = {
      name: filename,
      mimeType: 'text/plain',
      buffer: Buffer.from('hello jotrack e2e'),
    };

    // Use the first file input (resume dropzone)
    const input = page.locator('input[type="file"]').first();

    // Strictly wait for the POST /attachments network response
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/attachments') && r.request().method() === 'POST' && r.ok()),
      input.setInputFiles(payload),
    ]);

    // Ensure server acknowledged before asserting UI
    expect(res.ok()).toBeTruthy();

    // Now assert the item shows with a download button (icon button)
    const item = page.locator(`.bg-gray-50:has-text("${filename}")`).first();
    await expect(item).toBeVisible();
    await expect(item.locator('[data-testid^="att-download-"]')).toBeVisible();
    await expect(item.locator('img')).toHaveCount(0); // non-image, no preview
  });

  test('delete removes item (stable)', async ({ page }) => {
    await page.goto('/');

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the job title link to navigate to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

    // Ensure there is an attachment; upload a fresh one
    const filename = `e2e-delete-${Date.now()}.txt`;
    const input = page.locator('input[type="file"]').first();
    const payload = {
      name: filename,
      mimeType: 'text/plain',
      buffer: Buffer.from('delete me'),
    };

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/attachments') && r.request().method() === 'POST' && r.ok()),
      input.setInputFiles(payload),
    ]);

    const row = page.locator(`.bg-gray-50:has-text("${filename}")`).first();
    await expect(row.locator('[data-testid^="att-download-"]')).toBeVisible();

    // Click delete button (icon button)
    const deleteBtn = row.locator('[data-testid^="att-delete-"]');
    await expect(deleteBtn).toBeVisible();

    // Wait for soft-delete response
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/attachments/') && r.url().includes('/delete') && r.ok()),
      deleteBtn.click(),
    ]);

    // Wait a moment for state transition
    await page.waitForTimeout(500);

    // Verify file moved to pending delete state (yellow bg with undo)
    const pendingRow = page.locator(`.bg-yellow-50:has-text("${filename}")`).first();
    await expect(pendingRow).toBeVisible();
    
    // Verify undo button is present
    await expect(pendingRow.locator('[data-testid^="att-undo-"]')).toBeVisible();
  });
});
