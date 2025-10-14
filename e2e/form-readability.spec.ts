import { test, expect } from '@playwright/test';

test.describe('Form Readability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have consistent form field styling in light theme', async ({ page }) => {
    // Check Job Title input (uses .form-field class now)
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    await expect(jobTitleInput).toBeVisible();
    await expect(jobTitleInput).toHaveClass(/form-field/);
    
    // Check Company input
    const companyInput = page.locator('input[placeholder*="TechCorp"]');
    await expect(companyInput).toBeVisible();
    await expect(companyInput).toHaveClass(/form-field/);
    
    // Check Notes textarea
    const notesTextarea = page.locator('textarea[placeholder*="notes"]');
    await expect(notesTextarea).toBeVisible();
    await expect(notesTextarea).toHaveClass(/form-field/);
    
    // Check Search input
    const searchInput = page.locator('input[placeholder*="Search jobs"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveClass(/form-field/);
  });

  test('should have consistent form field styling in dark theme', async ({ page }) => {
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Wait for theme to apply
    await page.waitForTimeout(100);
    
    // Check that form fields have form-field class (which includes dark mode styles)
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    await expect(jobTitleInput).toHaveClass(/form-field/);
    
    const companyInput = page.locator('input[placeholder*="TechCorp"]');
    await expect(companyInput).toHaveClass(/form-field/);
    
    const notesTextarea = page.locator('textarea[placeholder*="notes"]');
    await expect(notesTextarea).toHaveClass(/form-field/);
    
    const searchInput = page.locator('input[placeholder*="Search jobs"]');
    await expect(searchInput).toHaveClass(/form-field/);
  });

  test('should have proper focus states on form fields', async ({ page }) => {
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    await expect(jobTitleInput).toBeVisible();
    
    // Click to focus the input
    await jobTitleInput.click();
    
    // Check that form-field class is present (includes focus styles)
    await expect(jobTitleInput).toHaveClass(/form-field/);
    
    // Type some text to verify it's working
    await jobTitleInput.fill('Test Job Title');
    await expect(jobTitleInput).toHaveValue('Test Job Title');
  });

  test('should not have gradients on dropdowns', async ({ page }) => {
    // Check status dropdown
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();
    
    // Should have form-field class (solid background, no gradient)
    await expect(statusSelect).toHaveClass(/form-field/);
    await expect(statusSelect).not.toHaveClass(/gradient/);
    await expect(statusSelect).not.toHaveClass(/bg-gradient/);
  });

  test('should have proper contrast ratios', async ({ page }) => {
    // Test light theme contrast
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    await expect(jobTitleInput).toBeVisible();
    
    const inputStyles = await jobTitleInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // Verify we have proper contrast (white background, dark text)
    expect(inputStyles.backgroundColor).toContain('rgb(255, 255, 255)'); // white
    expect(inputStyles.color).toContain('rgb(17, 24, 39)'); // gray-900
    
    // Switch to dark theme and test again
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    const darkInputStyles = await jobTitleInput.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color
      };
    });
    
    // Verify dark theme contrast (dark background, light text)
    expect(darkInputStyles.backgroundColor).toContain('rgb(31, 41, 55)'); // gray-800
    expect(darkInputStyles.color).toContain('rgb(243, 244, 246)'); // gray-100
  });

  test('should have readable table text', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForSelector('[data-testid="job-row"]');
    
    // Check that job rows exist
    const jobRows = page.locator('[data-testid="job-row"]');
    await expect(jobRows.first()).toBeVisible();
    
    // Check job title link
    const jobTitleLink = page.locator('td a').first();
    await expect(jobTitleLink).toBeVisible();
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Verify job title link is still visible in dark theme
    await expect(jobTitleLink).toBeVisible();
  });

  test('should have proper hover effects on table rows', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForSelector('[data-testid="job-row"]');
    
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    
    // Check hover effect class
    await expect(firstJobRow).toHaveClass(/hover:bg-blue-50/);
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Check dark theme hover effect
    await expect(firstJobRow).toHaveClass(/dark:hover:bg-gray-700/);
  });

  test('should have consistent button styling', async ({ page }) => {
    // Check primary button (Add Job)
    const addButton = page.locator('button[type="submit"]').first();
    await expect(addButton).toHaveClass(/bg-blue-600/);
    await expect(addButton).toHaveClass(/hover:bg-blue-700/);
    await expect(addButton).toHaveClass(/text-white/);
    
    // Check secondary button (Search)
    const searchButton = page.locator('button').filter({ hasText: /search/i }).first();
    await expect(searchButton).toHaveClass(/bg-gray-600/);
    await expect(searchButton).toHaveClass(/hover:bg-gray-700/);
    await expect(searchButton).toHaveClass(/text-white/);
  });

  test('should maintain form functionality across theme changes', async ({ page }) => {
    // Fill out a form in light theme
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    const companyInput = page.locator('input[placeholder*="TechCorp"]');
    
    await jobTitleInput.fill('Software Engineer');
    await companyInput.fill('Tech Corp');
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Form data should persist
    await expect(jobTitleInput).toHaveValue('Software Engineer');
    await expect(companyInput).toHaveValue('Tech Corp');
    
    // Should still be able to type
    await jobTitleInput.fill('Senior Software Engineer');
    await expect(jobTitleInput).toHaveValue('Senior Software Engineer');
  });
});
