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

test.describe('RTF Preview Modal', () => {
  test('should preview small RTF files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a simple RTF file with "Hello RTF" content
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24 Hello RTF\\par
This is a test RTF file.\\par
\\par
\\b Bold text\\b0\\par
\\i Italic text\\i0\\par
}`;

    await uploadTestFile(page, 'small.rtf', rtfContent, 'application/rtf');
    await waitForAttachment(page, 'small.rtf');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that content is displayed (text should be extracted)
    await expect(page.locator('text=Hello RTF')).toBeVisible();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should show fallback for large RTF files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a large RTF file (>10MB)
    const largeRtfHeader = '{\\rtf1\\ansi\\deff0\n';
    const largeRtfFooter = '\n}';
    const padding = 'A'.repeat(11 * 1024 * 1024 - largeRtfHeader.length - largeRtfFooter.length);
    const largeRtfContent = largeRtfHeader + padding + largeRtfFooter;

    await uploadTestFile(page, 'big.rtf', largeRtfContent, 'application/rtf');
    await waitForAttachment(page, 'big.rtf');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that fallback message is shown
    await expect(page.locator('text=Preview not supported for large RTF files (>10MB)')).toBeVisible();
    await expect(page.locator('text=Use Open externally')).toBeVisible();
    
    // Check that buttons are present
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Externally' })).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should handle RTF conversion errors gracefully', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create an invalid RTF file
    const invalidContent = 'This is not a valid RTF file';
    
    await uploadTestFile(page, 'invalid.rtf', invalidContent, 'application/rtf');
    await waitForAttachment(page, 'invalid.rtf');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Should show some content (even if it's just the raw text after stripping)
    // or an error message
    const hasContent = await page.locator('pre').isVisible();
    const hasError = await page.locator('text=Failed to load RTF file').isVisible();
    
    expect(hasContent || hasError).toBeTruthy();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should support zoom controls for RTF files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a simple RTF file
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
\\f0\\fs24 Zoom test RTF content.\\par
}`;

    await uploadTestFile(page, 'zoom-test.rtf', rtfContent, 'application/rtf');
    await waitForAttachment(page, 'zoom-test.rtf');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that zoom controls are present for RTF files
    await expect(page.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fit to Width' })).toBeVisible();
    
    // Test zoom in
    await page.getByRole('button', { name: 'Zoom In' }).click();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should extract basic text from RTF control sequences', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create RTF with various control sequences
    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
\\f0\\fs24 First line\\par
\\tab Indented line\\par
Last line
}`;

    await uploadTestFile(page, 'controls.rtf', rtfContent, 'application/rtf');
    await waitForAttachment(page, 'controls.rtf');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that basic text is extracted (control sequences removed)
    await expect(page.locator('text=First line')).toBeVisible();
    await expect(page.locator('text=Last line')).toBeVisible();
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });
});
