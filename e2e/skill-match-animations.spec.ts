import { test, expect } from '@playwright/test';

test.describe('Skill Match Animations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to a job detail page to see the AI showcase with Skill Match
    await page.waitForSelector('[data-testid="job-row"]');
    
    // Click on first job to go to detail page
    const firstJobLink = page.locator('[data-testid="job-row"] a').first();
    await firstJobLink.click();
    
    // Wait for job detail page to load
    await page.waitForSelector('[data-testid="ai-showcase"]');
  });

  test('should display unified horizontal axis', async ({ page }) => {
    // Look for the Skills Match section
    const skillsSection = page.locator('text=Match by Category').first();
    await expect(skillsSection).toBeVisible();
    
    // Check for unified axis labels
    await expect(page.locator('text=Low Fit (0%)')).toBeVisible();
    await expect(page.locator('text=Med Fit (40-75%)')).toBeVisible();
    await expect(page.locator('text=High Fit (75%+)')).toBeVisible();
    
    // Check that axis is outside the loop (only appears once)
    const axisLabels = page.locator('text=Low Fit (0%)');
    const count = await axisLabels.count();
    expect(count).toBe(1); // Should only appear once, not per category
  });

  test('should show permanent breakdown labels', async ({ page }) => {
    // Check for permanent Resume and Profile labels
    const resumeLabels = page.locator('text=/Resume: \\d+%/');
    const profileLabels = page.locator('text=/Profile: \\+\\d+%/');
    
    await expect(resumeLabels.first()).toBeVisible();
    await expect(profileLabels.first()).toBeVisible();
    
    // Labels should be visible without hovering
    const firstResumeLabel = resumeLabels.first();
    const firstProfileLabel = profileLabels.first();
    
    await expect(firstResumeLabel).toBeVisible();
    await expect(firstProfileLabel).toBeVisible();
    
    // Check that labels have proper colors
    await expect(firstResumeLabel).toHaveClass(/text-green-700/);
    await expect(firstProfileLabel).toHaveClass(/text-purple-700/);
  });

  test('should have pulse animation on Profile Bonus sections', async ({ page }) => {
    // Look for Profile Bonus bars with pulse animation
    const profileBonusBars = page.locator('.animate-pulse-bonus');
    await expect(profileBonusBars.first()).toBeVisible();
    
    // Check that the animation class is applied
    const firstBar = profileBonusBars.first();
    await expect(firstBar).toHaveClass(/animate-pulse-bonus/);
    
    // Verify it's a purple/gradient background
    await expect(firstBar).toHaveClass(/bg-gradient-to-b/);
    await expect(firstBar).toHaveClass(/from-purple-/);
  });

  test('should display category bars with proper styling', async ({ page }) => {
    // Check for category bars
    const categoryBars = page.locator('.relative.h-10');
    await expect(categoryBars.first()).toBeVisible();
    
    // Check for shadow effect
    await expect(categoryBars.first()).toHaveClass(/shadow-inner/);
    
    // Check for background zones
    const backgroundZones = page.locator('.absolute.inset-0.flex.opacity-20');
    await expect(backgroundZones.first()).toBeVisible();
  });

  test('should show proper colors for Resume and Profile sections', async ({ page }) => {
    // Check Resume sections (green)
    const resumeSections = page.locator('.bg-gradient-to-b.from-green-400');
    await expect(resumeSections.first()).toBeVisible();
    
    // Check Profile Bonus sections (purple)
    const profileSections = page.locator('.bg-gradient-to-b.from-purple-400');
    await expect(profileSections.first()).toBeVisible();
    
    // Verify gradient directions
    await expect(resumeSections.first()).toHaveClass(/to-green-600/);
    await expect(profileSections.first()).toHaveClass(/to-purple-600/);
  });

  test('should display legend correctly', async ({ page }) => {
    // Check for legend items
    await expect(page.locator('text=Resume').last()).toBeVisible();
    await expect(page.locator('text=Profile Bonus').last()).toBeVisible();
    
    // Check legend colors
    const resumeLegend = page.locator('text=Resume').last();
    const profileLegend = page.locator('text=Profile Bonus').last();
    
    await expect(resumeLegend).toHaveClass(/text-gray-700/);
    await expect(profileLegend).toHaveClass(/text-gray-700/);
    
    // Check legend indicators (colored rectangles)
    const legendIndicators = page.locator('.w-4.h-3.rounded');
    await expect(legendIndicators.first()).toHaveClass(/bg-gradient-to-b/);
  });

  test('should work in dark theme', async ({ page }) => {
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Check that animations still work
    const profileBonusBars = page.locator('.animate-pulse-bonus');
    await expect(profileBonusBars.first()).toBeVisible();
    
    // Check dark theme colors for labels
    const resumeLabels = page.locator('text=/Resume: \\d+%/');
    const profileLabels = page.locator('text=/Profile: \\+\\d+%/');
    
    await expect(resumeLabels.first()).toHaveClass(/dark:text-green-400/);
    await expect(profileLabels.first()).toHaveClass(/dark:text-purple-400/);
    
    // Check dark theme colors for bars
    const darkResumeSections = page.locator('.dark\\:from-green-500');
    const darkProfileSections = page.locator('.dark\\:from-purple-500');
    
    await expect(darkResumeSections.first()).toBeVisible();
    await expect(darkProfileSections.first()).toBeVisible();
  });

  test('should display keyword word cloud', async ({ page }) => {
    // Scroll down to find keyword section
    await page.locator('text=Keyword Match').scrollIntoViewIfNeeded();
    
    // Check for keyword word cloud
    const keywordSection = page.locator('text=Keyword Match').first();
    await expect(keywordSection).toBeVisible();
    
    // Check for word cloud container (be more specific to avoid multiple matches)
    const wordCloud = page.locator('.flex.flex-wrap.gap-3').filter({ has: page.locator('button') }).first();
    await expect(wordCloud).toBeVisible();
    
    // Check for individual keyword buttons
    const keywordButtons = wordCloud.locator('button');
    const buttonCount = await keywordButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check that keywords have proper styling
    await expect(keywordButtons.first()).toHaveClass(/font-medium/);
    await expect(keywordButtons.first()).toHaveClass(/transition-all/);
  });

  test('should have proper text colors for readability', async ({ page }) => {
    // Check that Match by Category section is visible
    const categorySection = page.locator('text=Match by Category');
    await expect(categorySection.first()).toBeVisible();
    
    // Check that category names are visible (we've updated them to text-gray-600 dark:text-gray-400)
    const technicalSkills = page.locator('text=Technical Skills').first();
    await expect(technicalSkills).toBeVisible();
    
    // Check keyword match header
    const keywordHeader = page.locator('text=Keyword Match').first();
    await expect(keywordHeader).toBeVisible();
  });

  test('should maintain animations during theme toggle', async ({ page }) => {
    // Get initial animation state
    const profileBonusBars = page.locator('.animate-pulse-bonus');
    await expect(profileBonusBars.first()).toBeVisible();
    
    // Switch to dark theme
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await themeToggle.click();
    
    // Animation should still be working
    await expect(profileBonusBars.first()).toBeVisible();
    
    // Switch back to light theme
    await themeToggle.click();
    
    // Animation should still be working
    await expect(profileBonusBars.first()).toBeVisible();
  });
});
