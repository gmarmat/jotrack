import { test, expect } from '@playwright/test';

test.describe('AI Settings UI v1.3.1', () => {
  test('should display AI settings page with all required fields', async ({ page }) => {
    await page.goto('/settings/ai');
    
    // Check page loads with correct testid
    await expect(page.locator('[data-testid="ai-settings-page"]')).toBeVisible();
    
    // Check main form fields are present
    await expect(page.locator('[data-testid="ai-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-provider"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-model"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-key"]')).toBeVisible();
    
    // Check initial state shows status badge (either Local or Remote based on current config)
    const statusBadge = page.locator('text=Local (Dry-run), text=AI (Remote)').first();
    await expect(statusBadge).toBeVisible();
  });

  test('should update status badge when Network ON with API key', async ({ page }) => {
    await page.goto('/settings/ai');
    
    // Toggle Network ON
    await page.locator('[data-testid="ai-toggle"]').check();
    
    // Fill in dummy API key
    await page.locator('[data-testid="ai-key"]').fill('sk-test-123456789');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Wait for success message
    await expect(page.locator('text=Settings Saved')).toBeVisible();
    
    // Check status badge shows AI (Remote)
    await expect(page.locator('text=AI (Remote)')).toBeVisible();
    
    // Check API Key Configured badge
    await expect(page.locator('text=API Key Configured')).toBeVisible();
  });

  test('should show warning when Network ON but no API key', async ({ page }) => {
    await page.goto('/settings/ai');
    
    // Toggle Network ON
    await page.locator('[data-testid="ai-toggle"]').check();
    
    // Don't fill API key, just save
    await page.click('button:has-text("Save Settings")');
    
    // Check warning appears
    await expect(page.locator('text=API Key Required')).toBeVisible();
    await expect(page.locator('text=Network AI is enabled but no API key is configured')).toBeVisible();
  });

  test('should allow model selection', async ({ page }) => {
    await page.goto('/settings/ai');
    
    const modelSelect = page.locator('[data-testid="ai-model"]');
    
    // Check default selection (may be gpt-4o or gpt-4o-mini)
    const defaultValue = await modelSelect.inputValue();
    expect(['gpt-4o-mini', 'gpt-4o']).toContain(defaultValue);
    
    // Change to different model
    await modelSelect.selectOption('gpt-4o');
    await expect(modelSelect).toHaveValue('gpt-4o');
    
    // Change to another model
    await modelSelect.selectOption('gpt-3.5-turbo');
    await expect(modelSelect).toHaveValue('gpt-3.5-turbo');
  });

  test('should have working back navigation', async ({ page }) => {
    await page.goto('/settings/ai');
    
    // Click back to settings
    await page.click('text=Back to Settings');
    
    // Should be on main settings page
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });

  test('should show help section with privacy information', async ({ page }) => {
    await page.goto('/settings/ai');
    
    // Check help section is present
    await expect(page.locator('text=How It Works')).toBeVisible();
    
    // Check privacy information
    await expect(page.locator('text=Keys are stored encrypted on your device/server')).toBeVisible();
    await expect(page.locator('text=They are never sent to the browser or logged')).toBeVisible();
  });
});
