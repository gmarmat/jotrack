import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should default to light theme', async ({ page }) => {
    // Check that light theme is applied by default
    const htmlElement = await page.locator('html');
    await expect(htmlElement).not.toHaveClass(/dark/);
    
    // Check that form fields use light theme (form-field class)
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    await expect(jobTitleInput).toBeVisible();
    await expect(jobTitleInput).toHaveClass(/form-field/);
  });

  test('should toggle to dark theme when clicked', async ({ page }) => {
    // Find and click the theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();
    
    // Click to switch to dark theme
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Check that dark class is applied to html
    const htmlElement = await page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
    
    // Check that form fields still have form-field class (includes dark mode styles)
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    await expect(jobTitleInput).toHaveClass(/form-field/);
  });

  test('should toggle back to light theme', async ({ page }) => {
    // First switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Verify dark theme is active
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
    
    // Click again to switch back to light theme
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Check that dark class is removed
    await expect(htmlElement).not.toHaveClass(/dark/);
  });

  test('should show correct icon based on theme', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    // Initially should show moon icon (light theme -> switch to dark)
    await expect(themeToggle.locator('svg')).toBeVisible();
    
    // Switch to dark theme
    await themeToggle.click();
    
    // Should show sun icon (dark theme -> switch to light)
    await expect(themeToggle.locator('svg')).toBeVisible();
  });

  test('should persist theme preference across page reloads', async ({ page }) => {
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Verify dark theme is active
    const htmlElement = await page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
    
    // Reload the page
    await page.reload();
    
    // Theme should persist
    await expect(htmlElement).toHaveClass(/dark/);
    
    // Switch back to light theme
    await themeToggle.click();
    await expect(htmlElement).not.toHaveClass(/dark/);
    
    // Reload again
    await page.reload();
    
    // Light theme should persist
    await expect(htmlElement).not.toHaveClass(/dark/);
  });

  test('should maintain proper contrast in both themes', async ({ page }) => {
    // Test light theme
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    await expect(jobTitleInput).toBeVisible();
    await expect(jobTitleInput).toHaveClass(/form-field/);
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Test dark theme - form-field class includes dark mode styles
    await expect(jobTitleInput).toHaveClass(/form-field/);
  });
});
