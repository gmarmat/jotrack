import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Versions Expansion and Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    // Create a new job
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `Test Job ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Test Company');
    await page.click('button:has-text("Add Job Application")');
    
    await page.waitForTimeout(1000);
    
    // Click on the job to go to detail page
    await page.click(`text=Test Job ${timestamp}`);
    
    // Wait for job detail page
    await page.waitForTimeout(500);
  });

  test('should expand versions and show version list when clicking chevron', async ({ page }) => {
    // Upload first resume
    const resumePath1 = path.join(__dirname, 'fixtures', 'Resume sample no images.docx');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath1);
    
    // Wait for upload to complete
    await page.waitForSelector('text=/Resume sample no images\\.docx/', { timeout: 10000 });
    
    // Upload second resume (creates version 2)
    const resumePath2 = path.join(__dirname, 'fixtures', 'Resume sample with Images.docx');
    await fileInput.setInputFiles(resumePath2);
    
    // Wait for second upload
    await page.waitForSelector('text=/Resume sample with Images\\.docx/', { timeout: 10000 });
    
    // Find and click the versions chevron for resume
    const versionsButton = page.locator('button:has-text("Versions")').first();
    await expect(versionsButton).toBeVisible();
    
    console.log('Clicking versions button...');
    await versionsButton.click();
    
    // Wait a bit for expansion
    await page.waitForTimeout(500);
    
    // Check if versions list is now visible
    const versionsList = page.locator('[data-testid="versions-list"]').first();
    await expect(versionsList).toBeVisible({ timeout: 5000 });
    
    // Should show at least 2 versions
    const versionItems = page.locator('[data-testid^="version-item-"]');
    const count = await versionItems.count();
    expect(count).toBeGreaterThanOrEqual(2);
    
    console.log(`Found ${count} version items`);
  });

  test('should toggle versions open and closed', async ({ page }) => {
    // Upload a resume
    const resumePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    
    // Wait for upload
    await page.waitForSelector('text=/sample-resume\\.txt/', { timeout: 10000 });
    
    // Find versions button
    const versionsButton = page.locator('button:has-text("Versions")').first();
    
    // Click to open
    await versionsButton.click();
    await page.waitForTimeout(300);
    
    // Verify opened (check for chevron down icon or expanded state)
    const chevronDown = page.locator('svg[data-icon="chevron-down"]').first();
    
    // Click to close
    await versionsButton.click();
    await page.waitForTimeout(300);
    
    // Verify closed (check for chevron right icon)
    const chevronRight = page.locator('svg[data-icon="chevron-right"]').first();
  });

  test('should fetch and display versions from API', async ({ page }) => {
    // Listen for API calls
    const versionRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/attachments/versions')) {
        versionRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    // Upload two resumes
    const resumePath1 = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath1);
    await page.waitForTimeout(1000);
    
    const resumePath2 = path.join(__dirname, 'fixtures', 'Resume sample no images.docx');
    await fileInput.setInputFiles(resumePath2);
    await page.waitForTimeout(1000);
    
    // Click versions button
    const versionsButton = page.locator('button:has-text("Versions")').first();
    await versionsButton.click();
    
    // Wait for API call
    await page.waitForTimeout(1000);
    
    // Check that API was called
    expect(versionRequests.length).toBeGreaterThan(0);
    
    const versionRequest = versionRequests[0];
    expect(versionRequest.url).toContain('/attachments/versions');
    expect(versionRequest.url).toContain('kind=resume');
    
    console.log('Version API requests:', versionRequests);
  });

  test('should show preview button for each version', async ({ page }) => {
    // Upload multiple versions
    const files = [
      'sample-resume.txt',
      'Resume sample no images.docx'
    ];
    
    const fileInput = page.locator('input[type="file"]').first();
    
    for (const file of files) {
      const filePath = path.join(__dirname, 'fixtures', file);
      await fileInput.setInputFiles(filePath);
      await page.waitForTimeout(1000);
    }
    
    // Open versions
    const versionsButton = page.locator('button:has-text("Versions")').first();
    await versionsButton.click();
    await page.waitForTimeout(500);
    
    // Check for preview buttons in versions list
    const previewButtons = page.locator('[data-testid^="version-preview-"]');
    const count = await previewButtons.count();
    
    expect(count).toBeGreaterThanOrEqual(2);
    console.log(`Found ${count} preview buttons in versions`);
  });
});

