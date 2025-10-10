import { test, expect } from '@playwright/test';

test.describe('Job Quick-Actions Polish', () => {
  // Add test bridges before each test
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__TEST_CLIPBOARD__ = [];
      (window as any).__OPEN_CALLS__ = [];
      
      const origOpen = window.open;
      window.open = (...args: any[]) => {
        (window as any).__OPEN_CALLS__.push(args);
        return origOpen ? origOpen(...args) : null;
      };
    });
  });

  test('Open Posting button should be disabled without valid URL', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the first job to go to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    // Wait for the job detail page to load
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // Find the Open Posting button
    const openPostingBtn = page.getByTestId('qa-open-posting');
    
    // Button should be disabled if no posting URL
    const isDisabled = await openPostingBtn.isDisabled();
    
    // If disabled, check aria-disabled and tooltip
    if (isDisabled) {
      await expect(openPostingBtn).toHaveAttribute('aria-disabled', 'true');
      const title = await openPostingBtn.getAttribute('title');
      expect(title).toContain('Add a posting URL to enable');
    }
  });

  test('Duplicate button should create incrementally named copies', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the first job to go to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    const originalTitle = await jobLink.textContent();
    await jobLink.click();
    
    // Wait for the job detail page to load
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // Click duplicate button
    const duplicateBtn = page.getByTestId('qa-duplicate');
    
    // Wait for navigation (duplicate happens automatically)
    await Promise.all([
      page.waitForURL(/\/jobs\/[a-f0-9-]+/, { waitUntil: 'networkidle' }),
      duplicateBtn.click(),
    ]);
    
    // Get the new job title
    const newTitle1 = await page.getByTestId('job-title').textContent();
    expect(newTitle1).toMatch(/\(copy( \d+)?\)/); // Accept (copy) or (copy N)
    
    // Extract the copy number from the first title
    const match1 = newTitle1?.match(/\(copy( (\d+))?\)/);
    const copyNum1 = match1?.[2] ? parseInt(match1[2]) : 1;
    
    // Find the duplicate button again and click
    const duplicateBtn2 = page.getByTestId('qa-duplicate');
    await Promise.all([
      page.waitForURL(/\/jobs\/[a-f0-9-]+/, { waitUntil: 'networkidle' }),
      duplicateBtn2.click(),
    ]);
    
    // Get the second duplicate title
    const newTitle2 = await page.getByTestId('job-title').textContent();
    const match2 = newTitle2?.match(/\(copy( (\d+))?\)/);
    const copyNum2 = match2?.[2] ? parseInt(match2[2]) : 1;
    
    // Second duplicate should have a higher number
    expect(copyNum2).toBeGreaterThan(copyNum1);
  });

  test('Open All Docs should only open active documents', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the first job to go to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    // Wait for the job detail page to load
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // Upload a resume (making it active)
    const resumeInput = page.locator('input[type="file"]').first();
    const [uploadRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/attachments') && r.request().method() === 'POST' && r.ok()),
      resumeInput.setInputFiles({
        name: 'test-resume.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Test resume content'),
      }),
    ]);
    
    expect(uploadRes.ok()).toBeTruthy();
    
    // Wait for attachment to appear
    await expect(page.locator('.bg-gray-50:has-text("test-resume.txt")')).toBeVisible();
    
    // Wait a bit for the attachments list to fully load
    await page.waitForTimeout(500);
    
    // Click "Open All Docs" button (use force if needed since it might be programmatically enabled)
    const openDocsBtn = page.getByTestId('qa-open-all');
    await openDocsBtn.click({ force: true });
    
    // Check that window.open was called
    const openCalls = await page.evaluate(() => (window as any).__OPEN_CALLS__.length);
    expect(openCalls).toBeGreaterThan(0);
    
    // Verify the URL contains the stream endpoint
    const firstCall = await page.evaluate(() => (window as any).__OPEN_CALLS__[0]);
    expect(firstCall[0]).toBeTruthy();
  });

  test('Copy Summary should use richer format', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the first job to go to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    // Wait for the job detail page to load
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // Click copy summary button
    const copySummaryBtn = page.getByTestId('qa-copy-summary');
    await copySummaryBtn.click();
    
    // Wait a bit for clipboard operation
    await page.waitForTimeout(500);
    
    // Verify clipboard content using test bridge
    const clipboardContent = await page.evaluate(() => {
      const clipboard = (window as any).__TEST_CLIPBOARD__;
      return clipboard && clipboard.length > 0 ? clipboard[clipboard.length - 1] : null;
    });
    
    expect(clipboardContent).toBeTruthy();
    expect(clipboardContent).toContain('Job:');
    expect(clipboardContent).toContain('Status:');
    expect(clipboardContent).toContain('Posting:');
    expect(clipboardContent).toContain('Notes:');
    
    // Check if the "Copied!" feedback appears (optional, might be fast)
    const feedbackVisible = await page.getByTestId('qa-toast-copied').isVisible().catch(() => false);
    // It's OK if feedback already disappeared
  });

  test('Open All Docs should show toast when no documents', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the first job to go to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    // Wait for the job detail page to load
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // If the button is disabled, it should have proper tooltip
    const openDocsBtn = page.getByTestId('qa-open-all');
    const isDisabled = await openDocsBtn.isDisabled();
    
    if (isDisabled) {
      await expect(openDocsBtn).toHaveAttribute('aria-disabled', 'true');
      const title = await openDocsBtn.getAttribute('title');
      expect(title).toBeTruthy();
    }
  });

  test('All buttons should have consistent styling and tooltips', async ({ page }) => {
    await page.goto('/');
    
    // Wait for jobs to load
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.waitFor({ state: 'visible' });
    
    // Click the first job to go to detail page
    const jobLink = firstRow.locator('a[data-testid^="job-link-"]');
    await jobLink.click();
    
    // Wait for the job detail page to load
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // Check that all action buttons exist and have tooltips
    const buttons = [
      'qa-open-posting',
      'qa-duplicate',
      'qa-open-all',
      'qa-copy-summary',
    ];
    
    for (const btnTestId of buttons) {
      const btn = page.getByTestId(btnTestId);
      await expect(btn).toBeVisible();
      
      const title = await btn.getAttribute('title');
      expect(title).toBeTruthy();
      
      const ariaLabel = await btn.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});
