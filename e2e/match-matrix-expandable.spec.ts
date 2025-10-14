import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Match Matrix - Expandable Categories', () => {
  test('should show Match Matrix with categories', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll to Match Matrix section
    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();
    
    // Should show Match Matrix
    await expect(page.locator('[data-testid="fit-table"]')).toBeVisible();
  });

  test('should show Expand All button', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();

    // Expand All button should be visible
    const expandAllButton = page.locator('[data-testid="expand-all-button"]');
    await expect(expandAllButton).toBeVisible();
  });

  test('should have 3 category sections', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();

    // Should show 3 categories
    const technicalCategory = page.locator('[data-testid="category-technical"]');
    const experienceCategory = page.locator('[data-testid="category-experience"]');
    const softCategory = page.locator('[data-testid="category-soft"]');

    await expect(technicalCategory).toBeVisible();
    await expect(experienceCategory).toBeVisible();
    await expect(softCategory).toBeVisible();
  });

  test('should expand category when clicked', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();

    // Click first category
    const technicalCategory = page.locator('[data-testid="category-technical"]');
    await technicalCategory.click();
    await page.waitForTimeout(500);

    // Should show table content
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // Should show parameters
    await expect(page.locator('th:has-text("Parameter")')).toBeVisible();
  });

  test('should collapse category when clicked again', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();

    const technicalCategory = page.locator('[data-testid="category-technical"]');
    
    // Expand
    await technicalCategory.click();
    await page.waitForTimeout(500);
    
    // Collapse
    await technicalCategory.click();
    await page.waitForTimeout(500);

    // Table should be hidden
    const table = page.locator('table').first();
    await expect(table).not.toBeVisible();
  });

  test('should expand all categories when Expand All clicked', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();

    const expandAllButton = page.locator('[data-testid="expand-all-button"]');
    await expandAllButton.click();
    await page.waitForTimeout(500);

    // All 3 categories should show content
    const tables = page.locator('table');
    const count = await tables.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least 3 tables (one per category)

    // Button should now say "Collapse All"
    await expect(expandAllButton).toContainText('Collapse All');
  });

  test('should collapse all when Collapse All clicked', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();

    const expandAllButton = page.locator('[data-testid="expand-all-button"]');
    
    // First expand all
    await expandAllButton.click();
    await page.waitForTimeout(500);
    
    // Then collapse all
    await expandAllButton.click();
    await page.waitForTimeout(500);

    // Button should say "Expand All" again
    await expect(expandAllButton).toContainText('Expand All');
  });

  test('should show parameter count in category header', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('text=/Match Matrix/i').scrollIntoViewIfNeeded();

    // Categories should show parameter count
    const categoryHeader = page.locator('[data-testid="category-technical"]');
    const text = await categoryHeader.textContent();
    
    // Should contain something like "(8 params)" or similar
    expect(text).toMatch(/\(\d+ params?\)/);
  });
});

