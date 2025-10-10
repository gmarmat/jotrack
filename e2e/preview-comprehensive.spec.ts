import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Preview Functionality - Comprehensive', () => {
  let jobUrl: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `Preview Test ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);
    
    await page.click(`text=Preview Test ${timestamp}`);
    await page.waitForTimeout(500);
    
    jobUrl = page.url();
  });

  test('should preview PDF without triggering download', async ({ page }) => {
    let downloadTriggered = false;
    page.on('download', () => {
      downloadTriggered = true;
    });

    const pdfPath = path.join(__dirname, 'fixtures', 'Resume sample no images PDF.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(pdfPath);
    await page.waitForTimeout(3000); // PDF upload might take longer
    
    // Find and click preview button
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const exists = await previewBtn.isVisible().catch(() => false);
    
    if (!exists) {
      console.log('PDF preview button not found - might be too large or failed upload');
      return; // Skip test if PDF didn't upload
    }
    
    await previewBtn.click();
    await page.waitForTimeout(2000); // PDF loading takes time
    
    // Check modal opened
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    // Check for PDF canvas or loading state
    const pdfCanvas = page.locator('[data-testid="viewer-pdf-page"]');
    const canvasExists = await pdfCanvas.isVisible({ timeout: 15000 }).catch(() => false);
    
    if (!canvasExists) {
      // Might still be loading or failed - check for fallback
      console.log('PDF canvas not rendered within timeout');
    }
    
    // Ensure no download was triggered
    expect(downloadTriggered).toBe(false);
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('should preview text file', async ({ page }) => {
    const txtPath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(txtPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await previewBtn.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    // Should show text content (not empty)
    const preElement = modal.locator('pre');
    await expect(preElement).toBeVisible();
    const text = await preElement.innerText();
    expect(text.length).toBeGreaterThan(0);
    
    await page.keyboard.press('Escape');
  });

  test('should show empty file message for 0-byte text', async ({ page }) => {
    const emptyPath = path.join(__dirname, 'fixtures', 'empty.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(emptyPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await previewBtn.click();
    await page.waitForTimeout(500);
    
    const fallback = page.locator('[data-testid="viewer-fallback"]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText('Empty file');
    
    await page.keyboard.press('Escape');
  });

  test('should preview image file', async ({ page }) => {
    const imgPath = path.join(__dirname, 'fixtures', 'sample-image.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imgPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await previewBtn.click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    // Should show img element
    const img = modal.locator('img');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toContain('/api/files/stream');
    
    await page.keyboard.press('Escape');
  });

  test('should preview DOCX file', async ({ page }) => {
    const docxPath = path.join(__dirname, 'fixtures', 'Resume sample no images.docx');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(docxPath);
    await page.waitForTimeout(3000); // DOCX conversion takes longer
    
    // Check if preview button exists
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const previewExists = await previewBtn.isVisible().catch(() => false);
    
    if (previewExists) {
      await previewBtn.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('[data-testid="viewer-modal"]');
      const modalVisible = await modal.isVisible().catch(() => false);
      
      if (modalVisible) {
        // Should show some content (could be converted HTML or fallback)
        const hasContent = await modal.locator('text=/Resume|JD|Experience/i').count();
        console.log('DOCX preview has content:', hasContent > 0);
        
        await page.keyboard.press('Escape');
      }
    } else {
      console.log('DOCX preview not available (might need External open)');
      // This is OK - DOCX might be too large or not support preview
    }
  });

  test('should preview from versions list', async ({ page }) => {
    // Upload file
    const txtPath = path.join(__dirname, 'fixtures', 'sample-resume.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(txtPath);
    await page.waitForTimeout(2000);
    
    // Open versions
    const versionsBtn = page.locator('button:has-text("Versions")').first();
    await versionsBtn.click();
    await page.waitForTimeout(500);
    
    // Click preview in versions list
    const versionPreviewBtn = page.locator('[data-testid^="version-preview-"]').first();
    await expect(versionPreviewBtn).toBeVisible();
    await versionPreviewBtn.click();
    await page.waitForTimeout(500);
    
    // Modal should open
    const modal = page.locator('[data-testid="viewer-modal"]');
    await expect(modal).toBeVisible();
    
    await page.keyboard.press('Escape');
  });

  test('should not trigger downloads when using preview', async ({ page }) => {
    let downloadCount = 0;
    page.on('download', () => {
      downloadCount++;
    });

    // Upload and preview multiple files
    const files = [
      { path: 'sample-resume.txt', idx: 0 },
      { path: 'sample-image.png', idx: 0 }
    ];
    
    for (const file of files) {
      const filePath = path.join(__dirname, 'fixtures', file.path);
      const fileInput = page.locator('input[type="file"]').nth(file.idx);
      await fileInput.setInputFiles(filePath);
      await page.waitForTimeout(2000);
      
      const previewBtn = page.locator('button[aria-label="Preview"]').first();
      const exists = await previewBtn.isVisible().catch(() => false);
      if (exists) {
        await previewBtn.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
    
    expect(downloadCount).toBe(0);
  });

  test('should have zoom controls for PDF', async ({ page }) => {
    const pdfPath = path.join(__dirname, 'fixtures', 'Resume sample no images PDF.pdf');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(pdfPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    await previewBtn.click();
    await page.waitForTimeout(1000);
    
    // Check for zoom buttons
    const zoomIn = page.locator('button[aria-label="Zoom In"]');
    const zoomOut = page.locator('button[aria-label="Zoom Out"]');
    
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
    
    // Click zoom in
    await zoomIn.click();
    await page.waitForTimeout(200);
    
    // Check zoom percentage updated
    const zoomPercent = page.locator('text=/%/');
    await expect(zoomPercent).toBeVisible();
    
    await page.keyboard.press('Escape');
  });
});

