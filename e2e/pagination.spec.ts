import { test, expect } from '@playwright/test';

test.describe('Pagination', () => {
  test('should display pagination controls with correct counts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check pagination controls are visible
    const paginationControls = page.locator('[data-testid="rows-per-page-select"]');
    await expect(paginationControls).toBeVisible();

    // Check default rows per page is 25
    await expect(paginationControls).toHaveValue('25');

    // Check showing text is displayed
    const showingText = page.locator('text=/Showing \\d+-\\d+ of \\d+ jobs/');
    await expect(showingText).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // If there are multiple pages, test navigation
    const nextButton = page.locator('[data-testid="next-page-button"]');
    const prevButton = page.locator('[data-testid="prev-page-button"]');

    // Previous button should be disabled on first page
    await expect(prevButton).toBeDisabled();

    // Check if next button exists and is enabled (depends on number of jobs)
    const isNextEnabled = await nextButton.isEnabled();
    
    if (isNextEnabled) {
      // Click next
      await nextButton.click();
      await page.waitForTimeout(500);

      // Previous should now be enabled
      await expect(prevButton).toBeEnabled();

      // Click previous to go back
      await prevButton.click();
      await page.waitForTimeout(500);

      // Should be back on page 1
      await expect(prevButton).toBeDisabled();
    }
  });

  test('should change rows per page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const rowsSelect = page.locator('[data-testid="rows-per-page-select"]');
    
    // Change to 10 rows per page
    await rowsSelect.selectOption('10');
    await page.waitForTimeout(500);

    // Verify the select value changed
    await expect(rowsSelect).toHaveValue('10');

    // Check that showing text updated
    const showingText = page.locator('text=/Showing 1-\\d+ of \\d+ jobs/');
    await expect(showingText).toBeVisible();

    // Change to 50 rows per page
    await rowsSelect.selectOption('50');
    await page.waitForTimeout(500);

    await expect(rowsSelect).toHaveValue('50');
  });

  test('should reset to page 1 when changing rows per page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const rowsSelect = page.locator('[data-testid="rows-per-page-select"]');
    const nextButton = page.locator('[data-testid="next-page-button"]');
    
    // Set to 10 rows per page to ensure multiple pages
    await rowsSelect.selectOption('10');
    await page.waitForTimeout(500);

    // If there's a next button, go to page 2
    const isNextEnabled = await nextButton.isEnabled();
    if (isNextEnabled) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Now change rows per page
      await rowsSelect.selectOption('25');
      await page.waitForTimeout(500);

      // Should reset to page 1 (prev button disabled)
      const prevButton = page.locator('[data-testid="prev-page-button"]');
      await expect(prevButton).toBeDisabled();
    }
  });

  test('should work with status filters', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on a status filter
    const filterChip = page.locator('[data-testid="filter-APPLIED"]').first();
    if (await filterChip.isVisible()) {
      await filterChip.click();
      await page.waitForTimeout(500);

      // Pagination should still be visible if there are jobs
      const paginationControls = page.locator('[data-testid="rows-per-page-select"]');
      const jobCount = await page.locator('text=/Showing \\d+-\\d+ of \\d+ jobs/').textContent();
      
      if (jobCount && !jobCount.includes('0')) {
        await expect(paginationControls).toBeVisible();
      }
    }
  });
});

