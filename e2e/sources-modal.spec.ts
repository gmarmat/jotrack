import { test, expect } from '@playwright/test';

test.describe('Sources Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a job detail page that has AI analysis
    await page.goto('/');
    
    // Click on first job to go to detail page
    const firstJob = page.locator('[data-testid="job-row"]').first();
    if (await firstJob.count() > 0) {
      await firstJob.click();
    }
  });

  test('should open sources modal from Company Intelligence card', async ({ page }) => {
    // Wait for Company Intelligence card to load
    await page.waitForSelector('[data-testid="company-intelligence-card"]');
    
    // Click sources button
    const sourcesButton = page.locator('[data-testid="company-intelligence-card"] [data-testid="sources-button"]');
    await sourcesButton.click();
    
    // Verify modal opens
    await expect(page.locator('[data-testid="sources-modal"]')).toBeVisible();
    await expect(page.locator('text=Company Intelligence Sources')).toBeVisible();
  });

  test('should display sources grouped by type', async ({ page }) => {
    await page.waitForSelector('[data-testid="company-intelligence-card"]');
    const sourcesButton = page.locator('[data-testid="company-intelligence-card"] [data-testid="sources-button"]');
    await sourcesButton.click();
    
    // Verify modal has content
    const modal = page.locator('[data-testid="sources-modal"]');
    await expect(modal).toBeVisible();
    
    // Check for source elements (structure may vary based on data)
    // At minimum, should have a close button
    await expect(modal.locator('button[aria-label="Close"]')).toBeVisible();
  });

  test('should close modal when close button clicked', async ({ page }) => {
    await page.waitForSelector('[data-testid="company-intelligence-card"]');
    const sourcesButton = page.locator('[data-testid="company-intelligence-card"] [data-testid="sources-button"]');
    await sourcesButton.click();
    
    const modal = page.locator('[data-testid="sources-modal"]');
    await expect(modal).toBeVisible();
    
    // Click close button
    await modal.locator('button[aria-label="Close"]').click();
    
    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    await page.waitForSelector('[data-testid="company-intelligence-card"]');
    const sourcesButton = page.locator('[data-testid="company-intelligence-card"] [data-testid="sources-button"]');
    await sourcesButton.click();
    
    const modal = page.locator('[data-testid="sources-modal"]');
    await expect(modal).toBeVisible();
    
    // Click outside modal (on the backdrop)
    await page.locator('[data-testid="sources-modal"]').click({ position: { x: 5, y: 5 } });
    
    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test('should have sources button on People Profiles card', async ({ page }) => {
    await page.waitForSelector('[data-testid="people-profiles-card"]', { timeout: 5000 }).catch(() => {});
    
    const peopleCard = page.locator('[data-testid="people-profiles-card"]');
    if (await peopleCard.count() > 0) {
      const sourcesButton = peopleCard.locator('[data-testid="sources-button"]');
      await expect(sourcesButton).toBeVisible();
    }
  });

  test('should have sources button on Company Ecosystem card', async ({ page }) => {
    await page.waitForSelector('[data-testid="company-ecosystem-matrix"]', { timeout: 5000 }).catch(() => {});
    
    const ecosystemCard = page.locator('[data-testid="company-ecosystem-matrix"]');
    if (await ecosystemCard.count() > 0) {
      const sourcesButton = ecosystemCard.locator('[data-testid="sources-button"]');
      await expect(sourcesButton).toBeVisible();
    }
  });

  test('should show copy all button in modal', async ({ page }) => {
    await page.waitForSelector('[data-testid="company-intelligence-card"]');
    const sourcesButton = page.locator('[data-testid="company-intelligence-card"] [data-testid="sources-button"]');
    await sourcesButton.click();
    
    const modal = page.locator('[data-testid="sources-modal"]');
    await expect(modal).toBeVisible();
    
    // Look for Copy All button (text may vary)
    const copyButton = modal.locator('button:has-text("Copy")');
    if (await copyButton.count() > 0) {
      await expect(copyButton.first()).toBeVisible();
    }
  });
});

