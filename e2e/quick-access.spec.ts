import { test, expect, Page } from '@playwright/test';

test.describe('Quick Access to Normalized Variants', () => {
  test('should enable Quick Access buttons after Analyze All', async ({ page }) => {
    // Navigate to a job page (assuming job exists)
    await page.goto('/jobs/test-job-id');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="qa-resume-ai"]');
    await page.waitForSelector('[data-testid="qa-jd-ai"]');
    
    // Initially buttons should be disabled
    const resumeButton = page.locator('[data-testid="qa-resume-ai"]');
    const jdButton = page.locator('[data-testid="qa-jd-ai"]');
    
    await expect(resumeButton).toBeDisabled();
    await expect(jdButton).toBeDisabled();
    
    // Click Analyze All button
    const analyzeButton = page.locator('button:has-text("Analyze All")');
    await analyzeButton.click();
    
    // Wait for buttons to become enabled (with timeout)
    await expect(resumeButton).toBeEnabled({ timeout: 10000 });
    await expect(jdButton).toBeEnabled({ timeout: 10000 });
    
    // Click the Resume (AI) button and verify it opens normalized file
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      resumeButton.click()
    ]);
    
    // Verify the popup URL contains the stream endpoint
    await expect(popup.url()).toContain('/api/files/stream?path=');
    
    // Close the popup
    await popup.close();
    
    // Click the JD (AI) button and verify it opens normalized file
    const [popup2] = await Promise.all([
      page.waitForEvent('popup'),
      jdButton.click()
    ]);
    
    // Verify the popup URL contains the stream endpoint
    await expect(popup2.url()).toContain('/api/files/stream?path=');
    
    // Close the popup
    await popup2.close();
  });
  
  test('should show building state while loading', async ({ page }) => {
    await page.goto('/jobs/test-job-id');
    
    // Wait for buttons to be present
    await page.waitForSelector('[data-testid="qa-resume-ai"]');
    
    const resumeButton = page.locator('[data-testid="qa-resume-ai"]');
    
    // Check tooltip shows building state
    await resumeButton.hover();
    await expect(page.locator('[title*="Building"]')).toBeVisible();
  });
});
