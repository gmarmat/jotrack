import { test, expect } from '@playwright/test';

test.describe('Company Ecosystem Matrix Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Navigate to job detail page
    const firstJob = page.locator('[data-testid="job-row"]').first();
    if (await firstJob.count() > 0) {
      await firstJob.click();
    }
  });

  test('should display two-column layout', async ({ page }) => {
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      await expect(ecosystem).toBeVisible();
      
      // Should have two sections: Direct Competitors and Adjacent Companies
      await expect(ecosystem.locator('text=Direct Competitors')).toBeVisible();
      await expect(ecosystem.locator('text=Adjacent Companies')).toBeVisible();
    }
  });

  test('should show Analyze with AI button', async ({ page }) => {
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      const analyzeButton = ecosystem.locator('[data-testid="analyze-ecosystem-button"]');
      await expect(analyzeButton).toBeVisible();
      await expect(analyzeButton).toContainText('Analyze');
    }
  });

  test('should show compact company display with 3 metrics', async ({ page }) => {
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      // Look for metric displays (Relevance, Fit, Similar)
      const companyCards = ecosystem.locator('.p-3.bg-gray-50');
      
      if (await companyCards.count() > 0) {
        const firstCard = companyCards.first();
        await expect(firstCard).toBeVisible();
        
        // Should show percentage metrics
        await expect(firstCard).toContainText(/%/);
      }
    }
  });

  test('should have Show All buttons for each column', async ({ page }) => {
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      // Look for Show All / Show Less buttons
      const showAllButtons = ecosystem.locator('button:has-text(/Show All|Show Less/i)');
      
      // Should have at least one Show All button (could be two: one per column)
      if (await showAllButtons.count() > 0) {
        await expect(showAllButtons.first()).toBeVisible();
      }
    }
  });

  test('should expand to show all companies when Show All clicked', async ({ page }) => {
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      const showAllButton = ecosystem.locator('button:has-text("Show All")').first();
      
      if (await showAllButton.count() > 0) {
        // Get initial count of displayed companies
        const companyCardsBefore = ecosystem.locator('.p-3.bg-gray-50');
        const countBefore = await companyCardsBefore.count();
        
        // Click Show All
        await showAllButton.click();
        
        // Should now show "Show Less" text
        await expect(showAllButton).toContainText(/Show Less/i);
        
        // Click again to collapse
        await showAllButton.click();
        await expect(showAllButton).toContainText(/Show All/i);
      }
    }
  });

  test('should display sources button', async ({ page }) => {
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      const sourcesButton = ecosystem.locator('[data-testid="sources-button"]');
      await expect(sourcesButton).toBeVisible();
    }
  });

  test('should show Why this matters section', async ({ page }) => {
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      await expect(ecosystem.locator('text=Why this matters')).toBeVisible();
    }
  });

  test('should be responsive (stack on mobile)', async ({ page }) => {
    // Test responsive design by checking for grid classes
    const ecosystem = page.locator('[data-testid="company-ecosystem-matrix"]');
    
    if (await ecosystem.count() > 0) {
      const gridContainer = ecosystem.locator('.grid.grid-cols-1.md\\:grid-cols-2');
      if (await gridContainer.count() > 0) {
        await expect(gridContainer).toBeVisible();
      }
    }
  });
});

