import { test, expect } from '@playwright/test';

test('V2 entry button opens V2 coach and returns v2 score payload', async ({ page }) => {
  const jobId = process.env.SEED_JOB_ID || '3957289b-30f5-4ab2-8006-3a08b6630beb';
  
  // Navigate to job page
  await page.goto(`http://localhost:3000/jobs/${jobId}`);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Button visible only in V2 mode
  const btn = page.getByRole('link', { name: 'Open Interview Coach V2' });
  await expect(btn).toBeVisible();
  
  // Click the V2 button
  await btn.click();
  
  // Assert URL is correct
  await expect(page).toHaveURL(new RegExp(`/interview-coach/${jobId}$`));
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Assert V2 badge is visible
  const v2Badge = page.locator('text=V2').first();
  await expect(v2Badge).toBeVisible();
  
  // Wait for the practice workspace to load (skip welcome/search steps)
  await page.waitForSelector('[data-testid="answer-practice-workspace"]', { timeout: 10000 }).catch(() => {
    // If practice workspace not found, try to navigate through the flow
    console.log('Practice workspace not found, navigating through flow...');
  });
  
  // Look for answer input field
  const answerInput = page.locator('textarea[placeholder*="answer"], textarea[placeholder*="story"], input[placeholder*="answer"]').first();
  await expect(answerInput).toBeVisible({ timeout: 10000 });
  
  // Type an answer
  await answerInput.fill('I led a migration that reduced P95 latency by 38% and improved system reliability. This involved coordinating with 5 teams across 3 time zones and managing a $2M budget.');
  
  // Look for score button
  const scoreButton = page.locator('button:has-text("Score"), button:has-text("Test"), button:has-text("Submit")').first();
  await expect(scoreButton).toBeVisible();
  
  // Intercept the score-answer API call
  const scoreResponsePromise = page.waitForResponse(
    response => response.url().includes(`/api/interview-coach/${jobId}/score-answer`) && response.status() === 200,
    { timeout: 30000 }
  );
  
  // Click the score button
  await scoreButton.click();
  
  // Wait for the API response
  const response = await scoreResponsePromise;
  const json = await response.json();
  
  // Assert v2 response format
  expect(json.version).toBe('v2');
  expect(json.subscores).toBeDefined();
  expect(json.flags).toBeDefined();
  
  console.log('✅ V2 entry flow test passed - score response includes version:v2');
});

test('V2 button hidden in legacy mode', async ({ page }) => {
  const jobId = process.env.SEED_JOB_ID || '3957289b-30f5-4ab2-8006-3a08b6630beb';
  
  // Navigate to job page
  await page.goto(`http://localhost:3000/jobs/${jobId}`);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // V2 button should not be visible in legacy mode
  const btn = page.getByRole('link', { name: 'Open Interview Coach V2' });
  await expect(btn).not.toBeVisible();
  
  console.log('✅ Legacy mode test passed - V2 button is hidden');
});

test('V2 badge not shown in legacy mode', async ({ page }) => {
  const jobId = process.env.SEED_JOB_ID || '3957289b-30f5-4ab2-8006-3a08b6630beb';
  
  // Navigate directly to interview coach page
  await page.goto(`http://localhost:3000/interview-coach/${jobId}`);
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // V2 badge should not be visible in legacy mode
  const v2Badge = page.locator('text=V2').first();
  await expect(v2Badge).not.toBeVisible();
  
  console.log('✅ Legacy mode badge test passed - V2 badge is hidden');
});
