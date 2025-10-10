import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Preview Debug - All Formats', () => {
  test.beforeEach(async ({ page }) => {
    // Capture all console messages
    page.on('console', msg => {
      console.log(`BROWSER [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Jotrack');
    
    const timestamp = Date.now();
    await page.fill('input[placeholder*="Senior React Developer"]', `Debug ${timestamp}`);
    await page.fill('input[placeholder*="TechCorp"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);
    
    await page.click(`text=Debug ${timestamp}`);
    await page.waitForTimeout(500);
  });

  test('PDF preview - detailed debugging', async ({ page }) => {
    console.log('\n=== PDF PREVIEW TEST ===');
    
    const pdfPath = path.join(__dirname, 'fixtures', 'Resume sample no images PDF.pdf');
    console.log('Uploading PDF from:', pdfPath);
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(pdfPath);
    await page.waitForTimeout(3000);
    
    // Check if file appeared
    const fileElements = await page.locator('text=/Resume sample no images PDF/i').count();
    console.log('File name elements found:', fileElements);
    
    // Find all buttons
    const allButtons = await page.locator('button').all();
    console.log('Total buttons on page:', allButtons.length);
    
    for (const btn of allButtons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const testid = await btn.getAttribute('data-testid');
      const text = await btn.innerText().catch(() => '');
      
      if (ariaLabel?.includes('Preview') || title?.includes('Preview') || text.includes('Preview')) {
        console.log('Found preview button:', { ariaLabel, title, testid, text });
      }
    }
    
    // Try to click preview
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const exists = await previewBtn.isVisible().catch(() => false);
    console.log('Preview button visible:', exists);
    
    if (exists) {
      console.log('Clicking preview button...');
      await previewBtn.click();
      await page.waitForTimeout(2000);
      
      // Check for modal
      const modals = await page.locator('[role="dialog"], [data-testid*="modal"], [data-testid*="viewer"]').all();
      console.log('Modal elements found:', modals.length);
      
      for (const modal of modals) {
        const testid = await modal.getAttribute('data-testid');
        const visible = await modal.isVisible();
        console.log('Modal:', { testid, visible });
      }
      
      // Check for PDF canvas
      const canvas = page.locator('canvas, [data-testid="pdf-canvas"], [data-testid="viewer-pdf-page"]');
      const canvasCount = await canvas.count();
      console.log('Canvas elements:', canvasCount);
      
      if (canvasCount > 0) {
        const firstCanvas = canvas.first();
        const canvasVisible = await firstCanvas.isVisible();
        console.log('First canvas visible:', canvasVisible);
      }
      
      await page.screenshot({ path: 'test-results/pdf-preview-state.png', fullPage: true });
    } else {
      console.log('Preview button NOT found - checking why...');
      await page.screenshot({ path: 'test-results/pdf-no-preview-btn.png', fullPage: true });
    }
  });

  test('DOCX preview - detailed debugging', async ({ page }) => {
    console.log('\n=== DOCX PREVIEW TEST ===');
    
    const docxPath = path.join(__dirname, 'fixtures', 'Resume sample no images.docx');
    console.log('Uploading DOCX from:', docxPath);
    
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(docxPath);
    await page.waitForTimeout(3000);
    
    const fileElements = await page.locator('text=/Resume sample no images/i').count();
    console.log('File name elements found:', fileElements);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const exists = await previewBtn.isVisible().catch(() => false);
    console.log('Preview button visible:', exists);
    
    if (exists) {
      await previewBtn.click();
      await page.waitForTimeout(2000);
      
      const modal = page.locator('[data-testid="viewer-modal"]');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log('Modal visible:', modalVisible);
      
      if (modalVisible) {
        const content = await modal.innerText();
        console.log('Modal content sample:', content.substring(0, 200));
        
        const docxHtml = page.locator('[data-testid="docx-html"]');
        const hasDocxHtml = await docxHtml.count();
        console.log('DOCX HTML elements:', hasDocxHtml);
      }
      
      await page.screenshot({ path: 'test-results/docx-preview-state.png', fullPage: true });
    }
  });

  test('Text file preview', async ({ page }) => {
    console.log('\n=== TEXT PREVIEW TEST ===');
    
    const txtPath = path.join(__dirname, 'fixtures', 'sample-jd.txt');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(txtPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const exists = await previewBtn.isVisible().catch(() => false);
    console.log('Preview button visible:', exists);
    
    if (exists) {
      await previewBtn.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('[data-testid="viewer-modal"]');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log('Modal visible:', modalVisible);
      
      if (modalVisible) {
        const pre = page.locator('pre');
        const preCount = await pre.count();
        console.log('Pre elements:', preCount);
        
        if (preCount > 0) {
          const text = await pre.first().innerText();
          console.log('Text content length:', text.length);
          console.log('Text sample:', text.substring(0, 100));
        }
      }
    }
  });

  test('Image preview', async ({ page }) => {
    console.log('\n=== IMAGE PREVIEW TEST ===');
    
    const imgPath = path.join(__dirname, 'fixtures', 'sample-image.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imgPath);
    await page.waitForTimeout(2000);
    
    const previewBtn = page.locator('button[aria-label="Preview"]').first();
    const exists = await previewBtn.isVisible().catch(() => false);
    console.log('Preview button visible:', exists);
    
    if (exists) {
      await previewBtn.click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('[data-testid="viewer-modal"]');
      const modalVisible = await modal.isVisible().catch(() => false);
      console.log('Modal visible:', modalVisible);
      
      if (modalVisible) {
        const img = page.locator('img');
        const imgCount = await img.count();
        console.log('Img elements:', imgCount);
        
        if (imgCount > 0) {
          const src = await img.first().getAttribute('src');
          console.log('Image src:', src);
        }
      }
    }
  });

  test('Check which files can be previewed', async ({ page }) => {
    console.log('\n=== PREVIEW CAPABILITY CHECK ===');
    
    const files = [
      { name: 'sample-jd.txt', kind: 'txt' },
      { name: 'sample-image.png', kind: 'image' },
      { name: 'Resume sample no images PDF.pdf', kind: 'pdf' },
      { name: 'Resume sample no images.docx', kind: 'docx' },
    ];
    
    for (const file of files) {
      console.log(`\n--- Testing ${file.kind}: ${file.name} ---`);
      
      const filePath = path.join(__dirname, 'fixtures', file.name);
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(filePath);
      await page.waitForTimeout(2000);
      
      // Check for preview button
      const previewBtn = page.locator('button[aria-label="Preview"]').first();
      const hasPreview = await previewBtn.isVisible().catch(() => false);
      console.log(`${file.kind} has preview button:`, hasPreview);
      
      if (hasPreview) {
        // Click and check modal
        await previewBtn.click();
        await page.waitForTimeout(1500);
        
        const modal = page.locator('[data-testid="viewer-modal"]');
        const modalVisible = await modal.isVisible().catch(() => false);
        console.log(`${file.kind} modal opened:`, modalVisible);
        
        if (modalVisible) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
      
      // Delete the file to prepare for next one
      const deleteBtn = page.locator('button[aria-label="Delete"]').first();
      const canDelete = await deleteBtn.isVisible().catch(() => false);
      if (canDelete) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

