import { test, expect } from '@playwright/test';

test.describe('Upload Error Fix Validation', () => {
  test('upload should succeed without false error messages', async ({ page }) => {
    await page.goto('/');

    // Wait for jobs to load
    await page.waitForSelector('table tbody tr');
    
    // Click the first job to go to detail page
    const firstRow = page.locator('table tbody tr').first();
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    // Wait for attachments section
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

    // Create a test file
    const filename = `test-upload-${Date.now()}.txt`;
    const testContent = 'Test upload content for error validation';
    
    // Set up network monitoring
    const uploadPromise = page.waitForResponse(
      (response) => 
        response.url().includes('/attachments') && 
        response.request().method() === 'POST' &&
        response.status() === 200
    );

    // Upload file using the resume dropzone
    const dropzone = page.locator('[data-testid="dropzone-resume"]');
    const fileInput = dropzone.locator('input[type="file"]');
    
    // Create file and upload
    await fileInput.setInputFiles({
      name: filename,
      mimeType: 'text/plain',
      buffer: Buffer.from(testContent)
    });

    // Wait for successful upload response
    const uploadResponse = await uploadPromise;
    const responseData = await uploadResponse.json();
    
    // Validate response structure
    expect(responseData).toHaveProperty('id');
    expect(responseData).toHaveProperty('filename', filename);
    expect(responseData).toHaveProperty('size');
    expect(responseData).toHaveProperty('kind', 'resume');
    expect(responseData).toHaveProperty('version');
    expect(responseData).toHaveProperty('isActive', true);
    expect(responseData).toHaveProperty('created_at');
    expect(responseData).toHaveProperty('url');

    // Wait for UI to update and check for success
    await page.waitForTimeout(1000);
    
    // Should NOT see any error messages
    const errorMessages = page.locator('[class*="error"], [class*="red"], .text-red-500, .text-red-600');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      const errorTexts = [];
      for (let i = 0; i < errorCount; i++) {
        const text = await errorMessages.nth(i).textContent();
        if (text && text.trim()) {
          errorTexts.push(text.trim());
        }
      }
      console.log('Found error messages:', errorTexts);
    }
    
    // Should see the uploaded file in the UI (check for the file name in the attachments list)
    await expect(page.locator(`[data-testid*="att-name-"]`).filter({ hasText: filename })).toBeVisible();
    
    // Should see version badge for the uploaded file
    await expect(page.locator(`[data-testid*="att-name-"]`).filter({ hasText: filename }).locator('..').getByText('v1')).toBeVisible();
    
    // Should NOT see "Upload failed" message
    await expect(page.getByText('Upload failed')).not.toBeVisible();
    await expect(page.getByText('Upload succeeded but UI update failed')).not.toBeVisible();
    await expect(page.getByText('Upload succeeded but received invalid response')).not.toBeVisible();
  });

  test('upload should show proper error for invalid file type', async ({ page }) => {
    await page.goto('/');

    // Wait for jobs to load
    await page.waitForSelector('table tbody tr');
    
    // Click the first job to go to detail page
    const firstRow = page.locator('table tbody tr').first();
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    // Wait for attachments section
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();

    // Try to upload an invalid file type
    const dropzone = page.locator('[data-testid="dropzone-resume"]');
    const fileInput = dropzone.locator('input[type="file"]');
    
    // Create an invalid file (executable)
    await fileInput.setInputFiles({
      name: 'test.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('fake executable content')
    });

    // Should see error message for invalid file type
    await expect(page.getByText(/Unsupported file type/)).toBeVisible();
    
    // Should NOT see "Upload failed" generic error
    await expect(page.getByText('Upload failed')).not.toBeVisible();
  });
});
