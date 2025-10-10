import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Debug Versions Expansion', () => {
  let jobUrl: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `Debug Job ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Test Company');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);
    
    await page.click(`text=Debug Job ${timestamp}`);
    await page.waitForTimeout(500);
    
    jobUrl = page.url();
    console.log('Job URL:', jobUrl);
  });

  test('should show attachments section', async ({ page }) => {
    const attachmentsSection = page.locator('[data-testid="attachments-section"]');
    await expect(attachmentsSection).toBeVisible({ timeout: 5000 });
    console.log('✓ Attachments section visible');
  });

  test('should have file upload input', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();
    console.log('✓ File input found');
  });

  test('should upload a text file and show it', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    
    console.log('Uploading file:', filePath);
    await fileInput.setInputFiles(filePath);
    
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/after-upload.png' });
    
    // Check for any text containing the filename
    const hasFilename = await page.locator('text=/sample-resume/').count();
    console.log('Filename matches found:', hasFilename);
    
    // Check for the entire page content
    const pageContent = await page.content();
    console.log('Page has "sample-resume":', pageContent.includes('sample-resume'));
    
    // List all visible text
    const allText = await page.locator('body').innerText();
    console.log('Page text sample:', allText.substring(0, 500));
  });

  test('should check for versions button after upload', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    // Look for versions button by text
    const versionsButtons = page.locator('button:has-text("Versions")');
    const count = await versionsButtons.count();
    console.log('Versions buttons found:', count);
    
    if (count > 0) {
      const firstVersionsBtn = versionsButtons.first();
      const isVisible = await firstVersionsBtn.isVisible();
      console.log('First versions button visible:', isVisible);
      
      if (isVisible) {
        await firstVersionsBtn.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ path: 'test-results/after-versions-click.png' });
        
        // Check if versions list appeared
        const versionsList = page.locator('[data-testid="versions-list"]');
        const listVisible = await versionsList.isVisible().catch(() => false);
        console.log('Versions list visible:', listVisible);
      }
    }
  });

  test('should test API endpoint directly', async ({ page }) => {
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    // Extract job ID from URL
    const jobId = jobUrl.split('/jobs/')[1];
    console.log('Job ID:', jobId);
    
    // Call versions API directly
    const apiUrl = `/api/jobs/${jobId}/attachments/versions?kind=resume`;
    console.log('Testing API:', apiUrl);
    
    const response = await page.goto(`http://localhost:3000${apiUrl}`);
    const data = await response?.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  });

  test('should inspect network calls during upload', async ({ page }) => {
    const requests: any[] = [];
    const responses: any[] = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method()
      });
    });
    
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          body: await response.text().catch(() => 'Failed to read')
        });
      }
    });
    
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    
    console.log('Uploading file...');
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(3000);
    
    console.log('\n=== REQUESTS ===');
    requests.filter(r => r.url.includes('/api/')).forEach(r => {
      console.log(`${r.method} ${r.url}`);
    });
    
    console.log('\n=== RESPONSES ===');
    responses.forEach(r => {
      console.log(`${r.status} ${r.url}`);
      if (r.body && r.body.length < 500) {
        console.log('Body:', r.body);
      }
    });
  });

  test('should check console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });
    
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach(err => console.log(err));
    }
    
    expect(errors.length).toBe(0);
  });
});

test.describe('Debug PDF Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `PDF Job ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Test Company');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);
    
    await page.click(`text=PDF Job ${timestamp}`);
    await page.waitForTimeout(500);
  });

  test('should upload PDF and find preview button', async ({ page }) => {
    const pdfPath = path.join(__dirname, 'fixtures', 'Resume sample no images PDF.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    
    console.log('Uploading PDF:', pdfPath);
    await fileInput.setInputFiles(pdfPath);
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/after-pdf-upload.png' });
    
    // Look for preview (Eye icon) button
    const previewButtons = page.locator('button[aria-label="Preview"]');
    const count = await previewButtons.count();
    console.log('Preview buttons found:', count);
    
    if (count > 0) {
      const firstPreview = previewButtons.first();
      const isVisible = await firstPreview.isVisible();
      console.log('First preview button visible:', isVisible);
      
      if (isVisible) {
        console.log('Clicking preview button...');
        await firstPreview.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'test-results/after-preview-click.png' });
        
        // Check for modal
        const modal = page.locator('[data-testid="viewer-modal"]');
        const modalVisible = await modal.isVisible().catch(() => false);
        console.log('Viewer modal visible:', modalVisible);
        
        // Check for any modal/dialog
        const anyModal = page.locator('[role="dialog"]');
        const anyModalCount = await anyModal.count();
        console.log('Any modal/dialog found:', anyModalCount);
      }
    }
  });

  test('should check for modal component in page', async ({ page }) => {
    const pdfPath = path.join(__dirname, 'fixtures', 'Resume sample no images PDF.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    
    await fileInput.setInputFiles(pdfPath);
    await page.waitForTimeout(2000);
    
    // Check if AttachmentViewerModal exists in DOM
    const modalInDom = await page.locator('text=/Preview|Modal|Viewer/i').count();
    console.log('Modal-related elements:', modalInDom);
    
    // Check all buttons with Eye icon
    const allButtons = await page.locator('button').all();
    console.log('Total buttons on page:', allButtons.length);
    
    for (const btn of allButtons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      if (ariaLabel === 'Preview' || title === 'Preview') {
        console.log('Found preview button with aria-label/title');
        const testid = await btn.getAttribute('data-testid');
        console.log('  data-testid:', testid);
      }
    }
  });
});

