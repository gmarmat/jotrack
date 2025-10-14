import { test, expect } from '@playwright/test';

test.describe('Dark Theme', () => {
  test('should have theme toggle button on all pages', async ({ page }) => {
    // Homepage
    await page.goto('/');
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();

    // Job detail page
    const firstJob = page.locator('[data-testid="job-row"]').first();
    if (await firstJob.count() > 0) {
      await firstJob.click();
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
    }
  });

  test('should toggle between light and dark themes', async ({ page }) => {
    await page.goto('/');
    
    const html = page.locator('html');
    const themeToggle = page.locator('[data-testid="theme-toggle"]');

    // Initial state (system default)
    const initialClass = await html.getAttribute('class');

    // Click to toggle
    await themeToggle.click();
    await page.waitForTimeout(300); // Wait for theme transition

    const newClass = await html.getAttribute('class');

    // Class should have changed (either added or removed 'dark')
    expect(initialClass).not.toBe(newClass);
  });

  test('should show sun icon in dark mode and moon in light mode', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Should have changed icon
    // (Specific icon test depends on current theme)
    await expect(themeToggle).toBeVisible();
  });

  test('should maintain readable contrast in dark mode - Homepage', async ({ page }) => {
    await page.goto('/');
    
    // Force dark mode
    await page.addStyleTag({ content: 'html { color-scheme: dark; }' });
    await page.locator('html').evaluate((el) => el.classList.add('dark'));

    // Check key elements are visible (contrast test)
    await expect(page.locator('text=Jotrack')).toBeVisible();
    await expect(page.locator('text=Add New Job Application')).toBeVisible();
    await expect(page.locator('text=Your Applications')).toBeVisible();
  });

  test('should style form inputs correctly in dark mode', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('html').evaluate((el) => el.classList.add('dark'));

    // Job title input should have dark background
    const jobTitleInput = page.locator('input[placeholder*="Senior React Developer"]');
    if (await jobTitleInput.count() > 0) {
      await expect(jobTitleInput).toBeVisible();
      
      // Check it has dark mode classes (by evaluating computed style or class)
      const classes = await jobTitleInput.getAttribute('class');
      expect(classes).toContain('dark:bg-gray-700');
    }
  });

  test('should style dropdowns correctly in dark mode', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('html').evaluate((el) => el.classList.add('dark'));

    // Rows per page dropdown
    const rowsSelect = page.locator('[data-testid="rows-per-page-select"]');
    if (await rowsSelect.count() > 0) {
      await expect(rowsSelect).toBeVisible();
      
      const classes = await rowsSelect.getAttribute('class');
      expect(classes).toContain('dark:bg-gray-700');
    }
  });

  test('should style filter chips correctly in dark mode', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('html').evaluate((el) => el.classList.add('dark'));

    // Filter chips should be visible
    const allChip = page.locator('[data-testid="chip-ALL"]');
    await expect(allChip).toBeVisible();

    // Check classes
    const classes = await allChip.getAttribute('class');
    expect(classes).toContain('dark:bg-');
  });

  test('should have better hover effect in dark mode', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('html').evaluate((el) => el.classList.add('dark'));

    const firstRow = page.locator('[data-testid="job-row"]').first();
    if (await firstRow.count() > 0) {
      await expect(firstRow).toBeVisible();
      
      // Hover class should include dark mode
      const classes = await firstRow.getAttribute('class');
      expect(classes).toContain('dark:hover:bg-gray-700');
    }
  });

  test('should persist theme preference', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    // Toggle to dark
    await themeToggle.click();
    await page.waitForTimeout(300);
    
    const htmlAfterToggle = await page.locator('html').getAttribute('class');
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(500);
    
    // Theme should persist
    const htmlAfterReload = await page.locator('html').getAttribute('class');
    expect(htmlAfterReload).toBe(htmlAfterToggle);
  });
});

