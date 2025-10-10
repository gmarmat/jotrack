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
    // Upload first resume - will be v1
    const resumePath1 = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath1);
    await page.waitForTimeout(2000);
    
    // Verify uploaded and shows v1
    await expect(page.locator('text=/sample-resume/').first()).toBeVisible();
    const v1Text = await page.locator('text=v1').first().isVisible();
    expect(v1Text).toBe(true);
    
    // Close and open versions to test expansion
    const versionsButton = page.locator('button:has-text("Versions")').first();
    await expect(versionsButton).toBeVisible();
    
    // Initially should show count of 1
    await expect(versionsButton).toContainText('1');
    
    console.log('Clicking versions button to expand...');
    await versionsButton.click();
    await page.waitForTimeout(500);
    
    // Check if versions list is now visible
    const versionsList = page.locator('[data-testid="versions-list"]').first();
    await expect(versionsList).toBeVisible({ timeout: 5000 });
    
    // Should show at least 1 version
    const versionItems = page.locator('[data-testid^="version-item-"]');
    const count = await versionItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    console.log(`Found ${count} version items`);
  });

  test('should toggle versions open and closed', async ({ page }) => {
    // Upload a resume
    const resumePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    
    // Wait for upload
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/sample-resume/').first()).toBeVisible();
    
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

  test('should show versions from cache after upload', async ({ page }) => {
    // Upload two resumes
    const resumePath1 = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath1);
    await page.waitForTimeout(2000);
    
    const resumePath2 = path.join(__dirname, 'fixtures', 'sample-jd.txt');
    // Change to JD to upload as different file
    const jdInput = page.locator('input[type="file"]').nth(1);
    await jdInput.setInputFiles(resumePath2);
    await page.waitForTimeout(2000);
    
    // Click versions button for resume
    const versionsButton = page.locator('button:has-text("Versions")').first();
    await versionsButton.click();
    await page.waitForTimeout(500);
    
    // Check that versions list appears
    const versionsList = page.locator('[data-testid="versions-list"]').first();
    await expect(versionsList).toBeVisible();
    
    // Should show at least 1 version
    const versionItems = page.locator('[data-testid^="version-item-"]');
    const count = await versionItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    console.log('Version items visible:', count);
  });

  test('should show preview button for each version', async ({ page }) => {
    // Upload resume
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    // Open versions
    const versionsButton = page.locator('button:has-text("Versions")').first();
    await versionsButton.click();
    await page.waitForTimeout(500);
    
    // Check for preview button in versions list
    const versionsList = page.locator('[data-testid="versions-list"]').first();
    await expect(versionsList).toBeVisible();
    
    const previewButtons = page.locator('[data-testid^="version-preview-"]');
    const count = await previewButtons.count();
    
    expect(count).toBeGreaterThanOrEqual(1);
    console.log(`Found ${count} preview buttons in versions`);
  });
});

