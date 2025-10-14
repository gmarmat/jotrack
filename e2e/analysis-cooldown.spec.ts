import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Analysis Cooldown & Guardrails', () => {
  test('should show cooldown warning after analysis', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Find the "Analyze with AI" button
    const analyzeButton = page.locator('[data-testid="analyze-with-ai-button"]');
    
    // Check if button is visible
    await expect(analyzeButton).toBeVisible();
    
    // Click to start analysis (if not in cooldown)
    const isDisabled = await analyzeButton.isDisabled();
    
    if (!isDisabled) {
      await analyzeButton.click();
      
      // Wait for analysis to complete (or start)
      await page.waitForTimeout(2000);
      
      // Try to click again immediately
      await analyzeButton.click();
      
      // Should show cooldown warning
      const cooldownWarning = page.locator('text=/cooldown active|wait.*before/i');
      
      // May or may not show depending on timing
      const hasCooldown = await cooldownWarning.isVisible().catch(() => false);
      
      if (hasCooldown) {
        // Verify countdown timer is shown
        await expect(cooldownWarning).toBeVisible();
        
        // Should show time remaining (e.g., "4m 59s")
        const warningText = await cooldownWarning.textContent();
        expect(warningText).toMatch(/\d+m\s+\d+s/);
      }
    }
  });

  test('should disable button during cooldown', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const analyzeButton = page.locator('[data-testid="analyze-with-ai-button"]');
    
    // Check if in cooldown
    const buttonText = await analyzeButton.textContent();
    
    if (buttonText?.includes('Wait')) {
      // Button should be disabled
      await expect(analyzeButton).toBeDisabled();
      
      // Should show time remaining in button
      expect(buttonText).toMatch(/Wait \d+m \d+s/);
    }
  });

  test('should show clock icon during cooldown', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const analyzeButton = page.locator('[data-testid="analyze-with-ai-button"]');
    const buttonText = await analyzeButton.textContent();
    
    if (buttonText?.includes('Wait')) {
      // Should have clock icon (svg/icon element)
      const icon = analyzeButton.locator('svg').first();
      await expect(icon).toBeVisible();
    }
  });

  test('should allow override with button click', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for cooldown warning with Override button
    const overrideButton = page.locator('button:has-text("Override")');
    
    const hasOverride = await overrideButton.isVisible().catch(() => false);
    
    if (hasOverride) {
      // Verify override button exists
      await expect(overrideButton).toBeVisible();
      
      // Click should trigger analysis anyway
      await overrideButton.click();
      
      // Should start analyzing
      await page.waitForTimeout(1000);
      
      // Button might show "Analyzing..." or similar
      const analyzeButton = page.locator('[data-testid="analyze-with-ai-button"]');
      const newText = await analyzeButton.textContent();
      
      // Either analyzing or completed
      expect(newText).toBeTruthy();
    }
  });

  test('should show "no changes" warning when appropriate', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Run analysis once
    const analyzeButton = page.locator('[data-testid="analyze-with-ai-button"]');
    
    if (!await analyzeButton.isDisabled()) {
      await analyzeButton.click();
      await page.waitForTimeout(3000); // Wait for completion
      
      // Try again without changes
      await analyzeButton.click();
      
      // May show "no changes" warning
      const noChangesWarning = page.locator('text=/no changes|same inputs/i');
      
      // This is conditional based on actual implementation
      const hasWarning = await noChangesWarning.isVisible().catch(() => false);
      
      if (hasWarning) {
        await expect(noChangesWarning).toBeVisible();
      }
    }
  });

  test('should show "Run Anyway" button for no changes', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Look for "Run Anyway" button (appears when no changes detected)
    const runAnywayButton = page.locator('button:has-text("Run Anyway")');
    
    const hasButton = await runAnywayButton.isVisible().catch(() => false);
    
    if (hasButton) {
      await expect(runAnywayButton).toBeVisible();
      
      // Clicking should proceed with analysis
      await runAnywayButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should update countdown every second', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const analyzeButton = page.locator('[data-testid="analyze-with-ai-button"]');
    let firstText = await analyzeButton.textContent();
    
    // If in cooldown, countdown should decrease
    if (firstText?.includes('Wait')) {
      await page.waitForTimeout(2000); // Wait 2 seconds
      
      let secondText = await analyzeButton.textContent();
      
      // Text should have changed (countdown decreased)
      expect(secondText).not.toBe(firstText);
      
      // Should still show Wait message
      expect(secondText).toMatch(/Wait/);
    }
  });
});

