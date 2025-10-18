import { test, expect } from '@playwright/test';
import { db } from '../db/client';
import { jobs, jobProfiles, coachSessions } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * P0 CRITICAL TESTS - Coach Mode
 * 
 * These tests MUST PASS before shipping.
 * If any fail, it's a blocker.
 * 
 * Total: 15 tests
 * Runtime: ~15 minutes
 */

// Test job ID (reuse existing job with match score)
const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('P0 Critical - Coach Mode', () => {
  
  test('P0-01: Entry card appears when match score exists', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Let data load
    
    // Entry card should be visible
    const entryCard = page.getByTestId('coach-mode-entry-card');
    await expect(entryCard).toBeVisible();
    
    // Should have "Enter Coach Mode" button
    await expect(page.getByTestId('enter-coach-mode')).toBeVisible();
    
    console.log('✅ P0-01: Entry card visible');
  });

  test('P0-02: Performance - Coach Mode loads in <2s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000); // <2s
    console.log(`✅ P0-02: Coach Mode loaded in ${loadTime}ms`);
  });

  test('P0-03: Enter Coach Mode navigates successfully', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.click('[data-testid="enter-coach-mode"]');
    
    // Should navigate to Coach Mode page
    await expect(page).toHaveURL(`/coach/${TEST_JOB_ID}`);
    
    // Should see Coach Mode header
    await expect(page.getByTestId('coach-mode-header')).toContainText('Coach Mode');
    
    console.log('✅ P0-03: Navigation successful');
  });

  test('P0-04: Discovery questions generate (15-16 count)', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    
    await page.click('[data-testid="generate-discovery-button"]');
    
    // Wait for AI generation (generous timeout)
    await page.waitForSelector('[data-testid="discovery-wizard"]', { timeout: 45000 });
    
    // Check question count
    const totalText = await page.locator('text=/\\d+ total questions/').textContent();
    const count = parseInt(totalText?.match(/\\d+/)?.[0] || '0');
    
    expect(count).toBeGreaterThanOrEqual(15);
    expect(count).toBeLessThanOrEqual(18);
    
    console.log(`✅ P0-04: ${count} questions generated`);
  });

  test('P0-05: Can type answer in textarea', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.click('[data-testid="generate-discovery-button"]');
    await page.waitForSelector('[data-testid="discovery-wizard"]', { timeout: 45000 });
    
    // Type in first textarea
    const testAnswer = 'TEST: Led team of 5 engineers, reduced API time by 75%';
    await page.getByRole('textbox').first().fill(testAnswer);
    
    // Verify it appears
    await expect(page.getByRole('textbox').first()).toHaveValue(testAnswer);
    
    console.log('✅ P0-05: Can type in textarea');
  });

  test('P0-06: Auto-save triggers within 3 seconds', async ({ page, context }) => {
    // Listen for console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Auto-saved')) {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.click('[data-testid="generate-discovery-button"]');
    await page.waitForSelector('[data-testid="discovery-wizard"]', { timeout: 45000 });
    
    // Type answer
    await page.getByRole('textbox').first().fill('Short answer for auto-save test');
    
    // Wait for auto-save (2s debounce + 1s buffer)
    await page.waitForTimeout(3500);
    
    // Check console log
    expect(consoleLogs.length).toBeGreaterThan(0);
    expect(consoleLogs[0]).toContain('Auto-saved');
    
    // Check UI indicator
    await expect(page.locator('text=Auto-saved')).toBeVisible();
    
    console.log('✅ P0-06: Auto-save triggered');
  });

  test('P0-07: 🌟 MOST CRITICAL - Page refresh preserves answers', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.click('[data-testid="generate-discovery-button"]');
    await page.waitForSelector('[data-testid="discovery-wizard"]', { timeout: 45000 });
    
    // Answer Q1 with specific text
    const testAnswer = 'PERSISTENCE TEST: At CloudTech I led team of 5 engineers reducing API from 800ms to 200ms';
    await page.getByRole('textbox').first().fill(testAnswer);
    
    // Wait for auto-save
    await page.waitForSelector('text=Auto-saved', { timeout: 5000 });
    
    // Verify word count before refresh
    const wordCountBefore = await page.locator('text=/\\d+ \\/ 500 words/').first().textContent();
    expect(wordCountBefore).toContain('17 / 500 words');
    
    // REFRESH PAGE
    console.log('🔄 Refreshing page to test persistence...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Let data load
    
    // VERIFY ANSWER PERSISTED
    const input = page.getByRole('textbox').first();
    await expect(input).toHaveValue(/PERSISTENCE TEST/);
    await expect(input).toHaveValue(/800ms to 200ms/);
    
    // Verify word count persisted
    await expect(page.locator('text=17 / 500 words')).toBeVisible();
    
    // Verify auto-saved indicator
    await expect(page.locator('text=Auto-saved')).toBeVisible();
    
    // Verify progress count
    await expect(page.locator('text=1 answered, 0 skipped')).toBeVisible();
    
    console.log('✅ P0-07: 🌟 PERSISTENCE VERIFIED - Answer survived refresh!');
  });

  test('P0-08: Complete discovery triggers profile analysis', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.click('[data-testid="generate-discovery-button"]');
    await page.waitForSelector('[data-testid="discovery-wizard"]', { timeout: 45000 });
    
    // Skip through all batches quickly
    for (let batch = 0; batch < 4; batch++) {
      // Skip all questions in batch
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'))
          .filter(b => b.textContent?.includes('Skip'));
        btns.forEach(b => (b as HTMLButtonElement).click());
      });
      
      await page.waitForTimeout(500);
      
      // Click Next or Complete
      if (batch < 3) {
        await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 3000 });
        await page.click('button:has-text("Next")');
      } else {
        await page.waitForSelector('button:has-text("Complete Discovery"):not([disabled])', { timeout: 3000 });
        await page.click('button:has-text("Complete Discovery")');
      }
      
      await page.waitForTimeout(1000);
    }
    
    // Wait for profile analysis to complete (~25s)
    await page.waitForSelector('[data-testid="tab-score"]:not([disabled])', { timeout: 40000 });
    
    // Verify Discovery tab has checkmark
    const discoveryTab = page.getByTestId('tab-discovery');
    await expect(discoveryTab.locator('img')).toBeVisible(); // Checkmark icon
    
    console.log('✅ P0-08: Profile analysis completed');
  });

  test('P0-09: Profile analysis saves to database', async ({ page }) => {
    // This test assumes P0-08 has run and created a profile
    
    // Query database directly
    const profiles = await db
      .select()
      .from(jobProfiles)
      .where(eq(jobProfiles.jobId, TEST_JOB_ID))
      .limit(1);
    
    expect(profiles.length).toBe(1);
    expect(profiles[0].profileData).toBeTruthy();
    
    // Parse profile data
    const profileData = JSON.parse(profiles[0].profileData!);
    expect(profileData).toHaveProperty('extractedSkills');
    expect(profileData).toHaveProperty('profileCompleteness');
    
    console.log(`✅ P0-09: Profile saved (${profiles[0].profileData?.length} bytes)`);
  });

  test('P0-10: Score recalculation works (API returns success)', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Navigate to Score tab (assuming profile exists from previous tests)
    const scoreTab = page.getByTestId('tab-score');
    
    // If locked, skip this test (profile doesn't exist yet)
    const isDisabled = await scoreTab.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }
    
    await scoreTab.click();
    
    // Click Recalculate
    await page.click('button:has-text("Recalculate Score")');
    
    // Wait for recalculation (~25s)
    await page.waitForSelector('text=/\\d+%/', { timeout: 40000 });
    
    // Verify score displayed (should be 70-85%)
    const scoreText = await page.locator('text=/\\d+%/').first().textContent();
    const score = parseInt(scoreText?.match(/\\d+/)?.[0] || '0');
    
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(85);
    
    console.log(`✅ P0-10: Score recalculated to ${score}%`);
  });

  test('P0-11: Tab unlocking - Discovery → Score → Resume', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check initial state
    const discoveryTab = page.getByTestId('tab-discovery');
    const scoreTab = page.getByTestId('tab-score');
    const resumeTab = page.getByTestId('tab-resume');
    
    // If profile exists (from previous tests), tabs might already be unlocked
    const scoreDisabled = await scoreTab.isDisabled();
    
    if (!scoreDisabled) {
      // Profile exists - verify Score and Resume unlocking
      await expect(scoreTab).not.toBeDisabled();
      
      // Check if score has been recalculated
      const scoreHasCheckmark = await scoreTab.locator('img').isVisible().catch(() => false);
      
      if (scoreHasCheckmark) {
        // Score complete - Resume should be unlocked
        await expect(resumeTab).not.toBeDisabled();
        console.log('✅ P0-11: All tabs unlocked (profile exists)');
      } else {
        console.log('✅ P0-11: Score unlocked, Resume locked (correct state)');
      }
    } else {
      // Fresh state - only Discovery should be unlocked
      await expect(discoveryTab).not.toBeDisabled();
      await expect(scoreTab).toBeDisabled();
      await expect(resumeTab).toBeDisabled();
      console.log('✅ P0-11: Only Discovery unlocked (fresh state)');
    }
  });

  test('P0-12: Resume generation works (split-view appears)', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const resumeTab = page.getByTestId('tab-resume');
    
    // Skip if Resume tab locked
    const isDisabled = await resumeTab.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }
    
    await resumeTab.click();
    
    // Check if resume already generated
    const hasEditor = await page.locator('text=Resume Editor').isVisible().catch(() => false);
    
    if (!hasEditor) {
      // Generate resume
      await page.click('button:has-text("Generate Resume")');
      await page.waitForTimeout(35000); // AI generation
    }
    
    // Verify split-view editor
    await expect(page.locator('text=AI-Optimized Resume')).toBeVisible();
    await expect(page.locator('text=Your Edits')).toBeVisible();
    
    // Verify has content
    const aiResume = await page.locator('text=AI-Optimized Resume').locator('..').textContent();
    expect(aiResume?.length || 0).toBeGreaterThan(500);
    
    console.log('✅ P0-12: Split-view resume editor displayed');
  });

  test('P0-13: Cover letter generates', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const coverLetterTab = page.getByTestId('tab-cover-letter');
    
    // Skip if locked
    const isDisabled = await coverLetterTab.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }
    
    await coverLetterTab.click();
    
    // Check if already generated
    const hasLetter = await page.locator('text=/Dear Hiring Manager/i').isVisible().catch(() => false);
    
    if (!hasLetter) {
      // Generate
      await page.getByTestId('analyze-button').click();
      await page.waitForTimeout(15000); // AI generation
    }
    
    // Verify cover letter present
    await expect(page.locator('text=/Dear Hiring Manager/i')).toBeVisible();
    await expect(page.locator('text=/Sincerely/i')).toBeVisible();
    
    // Verify word count badge
    await expect(page.locator('text=/\\d+ words/')).toBeVisible();
    
    console.log('✅ P0-13: Cover letter generated');
  });

  test('P0-14: Navigation - Coach Mode → Job Page → Coach Mode', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    
    // Go back to job page
    await page.click('button:has(svg)'); // Back button (has ArrowLeft icon)
    await page.waitForTimeout(1000);
    
    // Should be on job page
    await expect(page).toHaveURL(/\/jobs\//);
    
    // Navigate back to Coach Mode
    await page.click('[data-testid="enter-coach-mode"]');
    
    // Should return to Coach Mode
    await expect(page).toHaveURL(/\/coach\//);
    await expect(page.getByTestId('coach-mode-header')).toBeVisible();
    
    console.log('✅ P0-14: Bidirectional navigation works');
  });

  test('P0-15: Invalid job ID redirects gracefully', async ({ page }) => {
    const invalidId = '00000000-0000-0000-0000-000000000000';
    
    // Attempt to access Coach Mode with invalid ID
    await page.goto(`/coach/${invalidId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Should redirect to home or show error
    const currentUrl = page.url();
    const isHome = currentUrl.endsWith('/') || currentUrl.includes('localhost:3000/jobs');
    
    expect(isHome).toBeTruthy();
    
    console.log('✅ P0-15: Invalid ID handled gracefully');
  });
});

test.describe('P0 Critical - Regression (Existing App)', () => {
  
  test('P0-16: Job list page loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Should see job list or "+ New Job" button
    const hasNewButton = await page.locator('text=/New Job/i').isVisible();
    const hasJobCards = await page.locator('[data-testid^="job-card"]').count() > 0;
    
    expect(hasNewButton || hasJobCards).toBeTruthy();
    
    console.log('✅ P0-16: Job list loaded');
  });

  test('P0-17: Job detail page loads', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Should see job title
    await expect(page.locator('h1')).toBeVisible();
    
    // Should see company name
    await expect(page.locator('text=/Fortive/i')).toBeVisible();
    
    // Should see status pipeline
    await expect(page.locator('text=On Radar')).toBeVisible();
    
    console.log('✅ P0-17: Job detail page loaded');
  });

  test('P0-18: Match Score section displays', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Let AI sections load
    
    // Find Match Score section
    await expect(page.locator('text=Match Score')).toBeVisible();
    
    // Should have Analyze button
    const analyzeBtn = page.locator('button:has-text("Analyze Match Score")');
    await expect(analyzeBtn).toBeVisible();
    
    console.log('✅ P0-18: Match Score section displays');
  });

  test('P0-19: Can navigate back to job list', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    
    // Find and click back link
    await page.click('text=← Back to list');
    await page.waitForTimeout(1000);
    
    // Should be on job list
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
    
    console.log('✅ P0-19: Back to list works');
  });

  test('P0-20: Theme toggle works', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Find theme toggle button
    const themeBtn = page.locator('button:has-text("Switch to")');
    const initialText = await themeBtn.textContent();
    
    // Click to toggle
    await themeBtn.click();
    await page.waitForTimeout(500);
    
    // Text should change
    const newText = await themeBtn.textContent();
    expect(newText).not.toBe(initialText);
    
    console.log('✅ P0-20: Theme toggle works');
  });
});

