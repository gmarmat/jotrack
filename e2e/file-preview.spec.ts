import { test, expect } from '@playwright/test';

// Helper functions
async function getFirstJobId(page: any): Promise<string> {
  await page.goto('/');
  const firstRow = page.locator('table tbody tr').first();
  await firstRow.waitFor({ state: 'visible' });
  
  const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
  await jobLink.click();
  
  // Wait for navigation and get job ID from URL
  await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
  const url = page.url();
  return url.split('/jobs/')[1];
}

async function uploadTestFile(page: any, kind: string, filename: string, content: string, mimeType: string) {
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

test.describe('File Preview Modal', () => {
  test('should open preview modal for PDF files', async ({ page }) => {
    // Use existing job and upload a PDF
    const jobId = await getFirstJobId(page);
    
    // Create a test PDF file
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;

    const file = new File([pdfContent], 'test.pdf', { type: 'application/pdf' });
    
    // Upload the PDF
    await uploadTestFile(page, 'resume', 'test.pdf', pdfContent, 'application/pdf');
    await waitForAttachment(page, 'test.pdf');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that zoom controls are present
    await expect(page.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fit to Width' })).toBeVisible();

    // Test keyboard shortcuts
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should open preview modal for image files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a simple test PNG (1x1 pixel)
    const pngContent = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const file = new File([pngContent], 'test.png', { type: 'image/png' });
    
    // Upload the image
    await uploadTestFile(page, 'other', 'test.png', Buffer.from(pngContent).toString(), 'image/png');
    await waitForAttachment(page, 'test.png');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that zoom controls are present
    await expect(page.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In' })).toBeVisible();

    // Test zoom functionality
    await page.getByRole('button', { name: 'Zoom In' }).click();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should open preview modal for text files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a test text file
    const textContent = 'This is a test text file.\n\nIt has multiple lines.\n\nAnd some special characters: !@#$%^&*()';
    const file = new File([textContent], 'test.txt', { type: 'text/plain' });
    
    // Upload the text file
    await uploadTestFile(page, 'other', 'test.txt', textContent, 'text/plain');
    await waitForAttachment(page, 'test.txt');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that the text content is displayed
    await expect(page.locator('pre')).toContainText('This is a test text file');
    
    // Close modal with Escape key
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should open preview modal for markdown files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a test markdown file
    const markdownContent = `# Test Markdown

This is a **bold** text and this is *italic*.

## List
- Item 1
- Item 2
- Item 3

\`\`\`javascript
console.log('Hello World');
\`\`\``;

    const file = new File([markdownContent], 'test.md', { type: 'text/markdown' });
    
    // Upload the markdown file
    await uploadTestFile(page, 'other', 'test.md', markdownContent, 'text/markdown');
    await waitForAttachment(page, 'test.md');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that markdown is rendered (look for heading)
    await expect(page.locator('h1')).toContainText('Test Markdown');
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should show unsupported message for DOCX files', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create a test DOCX file (minimal valid DOCX)
    const docxContent = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);

    const file = new File([docxContent], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    // Upload the DOCX file
    await uploadTestFile(page, 'other', 'test.docx', Buffer.from(docxContent).toString(), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    await waitForAttachment(page, 'test.docx');

    // Click the preview button
    await page.getByTestId('att-preview').first().click();

    // Check that the modal is visible
    await expect(page.getByTestId('viewer-modal')).toBeVisible();
    
    // Check that unsupported message is shown
    await expect(page.locator('text=Preview not supported')).toBeVisible();
    await expect(page.locator('text=Use Open externally or Download')).toBeVisible();
    
    // Check that zoom controls are NOT present for unsupported files
    await expect(page.getByRole('button', { name: 'Zoom Out' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In' })).not.toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create and upload a text file
    const textContent = 'Test content for keyboard shortcuts';
    
    await uploadTestFile(page, 'other', 'test.txt', textContent, 'text/plain');
    await waitForAttachment(page, 'test.txt');

    // Open the preview modal
    await page.getByTestId('att-preview').first().click();
    await expect(page.getByTestId('viewer-modal')).toBeVisible();

    // Test Ctrl/Cmd + '=' (zoom in)
    await page.keyboard.press('Control+Equal');
    
    // Test Ctrl/Cmd + '-' (zoom out)
    await page.keyboard.press('Control+Minus');
    
    // Test '0' (fit to width)
    await page.keyboard.press('0');
    
    // Test Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });

  test('should support download and external link actions', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    
    // Create and upload a text file
    const textContent = 'Test content for actions';
    
    await uploadTestFile(page, 'other', 'test.txt', textContent, 'text/plain');
    await waitForAttachment(page, 'test.txt');

    // Open the preview modal
    await page.getByTestId('att-preview').first().click();
    await expect(page.getByTestId('viewer-modal')).toBeVisible();

    // Check that download and external link buttons are present
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Externally' })).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByTestId('viewer-modal')).not.toBeVisible();
  });
});
