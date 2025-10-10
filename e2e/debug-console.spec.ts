import { test, expect } from '@playwright/test';
import path from 'path';

test('should capture console logs when clicking versions', async ({ page }) => {
  const consoleMessages: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`BROWSER [${msg.type()}]:`, text);
  });

  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Jotrack');
  
  const timestamp = Date.now();
  await page.fill('input[placeholder*="Senior React Developer"]', `Console Test ${timestamp}`);
  await page.fill('input[placeholder*="TechCorp"]', 'Test Co');
  await page.click('button:has-text("Add Job Application")');
  await page.waitForTimeout(1000);
  
  await page.click(`text=Console Test ${timestamp}`);
  await page.waitForTimeout(500);
  
  console.log('\n===== UPLOADING FILE =====');
  const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePath);
  await page.waitForTimeout(2000);
  
  console.log('\n===== CLICKING VERSIONS BUTTON =====');
  const versionsBtn = page.locator('button:has-text("Versions")').first();
  await versionsBtn.click();
  await page.waitForTimeout(1000);
  
  console.log('\n===== ALL CONSOLE MESSAGES =====');
  consoleMessages.forEach(msg => console.log(msg));
  
  console.log('\n===== CHECKING DOM STATE =====');
  const versionsList = page.locator('[data-testid="versions-list"]');
  const exists = await versionsList.count();
  const visible = exists > 0 ? await versionsList.first().isVisible() : false;
  
  console.log('Versions list exists:', exists);
  console.log('Versions list visible:', visible);
  
  if (exists > 0) {
    const html = await versionsList.first().innerHTML();
    console.log('Versions list HTML:', html.substring(0, 200));
  }
});

