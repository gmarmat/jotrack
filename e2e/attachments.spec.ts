import { test, expect } from '@playwright/test';

test('attachments: upload then list + preview (stable)', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  const firstRow = page.locator('table tbody tr').first();
  await firstRow.waitFor({ state: 'visible' });
  await firstRow.getByRole('button', { name: 'Attachments' }).click();

  const modal = page.getByRole('heading', { name: 'Attachments' });
  await expect(modal).toBeVisible();

  // Upload with unique name
  const ts = Date.now();
  const payload = {
    name: `e2e-${ts}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from('hello jotrack e2e'),
  };
  const input = page.getByLabel('Upload attachment');
  await input.setInputFiles(payload);

  // Wait for upload to complete - check list has items
  await page.waitForTimeout(2000);
  const list = page.locator('[data-testid="attachments-list"]');
  await expect(list).toBeVisible({ timeout: 3000 });
  
  // Verify our file appears somewhere
  const item = page.locator(`li:has-text("e2e-${ts}")`).first();
  await expect(item).toBeVisible();
  
  // Close modal with Escape key to avoid viewport issues
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
});

test('attachments: upload image and verify preview', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Open attachments for first job
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.getByRole('button', { name: 'Attachments' }).click();
  await expect(page.locator('[data-testid="attachments-modal"]')).toBeVisible();

  // Create a small PNG (1x1 red pixel)
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    'base64'
  );

  const imagePayload = {
    name: 'test-image.png',
    mimeType: 'image/png',
    buffer: pngBuffer,
  };

  await page.getByLabel('Upload attachment').setInputFiles(imagePayload);

  // Wait for upload
  await page.waitForTimeout(2000);

  // Verify image appears in list
  const imageItem = page.locator('li:has-text("test-image.png")').first();
  await expect(imageItem).toBeVisible();

  // Verify image preview is rendered
  const preview = imageItem.locator('img');
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('alt', 'test-image.png');

  // Download link should also be present
  await expect(imageItem.getByRole('link', { name: /Download/ })).toBeVisible();
});

test('attachments: list shows newest first', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Open attachments for first job
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.getByRole('button', { name: 'Attachments' }).click();
  await expect(page.locator('[data-testid="attachments-modal"]')).toBeVisible();

  // Upload first file with unique timestamp
  const ts1 = Date.now();
  await page.getByLabel('Upload attachment').setInputFiles({
    name: `first-${ts1}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from('first file'),
  });
  await page.waitForTimeout(1500);

  // Upload second file with later timestamp
  await page.waitForTimeout(100); // ensure different timestamp
  const ts2 = Date.now();
  await page.getByLabel('Upload attachment').setInputFiles({
    name: `second-${ts2}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from('second file'),
  });
  await page.waitForTimeout(1500);

  // Get all attachment items
  const attachmentsList = page.locator('[data-testid="attachments-list"]');
  const items = attachmentsList.locator('li');
  
  // Should have at least 2 items
  const count = await items.count();
  expect(count).toBeGreaterThanOrEqual(2);

  // The first item should be the most recent (second file)
  const firstItem = items.first();
  await expect(firstItem).toContainText(`second-${ts2}.txt`);
});

test('attachments: delete removes item (stable)', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  const firstRow = page.locator('table tbody tr').first();
  await firstRow.waitFor({ state: 'visible' });
  await firstRow.getByRole('button', { name: 'Attachments' }).click();
  await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

  // Upload a file to delete with unique name
  const ts = Date.now();
  const input = page.getByLabel('Upload attachment');
  const temp = {
    name: `delete-me-${ts}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from('delete me'),
  };
  await input.setInputFiles(temp);
  
  // Wait for upload
  await page.waitForTimeout(2000);

  // Find the row
  const row = page.locator(`li:has-text("delete-me-${ts}")`).first();
  await expect(row).toBeVisible({ timeout: 5000 });

  // Get initial count
  const initialCount = await page.locator('[data-testid="attachments-list"] li').count();
  
  // Override confirm dialog
  await page.evaluate(() => { window.confirm = () => true; });

  // Click delete using data-testid to avoid viewport issues
  const deleteBtn = row.locator('[data-testid^="delete-"]');
  await deleteBtn.scrollIntoViewIfNeeded();
  await deleteBtn.click();

  // Verify count decreased
  await page.waitForTimeout(1000);
  const newCount = await page.locator('[data-testid="attachments-list"] li').count();
  expect(newCount).toBe(initialCount - 1);
});

