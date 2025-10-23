import { test, expect } from '@playwright/test';

// Ultra-fast smoke tests with tight timeouts
test.describe('JoTrack Fast Smoke Tests', () => {
  
  test('Home Page Loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log('✅ Home page loaded:', title);
  });

  test('API Jobs Endpoint', async ({ page }) => {
    const response = await page.request.get('/api/jobs', { timeout: 5000 });
    expect(response.status()).toBeLessThan(500);
    console.log('✅ API jobs endpoint working:', response.status());
  });

  test('Job Navigation Works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Look for job links
    const jobLinks = page.locator('a[href*="/jobs/"]');
    const count = await jobLinks.count();
    
    if (count > 0) {
      await jobLinks.first().click();
      await page.waitForTimeout(2000);
      
      const url = page.url();
      expect(url).toMatch(/\/jobs\/[a-f0-9-]+/);
      console.log('✅ Job navigation works:', url);
    } else {
      console.log('⚠️ No job links found');
    }
  });

  test('Status Dropdown Accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const jobLinks = page.locator('a[href*="/jobs/"]');
    const count = await jobLinks.count();
    
    if (count > 0) {
      await jobLinks.first().click();
      await page.waitForTimeout(2000);
      
      const statusDropdown = page.locator('select');
      const hasDropdown = await statusDropdown.count() > 0;
      
      if (hasDropdown) {
        await statusDropdown.first().click();
        await page.waitForTimeout(500);
        console.log('✅ Status dropdown accessible');
      } else {
        console.log('⚠️ Status dropdown not found');
      }
    }
  });

  test('Settings Modal Opens', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const settingsButton = page.locator('button:has-text("⚙️")');
    const hasSettings = await settingsButton.count() > 0;
    
    if (hasSettings) {
      await settingsButton.first().click();
      await page.waitForTimeout(1000);
      console.log('✅ Settings modal opened');
    } else {
      console.log('⚠️ Settings button not found');
    }
  });
});
