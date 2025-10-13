import { test, expect } from '@playwright/test';

test.describe('Right Rail Tabs v2.0', () => {
  test('should open AI tab in right rail', async ({ page }) => {
    // Create a test job first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Job Title"]', 'Test Rail Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Navigate to job detail
    await page.click('a:has-text("Test Rail Job")');
    await page.waitForTimeout(1000);

    // Click AI icon in collapsed rail
    const aiButton = page.locator('button[title*="AI Analysis"]').first();
    await aiButton.click();
    await page.waitForTimeout(500);

    // Should see expanded rail with AI content
    await expect(page.locator('[data-testid="utility-rail-expanded"]')).toBeVisible();
    await expect(page.locator('text=🤖 AI Analysis')).toBeVisible();
    await expect(page.locator('[data-testid="unified-ai-panel"]')).toBeVisible();
  });

  test('should show all AI sections expanded by default', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Job Title"]', 'Test AI Sections');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    await page.click('a:has-text("Test AI Sections")');
    await page.waitForTimeout(1000);

    // Open AI tab
    await page.locator('button[title*="AI Analysis"]').first().click();
    await page.waitForTimeout(500);

    // Check all sections are visible
    await expect(page.locator('[data-testid="ai-section-quick"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-section-fit"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-section-keywords"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-section-profiles"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-section-improve"]')).toBeVisible();
  });

  test('should collapse and expand AI sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Job Title"]', 'Test Collapse');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    await page.click('a:has-text("Test Collapse")');
    await page.waitForTimeout(1000);

    await page.locator('button[title*="AI Analysis"]').first().click();
    await page.waitForTimeout(500);

    // Click to collapse Quick Insights section
    const quickSection = page.locator('[data-testid="ai-section-quick"]');
    await quickSection.locator('button').first().click();
    await page.waitForTimeout(300);

    // Content should be hidden (accordion collapsed)
    const quickContent = quickSection.locator('text=Overall Match Score');
    await expect(quickContent).not.toBeVisible();

    // Click again to expand
    await quickSection.locator('button').first().click();
    await page.waitForTimeout(300);

    // Content should be visible again
    await expect(quickContent).toBeVisible();
  });

  test('should switch between rail tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Job Title"]', 'Test Tab Switch');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    await page.click('a:has-text("Test Tab Switch")');
    await page.waitForTimeout(1000);

    // Open Files tab
    await page.locator('button[title*="Files"]').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Files')).toBeVisible();

    // Switch to AI tab
    await page.click('[data-testid="tab-ai"]');
    await page.waitForTimeout(500);
    await expect(page.locator('text=🤖 AI Analysis')).toBeVisible();
    await expect(page.locator('[data-testid="unified-ai-panel"]')).toBeVisible();

    // Switch to Meta tab
    await page.click('[data-testid="tab-meta"]');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Job Metadata')).toBeVisible();

    // Switch to Notes tab
    await page.click('[data-testid="tab-notes"]');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Global Notes')).toBeVisible();
  });
});
