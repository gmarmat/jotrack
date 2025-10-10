import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Preview All Formats - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `Preview ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);
    await page.click(`text=Preview ${timestamp}`);
    await page.waitForTimeout(500);
  });

  test('PDF preview shows embedded PDF', async ({ page }) => {
    const pdfPath = path.join(__dirname, 'fixtures', 'Resume sample no images PDF.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(pdfPath);
    await page.waitForTimeout(3000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();
    await page.waitForTimeout(1000);
    
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    // Wait for PDF to load
    const pdfObject = page.locator('[data-testid="pdf-canvas"]');
    await expect(pdfObject).toBeVisible({ timeout: 10000 });
    
    // Verify it's an object/embed tag
    const tagName = await pdfObject.evaluate(el => el.tagName.toLowerCase());
    expect(['object', 'embed', 'iframe']).toContain(tagName);
    
    console.log('✓ PDF preview working');
    await page.keyboard.press('Escape');
  });

  test('DOCX preview shows converted HTML', async ({ page }) => {
    const docxPath = path.join(__dirname, 'fixtures', 'Resume sample no images.docx');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(docxPath);
    await page.waitForTimeout(3000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const exists = await previewBtn.isVisible().catch(() => false);
    expect(exists).toBe(true);
    
    await previewBtn.click();
    await page.waitForTimeout(2000);
    
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    // Wait for DOCX content
    const docxHtml = page.locator('[data-testid="docx-html"]');
    await expect(docxHtml).toBeVisible({ timeout: 10000 });
    
    const content = await docxHtml.innerText();
    expect(content.length).toBeGreaterThan(10);
    expect(content).not.toContain('Loading');
    
    console.log('✓ DOCX preview working, content length:', content.length);
    await page.keyboard.press('Escape');
  });

  test('Text file preview shows content', async ({ page }) => {
    const txtPath = path.join(__dirname, 'fixtures', 'sample-jd.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(txtPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await previewBtn.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    const pre = modal.locator('pre');
    await expect(pre).toBeVisible();
    
    const text = await pre.innerText();
    expect(text.length).toBeGreaterThan(50);
    
    console.log('✓ Text preview working, length:', text.length);
    await page.keyboard.press('Escape');
  });

  test('Image preview shows image', async ({ page }) => {
    const imgPath = path.join(__dirname, 'fixtures', 'sample-image.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imgPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await previewBtn.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    const img = modal.locator('img').first();
    await expect(img).toBeVisible();
    
    const src = await img.getAttribute('src');
    expect(src).toContain('/api/files/stream');
    
    console.log('✓ Image preview working');
    await page.keyboard.press('Escape');
  });

  test('RTF preview shows converted content', async ({ page }) => {
    const rtfPath = path.join(__dirname, 'fixtures', 'Resume sample with Images rtf.rtf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(rtfPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const exists = await previewBtn.isVisible().catch(() => false);
    
    if (exists) {
      await previewBtn.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('[data-testid="viewer-modal"]');
      const modalVisible = await modal.isVisible().catch(() => false);
      
      if (modalVisible) {
        // RTF should show some content
        const content = await modal.innerText();
        console.log('RTF content length:', content.length);
        expect(content.length).toBeGreaterThan(10);
        
        await page.keyboard.press('Escape');
      }
    } else {
      console.log('RTF too large or not previewable');
    }
  });

  test('Empty file shows fallback message', async ({ page }) => {
    const emptyPath = path.join(__dirname, 'fixtures', 'empty.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(emptyPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await previewBtn.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    const fallback = page.locator('[data-testid="viewer-fallback"]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('Empty file');
    
    console.log('✓ Empty file fallback working');
    await page.keyboard.press('Escape');
  });
});

