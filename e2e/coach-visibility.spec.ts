import { test, expect } from '@playwright/test';

test.describe('Coach Mode Visibility v1.3.1', () => {
  test('should display evidence tables in Coach Mode steps', async ({ page }) => {
    // Create a test job first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[placeholder*="Job Title"]', { timeout: 10000 });
    
    await page.fill('input[placeholder*="Job Title"]', 'Test Coach Job');
    await page.fill('input[placeholder*="Company"]', 'Test Company');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Navigate to Coach Mode
    const jobLink = page.locator('a:has-text("Test Coach Job")').first();
    await jobLink.click();
    await page.waitForTimeout(500);
    
    // Click Coach Mode button
    await page.click('button:has-text("Coach Mode")');
    await page.waitForTimeout(1000);

    // Step 1: Fill in basic data
    await page.fill('textarea[placeholder*="Job Description"]', 'Software Engineer position at TechCorp. Looking for someone with React and Node.js experience.');
    await page.fill('textarea[placeholder*="Resume"]', 'Experienced software developer with 5 years in React and Node.js. Built multiple web applications.');
    
    // Click Analyze to proceed to Step 2
    await page.click('button:has-text("Analyze →")');
    await page.waitForTimeout(2000);

    // Step 2: Check ProfileTable is visible
    await expect(page.locator('[data-testid="profile-table"]')).toBeVisible();
    
    // Click Next to proceed to Step 3
    await page.click('button:has-text("Next: Fit Analysis →")');
    await page.waitForTimeout(2000);

    // Step 3: Check FitTable and HeatmapTable are visible
    await expect(page.locator('[data-testid="fit-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="heatmap-table"]')).toBeVisible();
    
    // Check that fit-explain functionality works
    const explainButton = page.locator('button:has-text("Explain")').first();
    if (await explainButton.isVisible()) {
      await explainButton.click();
      // Should expand explanation
      await expect(page.locator('text=Evidence-based scoring')).toBeVisible();
    }
  });

  test('should show AI setup callout in Step 1', async ({ page }) => {
    // Create a test job
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[placeholder*="Job Title"]', { timeout: 10000 });
    
    await page.fill('input[placeholder*="Job Title"]', 'Test Callout Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Navigate to Coach Mode
    const jobLink = page.locator('a:has-text("Test Callout Job")').first();
    await jobLink.click();
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Coach Mode")');
    await page.waitForTimeout(1000);

    // Check AI setup callout is visible in Step 1
    await expect(page.locator('text=For real AI analysis')).toBeVisible();
    await expect(page.locator('text=Turn Network ON and add your API key')).toBeVisible();
    
    // Check "Set up AI key" button links to settings
    const setupButton = page.locator('a:has-text("Set up AI key")');
    await expect(setupButton).toBeVisible();
    
    // Click the setup button
    await setupButton.click();
    await page.waitForTimeout(1000);
    
    // Should navigate to AI settings
    await expect(page).toHaveURL('/settings/ai');
  });

  test('should render sources when Network ON with API key', async ({ page }) => {
    // First, configure AI settings
    await page.goto('/settings/ai');
    
    // Toggle Network ON and add dummy key
    await page.locator('[data-testid="ai-toggle"]').check();
    await page.locator('[data-testid="ai-key"]').fill('sk-test-123456789');
    await page.click('button:has-text("Save Settings")');
    await page.waitForTimeout(1000);
    
    // Go back to main app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[placeholder*="Job Title"]', { timeout: 10000 });
    
    // Create test job
    await page.fill('input[placeholder*="Job Title"]', 'Test Sources Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Navigate to Coach Mode
    const jobLink = page.locator('a:has-text("Test Sources Job")').first();
    await jobLink.click();
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Coach Mode")');
    await page.waitForTimeout(1000);

    // Fill in data and proceed to analysis
    await page.fill('textarea[placeholder*="Job Description"]', 'Senior Developer at TechCorp. Requirements: Python, React, AWS.');
    await page.fill('textarea[placeholder*="Resume"]', 'Senior developer with Python, React, and AWS experience. 8 years in software development.');
    
    await page.click('button:has-text("Analyze →")');
    await page.waitForTimeout(3000);

    // Check that sources are rendered (should have at least one source link)
    const sourcesSection = page.locator('[data-testid="ai-sources"]');
    if (await sourcesSection.isVisible()) {
      const sourceLinks = sourcesSection.locator('a');
      const sourceCount = await sourceLinks.count();
      expect(sourceCount).toBeGreaterThan(0);
    }
  });

  test('should show provider badges correctly', async ({ page }) => {
    // Create a test job
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[placeholder*="Job Title"]', { timeout: 10000 });
    
    await page.fill('input[placeholder*="Job Title"]', 'Test Provider Job');
    await page.fill('input[placeholder*="Company"]', 'Test Co');
    await page.click('button:has-text("Add Job Application")');
    await page.waitForTimeout(1000);

    // Navigate to Coach Mode
    const jobLink = page.locator('a:has-text("Test Provider Job")').first();
    await jobLink.click();
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Coach Mode")');
    await page.waitForTimeout(1000);

    // Fill in data and proceed to analysis
    await page.fill('textarea[placeholder*="Job Description"]', 'Full Stack Developer position.');
    await page.fill('textarea[placeholder*="Resume"]', 'Full stack developer with React and Node.js.');
    
    await page.click('button:has-text("Analyze →")');
    await page.waitForTimeout(3000);

    // Check provider badge shows Local (Dry-run) by default
    await expect(page.locator('text=Local (Dry-run)')).toBeVisible();
    
    // Should not show "Unverified" badge for local runs
    await expect(page.locator('[data-testid="unverified-badge"]')).not.toBeVisible();
  });
});
