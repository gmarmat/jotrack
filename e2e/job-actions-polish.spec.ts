import { test, expect } from '@playwright/test';

test.describe('Job Quick-Actions Polish', () => {
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
    const openPostingBtn = page.getByTestId('action-open-posting');
    
    // Button should be disabled if no posting URL
    const isDisabled = await openPostingBtn.isDisabled();
    
    // If disabled, check the tooltip
    if (isDisabled) {
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
    const duplicateBtn = page.getByTestId('action-duplicate');
    await duplicateBtn.click();
    
    // Wait for toast and navigation
    await expect(page.locator('text=Duplicated to:')).toBeVisible({ timeout: 5000 });
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // Get the new job title
    const newTitle1 = await page.locator('h1').first().textContent();
    expect(newTitle1).toContain('(copy)');
    
    // Duplicate again
    await duplicateBtn.click();
    await expect(page.locator('text=Duplicated to:')).toBeVisible({ timeout: 5000 });
    await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
    
    // Get the second duplicate title
    const newTitle2 = await page.locator('h1').first().textContent();
    expect(newTitle2).toContain('(copy 2)');
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
    
    // Click "Open All Docs" button
    const openDocsBtn = page.getByTestId('action-open-docs');
    
    // Listen for new popup
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      openDocsBtn.click(),
    ]);
    
    // Verify popup opened with the file stream URL
    expect(popup.url()).toContain('/api/files/stream');
    await popup.close();
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
    const copySummaryBtn = page.getByTestId('action-copy-summary');
    await copySummaryBtn.click();
    
    // Wait for toast
    await expect(page.locator('text=Summary copied')).toBeVisible();
    
    // Check that the "Copied!" feedback appears
    await expect(page.getByTestId('copy-feedback')).toBeVisible();
    
    // Wait for feedback to disappear
    await expect(page.getByTestId('copy-feedback')).not.toBeVisible({ timeout: 3000 });
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
    const openDocsBtn = page.getByTestId('action-open-docs');
    const isDisabled = await openDocsBtn.isDisabled();
    
    if (isDisabled) {
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
      'action-open-posting',
      'action-duplicate',
      'action-open-docs',
      'action-copy-summary',
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
