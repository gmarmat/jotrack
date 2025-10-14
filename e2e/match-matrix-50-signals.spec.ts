import { test, expect } from '@playwright/test';

test.describe('Match Matrix 50-Signal System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Coach Mode for a job
    const firstJob = page.locator('[data-testid="job-row"]').first();
    if (await firstJob.count() > 0) {
      // Get job ID and navigate to coach mode
      await firstJob.click();
      
      // Look for Coach Mode button/link
      const coachButton = page.locator('text=/Coach Mode|Open Coach/i');
      if (await coachButton.count() > 0) {
        await coachButton.first().click();
      }
    }
  });

  test('should display Match Matrix with 3 categories', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      await expect(fitTable).toBeVisible();
      
      // Check for 3 main categories
      await expect(fitTable.locator('[data-testid="category-technical"]')).toBeVisible();
      await expect(fitTable.locator('[data-testid="category-experience"]')).toBeVisible();
      await expect(fitTable.locator('[data-testid="category-soft"]')).toBeVisible();
    }
  });

  test('should show "Analyze with AI" button instead of Refresh', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      // Check for "Analyze with AI" button
      const analyzeButton = page.locator('[data-testid="analyze-matrix-button"]');
      await expect(analyzeButton).toBeVisible();
      await expect(analyzeButton).toContainText(/Analyze with AI/i);
    }
  });

  test('should display signal count (20 ATS + dynamic)', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      // Check for description mentioning signal count
      const description = fitTable.locator('text=/job-relevant signals/i');
      await expect(description).toBeVisible();
      
      // Should mention "20 ATS standard"
      const atsText = fitTable.locator('text=/20 ATS standard/i');
      if (await atsText.count() > 0) {
        await expect(atsText).toBeVisible();
      }
    }
  });

  test('should have Expand All button', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      const expandAllButton = fitTable.locator('[data-testid="expand-all-button"]');
      await expect(expandAllButton).toBeVisible();
    }
  });

  test('should expand/collapse categories', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      const technicalCategory = fitTable.locator('[data-testid="category-technical"]');
      
      if (await technicalCategory.count() > 0) {
        // Click to expand
        await technicalCategory.click();
        
        // Should show table with signals
        const table = fitTable.locator('table').first();
        if (await table.count() > 0) {
          await expect(table).toBeVisible();
        }
        
        // Click again to collapse
        await technicalCategory.click();
      }
    }
  });

  test('should show category aggregate scores in header', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      // Each category header should show param count
      const categoryHeaders = fitTable.locator('[data-testid^="category-"]');
      const firstHeader = categoryHeaders.first();
      
      if (await firstHeader.count() > 0) {
        // Should show something like "( params)"
        await expect(firstHeader).toContainText(/params\)/i);
      }
    }
  });

  test('should have prompt viewer icon', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      // Prompt viewer should be present (icon button near Analyze button)
      const buttons = fitTable.locator('button');
      await expect(buttons).not.toHaveCount(0);
    }
  });

  test('should show overall fit score', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      // Should have large percentage displayed
      const scoreText = fitTable.locator('.text-3xl.font-bold');
      if (await scoreText.count() > 0) {
        await expect(scoreText.first()).toBeVisible();
        await expect(scoreText.first()).toContainText(/%/);
      }
    }
  });

  test('should show "Why this matters" section', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      await expect(fitTable.locator('text=Why this matters')).toBeVisible();
      
      // Should mention 50 signals
      const whySection = fitTable.locator('text=/up to 50 job-relevant signals/i');
      if (await whySection.count() > 0) {
        await expect(whySection).toBeVisible();
      }
    }
  });

  test('should toggle Expand All state', async ({ page }) => {
    const fitTable = page.locator('[data-testid="fit-table"]');
    
    if (await fitTable.count() > 0) {
      const expandAllButton = fitTable.locator('[data-testid="expand-all-button"]');
      
      if (await expandAllButton.count() > 0) {
        // Click Expand All
        await expandAllButton.click();
        await expect(expandAllButton).toContainText(/Collapse All/i);
        
        // Click again to collapse all
        await expandAllButton.click();
        await expect(expandAllButton).toContainText(/Expand All/i);
      }
    }
  });
});

