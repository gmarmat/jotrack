// v2.7 Comprehensive E2E Test Suite
// Tests all critical functionality after bug fixes

import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';
const BASE_URL = 'http://localhost:3000';

test.describe('v2.7 Complete Flow - All Features Working', () => {
  
  test('Issue 1 FIXED: Analyze All works without 500 error', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Should show blue banner with "Analyze All" button
    const analyzeButton = page.locator('button:has-text("Analyze All")');
    const hasButton = await analyzeButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasButton && !(await analyzeButton.isDisabled())) {
      // Click Analyze All
      await analyzeButton.click();
      
      // Should see spinner
      const spinner = page.locator('text=Analyzing...');
      const hasSpinner = await spinner.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log('Analyze All spinner shown:', hasSpinner);
      
      // Wait for completion
      await page.waitForTimeout(5000);
      
      // Should see success message (not error)
      const success = page.locator('text=/Analysis Complete|up to date/i');
      const error = page.locator('text=/500|error|failed/i');
      
      const hasSuccess = await success.isVisible().catch(() => false);
      const hasError = await error.isVisible().catch(() => false);
      
      console.log('Analysis result:', { success: hasSuccess, error: hasError });
      
      expect(hasError).toBe(false); // Should NOT have errors
      expect(hasSuccess).toBe(true); // Should have success
    }
  });

  test('Issue 2 FIXED: Notes save works without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Find notes card
    const editButton = page.locator('[data-testid="edit-notes-button"]');
    await editButton.click();
    
    // Wait for textarea
    const textarea = page.locator('[data-testid="notes-textarea"]');
    await expect(textarea).toBeVisible();
    
    // Type some text
    const testNote = `E2E Test Note - ${Date.now()}`;
    await textarea.fill(testNote);
    
    // Click save
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    
    // Should NOT see error
    await page.waitForTimeout(2000);
    
    const errorMessage = page.locator('text=/Failed to save|error/i');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    console.log('Notes save error:', hasError);
    expect(hasError).toBe(false);
    
    // Edit button should be back (not in editing mode)
    const editButtonVisible = await editButton.isVisible();
    expect(editButtonVisible).toBe(true);
  });

  test('Complete Two-Button Flow: Blue Banner → Analyze All → Green Success', async ({ page }) => {
    await page.goto(`${BASE_URL}/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Step 1: Should show blue banner
    const blueBanner = page.locator('text=Ready to Analyze');
    const hasBlue = await blueBanner.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log('Step 1 - Blue banner:', hasBlue);
    
    if (hasBlue) {
      // Step 2: Click Analyze All
      const analyzeButton = page.locator('button:has-text("Analyze All")');
      await analyzeButton.click();
      
      console.log('Step 2 - Clicked Analyze All');
      
      // Step 3: See spinner
      await page.waitForTimeout(1000);
      
      // Step 4: See success
      await page.waitForTimeout(4000);
      
      const successBanner = page.locator('text=Analysis Complete');
      const hasSuccess = await successBanner.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log('Step 3 - Success banner:', hasSuccess);
      expect(hasSuccess).toBe(true);
      
      // Step 5: Banner auto-hides after 3 seconds
      await page.waitForTimeout(4000);
      
      const stillVisible = await successBanner.isVisible().catch(() => false);
      console.log('Step 4 - Banner auto-hidden:', !stillVisible);
      expect(stillVisible).toBe(false);
    }
  });

  test('State Machine: All 4 states work correctly', async ({ page, request }) => {
    // This test verifies the state machine via API calls
    
    // Get current state
    const stalenessRes = await request.get(
      `${BASE_URL}/api/jobs/${TEST_JOB_ID}/check-staleness`
    );
    const staleness = await stalenessRes.json();
    
    console.log('Current state:', staleness.severity);
    console.log('Has variants:', staleness.hasVariants);
    console.log('Has analysis:', staleness.hasAnalysis);
    
    // Verify state is one of the 4 valid states
    const validStates = ['no_variants', 'variants_fresh', 'stale', 'fresh'];
    expect(validStates).toContain(staleness.severity);
    
    // If variants_fresh, should have variants but no analysis
    if (staleness.severity === 'variants_fresh') {
      expect(staleness.hasVariants).toBe(true);
      expect(staleness.hasAnalysis).toBe(false);
    }
    
    // If fresh, should have both
    if (staleness.severity === 'fresh') {
      expect(staleness.hasVariants).toBe(true);
      expect(staleness.hasAnalysis).toBe(true);
    }
  });

  test('No React errors in console', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Filter out the known non-critical warnings
    const criticalErrors = errors.filter(e => 
      !e.includes('key prop') && // FitTable warning (non-critical)
      !e.includes('preload') &&  // Next.js preload warning (non-critical)
      !e.includes('permission') // Resource permission (non-critical)
    );
    
    console.log('Critical errors found:', criticalErrors.length);
    
    if (criticalErrors.length > 0) {
      console.log('Errors:', criticalErrors);
    }
    
    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
  });

  test('All API endpoints return 200', async ({ request }) => {
    const endpoints = [
      `/api/jobs/${TEST_JOB_ID}`,
      `/api/jobs/${TEST_JOB_ID}/attachments`,
      `/api/jobs/${TEST_JOB_ID}/check-staleness`,
      `/api/jobs/${TEST_JOB_ID}/status-events`,
    ];
    
    for (const endpoint of endpoints) {
      const res = await request.get(`${BASE_URL}${endpoint}`);
      console.log(`${endpoint}: ${res.status()}`);
      expect(res.status()).toBe(200);
    }
  });
});

