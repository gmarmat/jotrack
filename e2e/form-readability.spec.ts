import { test, expect } from '@playwright/test';

test.describe('Form Readability', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have consistent form field styling in light theme', async ({ page }) => {
    // Check Job Title input
    const jobTitleInput = page.locator('input[placeholder*="Job Title"]');
    await expect(jobTitleInput).toBeVisible();
    await expect(jobTitleInput).toHaveClass(/bg-white/);
    await expect(jobTitleInput).toHaveClass(/text-gray-900/);
    await expect(jobTitleInput).toHaveClass(/border-gray-300/);
    
    // Check Company input
    const companyInput = page.locator('input[placeholder*="Company"]');
    await expect(companyInput).toBeVisible();
    await expect(companyInput).toHaveClass(/bg-white/);
    await expect(companyInput).toHaveClass(/text-gray-900/);
    await expect(companyInput).toHaveClass(/border-gray-300/);
    
    // Check Notes textarea
    const notesTextarea = page.locator('textarea[placeholder*="notes"]');
    await expect(notesTextarea).toBeVisible();
    await expect(notesTextarea).toHaveClass(/bg-white/);
    await expect(notesTextarea).toHaveClass(/text-gray-900/);
    await expect(notesTextarea).toHaveClass(/border-gray-300/);
    
    // Check Search input
    const searchInput = page.locator('input[placeholder*="Search jobs"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveClass(/bg-white/);
    await expect(searchInput).toHaveClass(/text-gray-900/);
    await expect(searchInput).toHaveClass(/border-gray-300/);
  });

  test('should have consistent form field styling in dark theme', async ({ page }) => {
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Check Job Title input in dark theme
    const jobTitleInput = page.locator('input[placeholder*="Job Title"]');
    await expect(jobTitleInput).toHaveClass(/dark:bg-gray-800/);
    await expect(jobTitleInput).toHaveClass(/dark:text-gray-100/);
    await expect(jobTitleInput).toHaveClass(/dark:border-gray-600/);
    
    // Check Company input in dark theme
    const companyInput = page.locator('input[placeholder*="Company"]');
    await expect(companyInput).toHaveClass(/dark:bg-gray-800/);
    await expect(companyInput).toHaveClass(/dark:text-gray-100/);
    await expect(companyInput).toHaveClass(/dark:border-gray-600/);
    
    // Check Notes textarea in dark theme
    const notesTextarea = page.locator('textarea[placeholder*="notes"]');
    await expect(notesTextarea).toHaveClass(/dark:bg-gray-800/);
    await expect(notesTextarea).toHaveClass(/dark:text-gray-100/);
    await expect(notesTextarea).toHaveClass(/dark:border-gray-600/);
    
    // Check Search input in dark theme
    const searchInput = page.locator('input[placeholder*="Search jobs"]');
    await expect(searchInput).toHaveClass(/dark:bg-gray-800/);
    await expect(searchInput).toHaveClass(/dark:text-gray-100/);
    await expect(searchInput).toHaveClass(/dark:border-gray-600/);
  });

  test('should have proper focus states on form fields', async ({ page }) => {
    const jobTitleInput = page.locator('input[placeholder*="Job Title"]');
    
    // Click to focus the input
    await jobTitleInput.click();
    
    // Check that focus ring is applied
    await expect(jobTitleInput).toHaveClass(/focus:ring-2/);
    await expect(jobTitleInput).toHaveClass(/focus:ring-blue-500/);
    await expect(jobTitleInput).toHaveClass(/focus:border-transparent/);
    
    // Type some text to verify it's working
    await jobTitleInput.fill('Test Job Title');
    await expect(jobTitleInput).toHaveValue('Test Job Title');
  });

  test('should not have gradients on dropdowns', async ({ page }) => {
    // Check status dropdown
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();
    
    // Should have solid background, not gradient
    await expect(statusSelect).toHaveClass(/bg-white/);
    await expect(statusSelect).not.toHaveClass(/gradient/);
    await expect(statusSelect).not.toHaveClass(/bg-gradient/);
  });

  test('should have proper contrast ratios', async ({ page }) => {
    // Test light theme contrast
    const jobTitleInput = page.locator('input[placeholder*="Job Title"]');
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
    
    // Check company column text
    const companyCell = page.locator('td').filter({ hasText: /company/i }).first();
    await expect(companyCell).toHaveClass(/text-gray-700/);
    
    // Check job title text
    const jobTitleCell = page.locator('td a').first();
    await expect(jobTitleCell).toHaveClass(/text-blue-600/);
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Check dark theme text colors
    await expect(companyCell).toHaveClass(/dark:text-gray-300/);
    await expect(jobTitleCell).toHaveClass(/dark:text-blue-400/);
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
    const jobTitleInput = page.locator('input[placeholder*="Job Title"]');
    const companyInput = page.locator('input[placeholder*="Company"]');
    
    await jobTitleInput.fill('Software Engineer');
    await companyInput.fill('Tech Corp');
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Form data should persist
    await expect(jobTitleInput).toHaveValue('Software Engineer');
    await expect(companyInput).toHaveValue('Tech Corp');
    
    // Should still be able to type
    await jobTitleInput.fill('Senior Software Engineer');
    await expect(jobTitleInput).toHaveValue('Senior Software Engineer');
  });
});
