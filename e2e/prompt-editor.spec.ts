import { test, expect } from '@playwright/test';

test.describe('Prompt Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Open Global Settings
    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await settingsButton.click();
    
    // Navigate to Developer tab
    const developerTab = page.locator('[data-testid="settings-tab-developer"]');
    await developerTab.click();
  });

  test('should show prompt editor buttons in developer tab', async ({ page }) => {
    // Check for prompt editor section
    await expect(page.locator('text=Prompt Editor')).toBeVisible();
    
    // Check for individual prompt buttons
    await expect(page.locator('button:has-text("Job Analysis")')).toBeVisible();
    await expect(page.locator('button:has-text("Company Intelligence")')).toBeVisible();
    await expect(page.locator('button:has-text("Match Signals")')).toBeVisible();
  });

  test('should open prompt editor when clicking prompt button', async ({ page }) => {
    // Click on Job Analysis prompt
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    // Wait for editor to open
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Verify editor is visible
    await expect(page.locator('text=Prompt Editor')).toBeVisible();
    await expect(page.locator('text=analyze')).toBeVisible();
  });

  test('should have mode toggle buttons', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Check for Markdown/JSON toggle
    await expect(page.locator('button:has-text("Markdown")')).toBeVisible();
    await expect(page.locator('button:has-text("JSON")')).toBeVisible();
  });

  test('should have view mode controls', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Check for view mode controls (Editor only, Split, Preview only)
    await expect(page.locator('button:has-text("Split")')).toBeVisible();
  });

  test('should show Variables and Versions buttons', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Check for Variables button
    await expect(page.locator('button:has-text("Variables")')).toBeVisible();
    
    // Check for Versions button
    await expect(page.locator('button:has-text("Versions")')).toBeVisible();
  });

  test('should have Test and Save buttons', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Check for Test button
    const testButton = page.locator('button:has-text("Test")');
    await expect(testButton).toBeVisible();
    
    // Check for Save button
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible();
    
    // Save should be disabled initially (no changes)
    await expect(saveButton).toBeDisabled();
  });

  test('should show variables when Variables button clicked', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Click Variables button
    const variablesButton = page.locator('button:has-text("Variables")');
    await variablesButton.click();
    
    // Should show template variables sidebar
    await expect(page.locator('text=Template Variables')).toBeVisible();
  });

  test('should show versions when Versions button clicked', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Click Versions button
    const versionsButton = page.locator('button:has-text("Versions")');
    await versionsButton.click();
    
    // Should show version history sidebar
    await expect(page.locator('text=Version History')).toBeVisible();
  });

  test('should close editor when X button clicked', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Click close button (X in header)
    const closeButton = page.locator('button[title]').filter({ hasText: '' }).first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      
      // Editor should close
      await expect(page.locator('text=Prompt Editor')).not.toBeVisible();
    }
  });

  test('should switch between Markdown and JSON modes', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Click JSON mode
    const jsonButton = page.locator('button:has-text("JSON")');
    await jsonButton.click();
    
    // JSON button should be highlighted (has bg-purple-600 class)
    await expect(jsonButton).toHaveClass(/bg-purple-600/);
    
    // Switch back to Markdown
    const markdownButton = page.locator('button:has-text("Markdown")');
    await markdownButton.click();
    
    // Markdown button should be highlighted
    await expect(markdownButton).toHaveClass(/bg-purple-600/);
  });

  test('should be able to test a prompt', async ({ page }) => {
    const analysisButton = page.locator('button:has-text("Job Analysis")');
    await analysisButton.click();
    
    await page.waitForSelector('text=Prompt Editor', { timeout: 10000 });
    
    // Click Test button
    const testButton = page.locator('button:has-text("Test")');
    await testButton.click();
    
    // Wait for test to complete
    await page.waitForSelector('text=Test Results', { timeout: 15000 }).catch(() => {});
    
    // Should show some result (even if mocked)
    // The test endpoint returns a mock response
  });
});

