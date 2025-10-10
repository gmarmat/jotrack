import { test, expect } from '@playwright/test';
import path from 'path';

test('PDF preview - check error message', async ({ page }) => {
  page.on('console', msg => console.log(`[${msg.type()}]`, msg.text()));
  
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Jotrack');
  
  const timestamp = Date.now();
  await page.fill('input[placeholder*="Senior React Developer"]', `PDF ${timestamp}`);
  await page.fill('input[placeholder*="TechCorp"]', 'Co');
  await page.click('button:has-text("Add Job Application")');
  await page.waitForTimeout(1000);
  await page.click(`text=PDF ${timestamp}`);
  await page.waitForTimeout(500);
  
  const pdfPath = path.join(__dirname, 'fixtures', 'Resume sample no images PDF.pdf');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(pdfPath);
  await page.waitForTimeout(3000);
  
  const previewBtn = page.locator('button[aria-label="Preview"]').first();
  await expect(previewBtn).toBeVisible();
  
  console.log('\n=== CLICKING PREVIEW ===');
  await previewBtn.click();
  await page.waitForTimeout(1000);
  
  const modal = page.locator('[data-testid="viewer-modal"]');
  await expect(modal).toBeVisible();
  
  // Wait for PDF to finish loading (up to 10 seconds)
  const pdfCanvas = page.locator('[data-testid="pdf-canvas"]');
  const pdfError = page.locator('[data-testid="pdf-error"]');
  
  console.log('Waiting for PDF to load...');
  
  // Wait for either canvas or error to appear
  try {
    await Promise.race([
      pdfCanvas.waitFor({ state: 'visible', timeout: 10000 }),
      pdfError.waitFor({ state: 'visible', timeout: 10000 })
    ]);
  } catch (e) {
    console.log('Timeout waiting for PDF render');
  }
  
  // Check results
  const hasError = await pdfError.isVisible().catch(() => false);
  const hasCanvas = await pdfCanvas.isVisible().catch(() => false);
  
  console.log('Has error:', hasError);
  console.log('Has canvas:', hasCanvas);
  
  if (hasError) {
    const errorText = await pdfError.innerText();
    console.log('ERROR MESSAGE:', errorText);
  }
  
  // Check for canvas
  const canvas = page.locator('canvas, [data-testid="pdf-canvas"]');
  const canvasCount = await canvas.count();
  console.log('Canvas count:', canvasCount);
  
  if (canvasCount > 0) {
    const canvasVisible = await canvas.first().isVisible();
    console.log('Canvas visible:', canvasVisible);
  } else {
    console.log('NO CANVAS RENDERED');
    
    // Check page content
    const modalContent = await modal.innerText();
    console.log('Modal content:', modalContent);
  }
  
  await page.screenshot({ path: 'test-results/pdf-modal-detail.png', fullPage: true });
});

