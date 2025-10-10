import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Versions - Working Test', () => {
  test('complete flow: upload, click versions, see list', async ({ page }) => {
    // Track API calls
    const apiCalls: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/attachments/versions')) {
        const data = await response.json().catch(() => null);
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          data
        });
      }
    });

    // Go to homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    // Create job
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `Test ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Company');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);
    
    // Go to job detail
    await page.click(`text=Test ${timestamp}`);
    await page.waitForTimeout(500);
    
    // Upload file
    console.log('Step 1: Uploading file');
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    // Verify file appears
    await expect(page.locator('text=/sample-resume/').first()).toBeVisible();
    console.log('✓ File uploaded and visible');
    
    // Find versions button
    console.log('Step 2: Looking for versions button');
    const versionsBtn = page.locator('button', { hasText: 'Versions' }).first();
    await expect(versionsBtn).toBeVisible();
    console.log('✓ Versions button found');
    
    // Check initial text (should show count or …)
    const btnText = await versionsBtn.innerText();
    console.log('Button text before click:', btnText);
    
    // Click versions button
    console.log('Step 3: Clicking versions button');
    await versionsBtn.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/versions-after-click.png', fullPage: true });
    
    // Check if API was called
    console.log('\nAPI Calls made:', apiCalls.length);
    if (apiCalls.length > 0) {
      console.log('Latest API call:', JSON.stringify(apiCalls[apiCalls.length - 1], null, 2));
    }
    
    // Check DOM for versions list
    console.log('\nStep 4: Checking for versions list in DOM');
    const versionsList = page.locator('[data-testid="versions-list"]');
    const listExists = await versionsList.count();
    console.log('Versions list elements found:', listExists);
    
    if (listExists > 0) {
      const isVisible = await versionsList.first().isVisible();
      console.log('First versions list visible:', isVisible);
      
      if (isVisible) {
        const versionItems = page.locator('[data-testid^="version-item-"]');
        const itemCount = await versionItems.count();
        console.log('Version items in list:', itemCount);
        
        if (itemCount > 0) {
          const firstItemText = await versionItems.first().innerText();
          console.log('First version item text:', firstItemText);
        }
      }
    }
    
    // Check button state after click (chevron should be down)
    const chevronDown = await page.locator('[data-icon="chevron-down"]').count();
    console.log('Chevron down icons:', chevronDown);
    
    // Final assertion
    await expect(versionsList).toBeVisible({ timeout: 5000 });
  });
});

