import { test, expect } from '@playwright/test';

// Helper functions
async function getFirstJobId(page: any): Promise<string> {
  await page.goto('/');
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.waitFor({ state: 'visible' });
  
  const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
  await jobLink.click();
  
  await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
  const url = page.url();
  return url.split('/jobs/')[1];
}

async function uploadTestFile(page: any, filename: string, content: string, mimeType: string) {
  const payload = {
    name: filename,
    mimeType: mimeType,
    buffer: Buffer.from(content),
  };

  const input = page.locator('input[type="file"]').first();
  
  const [res] = await Promise.all([
    page.waitForResponse((r: any) => r.url().includes('/attachments') && r.request().method() === 'POST' && r.ok()),
    input.setInputFiles(payload),
  ]);
  
  expect(res.ok()).toBeTruthy();
}

async function waitForAttachment(page: any, filename: string) {
  await expect(page.locator(`.bg-gray-50:has-text("${filename}")`).first()).toBeVisible();
}

test.describe('DOCX Preview Modal', () => {
  test('should preview small DOCX files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a simple DOCX file (minimal valid DOCX with sample content)
    const docxContent = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);

    await uploadTestFile(page, 'small-docx.docx', Buffer.from(docxContent).toString(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    await waitForAttachment(page, 'small-docx.docx');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // For small files, we expect either content or a loading/error state
    // Since we're using a minimal DOCX, it might show an error or loading
    await expect(page.locator('text=Preview not supported for large files')).not.toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should show fallback for large DOCX files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a large DOCX file (simulate >10MB by creating a large buffer)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    largeBuffer.write('PK\x03\x04', 0); // DOCX header
    
    await uploadTestFile(page, 'big-docx.docx', largeBuffer.toString(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    await waitForAttachment(page, 'big-docx.docx');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that fallback message is shown
    await expect(page.locator('text=Preview not supported for large files (>10MB)')).toBeVisible();
    await expect(page.locator('text=Use Open externally')).toBeVisible();
    
    // Check that download and external link buttons are present
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Externally' })).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should handle DOCX conversion errors gracefully', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create an invalid DOCX file (not actually a DOCX)
    const invalidContent = 'This is not a DOCX file at all';
    
    await uploadTestFile(page, 'invalid-docx.docx', invalidContent, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    await waitForAttachment(page, 'invalid-docx.docx');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Should show error or fallback
    const hasError = await page.locator('text=Failed to load DOCX file').isVisible();
    const hasFallback = await page.locator('text=Preview not supported').isVisible();
    
    expect(hasError || hasFallback).toBeTruthy();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should support zoom controls for DOCX files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a simple DOCX file
    const docxContent = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);

    await uploadTestFile(page, 'zoom-test.docx', Buffer.from(docxContent).toString(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    await waitForAttachment(page, 'zoom-test.docx');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that zoom controls are present for DOCX files
    await expect(page.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fit to Width' })).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });
});
