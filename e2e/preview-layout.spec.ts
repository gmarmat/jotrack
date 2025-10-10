import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Preview Layout Tests', () => {
  test('attachments section should be after main header and full width', async ({ page }) => {
    // Create job
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `Layout Test ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);
    
    await page.click(`text=Layout Test ${timestamp}`);
    await page.waitForTimeout(500);
    
    // Upload one file
    const filePath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    // Check attachments section exists
    const attachmentsSection = page.locator('[data-testid="attachments-section"]');
    await expect(attachmentsSection).toBeVisible();
    
    // Check layout: attachments should be AFTER the header
    const header = page.locator('[data-testid="job-title"]');
    await expect(header).toBeVisible();
    
    const headerBox = await header.boundingBox();
    const attachmentsBox = await attachmentsSection.boundingBox();
    
    expect(headerBox).toBeTruthy();
    expect(attachmentsBox).toBeTruthy();
    
    // Attachments section should be below header (higher Y position)
    expect(attachmentsBox!.y).toBeGreaterThan(headerBox!.y);
    
    // Check width - should be substantial (full width within container)
    const viewportSize = page.viewportSize();
    expect(attachmentsBox!.width).toBeGreaterThan(viewportSize!.width * 0.5);
    
    console.log('Header Y:', headerBox!.y, 'Attachments Y:', attachmentsBox!.y);
    console.log('Attachments width:', attachmentsBox!.width, 'vs viewport:', viewportSize!.width);
  });
});

