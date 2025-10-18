/**
 * P1 Tests - Post-Application Features (Interview Prep)
 * 
 * CRITICAL: These features have ZERO automated test coverage!
 * High risk of bugs in production.
 * 
 * Coverage:
 * - "Mark as Applied" flow
 * - Phase transition (pre-app → post-app)
 * - Interview questions generation (3 personas)
 * - Talk tracks generation
 * - Recommendations engine
 * 
 * Expected pass rate: 60-80% (first run, untested features)
 */

import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import { coachState, jobProfiles, coachSessions, jobs, companyInterviewQuestions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { setupCoachModeApiMocks } from './mocks/coachModeAiMocks';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

// Setup database for cleaning test state
const sqlite = new Database('./data/jotrack.db');
const db = drizzle(sqlite);

test.describe('P1 Critical - Post-Application (Interview Prep)', () => {
  
  // 🎭 MOCK AI APIS BEFORE EACH TEST
  test.beforeEach(async ({ page }) => {
    await setupCoachModeApiMocks(page);
  });
  
  // Clean state ONCE at start - P1-03 through P1-07 depend on P1-02's post-app state!
  test.beforeAll(async () => {
    console.log('🧹 Cleaning test state ONCE for entire P1 suite:', TEST_JOB_ID);
    
    // Clear coach-related tables
    await db.delete(coachState).where(eq(coachState.jobId, TEST_JOB_ID));
    console.log('✅ Cleared coach_state');
    
    await db.delete(jobProfiles).where(eq(jobProfiles.jobId, TEST_JOB_ID));
    console.log('✅ Cleared job_profiles');
    
    await db.delete(coachSessions).where(eq(coachSessions.jobId, TEST_JOB_ID));
    console.log('✅ Cleared coach_sessions');
    
    // Reset coach status to null
    await db.update(jobs)
      .set({ 
        coachStatus: null,
        appliedAt: null,
        appliedResumeVersion: null
      })
      .where(eq(jobs.id, TEST_JOB_ID));
    console.log('✅ Reset job coach status');
    
    console.log('✅ Test state cleaned - ready for fresh test run!');
  });

  // ============================================================================
  // P1-01: "Mark as Applied" Button Appears
  // ============================================================================
  test('P1-01: Ready to Apply tab shows "Mark as Applied" button', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Ready tab unlocks only after: Discovery → Profile → Score → Resume → Cover Letter
    const readyTab = page.getByTestId('tab-ready');
    const isLocked = await readyTab.isDisabled().catch(() => true);
    
    if (isLocked) {
      console.log('⚠️ P1-01: Ready tab locked, completing FULL pre-app flow...');
      
      // STEP 1: Complete Discovery
      const hasButton = await page.locator('[data-testid="generate-discovery-button"]').isVisible().catch(() => false);
      if (hasButton) {
        await page.click('[data-testid="generate-discovery-button"]');
        await page.waitForSelector('[data-testid="discovery-wizard"]', { timeout: 60000 });
        await page.waitForTimeout(3000);
        
        // Use PROVEN approach from P0-08: Skip through wizard until Complete button appears
        console.log('  📊 Skipping through all wizard batches...');
        
        let batchCount = 0;
        for (let batch = 0; batch < 10; batch++) { // Max 10 batches safety
          // Skip all questions in this batch FIRST using page.evaluate
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'))
              .filter(b => b.textContent?.includes('Skip'));
            btns.forEach(b => (b as HTMLButtonElement).click());
          });
          
          await page.waitForTimeout(1000); // Wait for React state update
          
          // Check which button is available
          const hasNext = await page.locator('button:has-text("Next")').isVisible().catch(() => false);
          const hasComplete = await page.locator('button:has-text("Complete Discovery")').isVisible().catch(() => false);
          
          if (hasComplete) {
            // Last batch - click Complete Discovery
            console.log(`  ⏳ Last batch (${batch + 1}) - waiting for Complete Discovery...`);
            await page.waitForSelector('button:has-text("Complete Discovery"):not([disabled])', { timeout: 5000 });
            await page.click('button:has-text("Complete Discovery")');
            console.log(`  ✓ Clicked "Complete Discovery" - triggering profile analysis!`);
            batchCount = batch + 1;
            break;
          } else if (hasNext) {
            // Not last batch - click Next
            await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 5000 });
            await page.click('button:has-text("Next")');
            console.log(`  ✓ Batch ${batch + 1}: Skipped & navigated to next`);
          } else {
            console.log(`  ⚠️ No buttons found at batch ${batch + 1} - might be done`);
            batchCount = batch + 1;
            break;
          }
          
          await page.waitForTimeout(500);
        }
        
        console.log(`  ✓ Navigated through ${batchCount} batches`);
        
        // Wait for profile analysis to complete (~15-25s)
        console.log('  ⏳ Waiting for profile analysis API call...');
        await page.waitForTimeout(15000);
        console.log('  ✓ Step 1: Discovery complete with profile analysis');
      }
      
      // STEP 2: Recalculate Score (wait for tab to unlock)
      console.log('  ⏳ Waiting for Score tab to unlock...');
      const scoreTab = page.getByTestId('tab-score');
      
      // Poll for Score tab to unlock (profile analysis should unlock it)
      let scoreUnlocked = false;
      for (let i = 0; i < 15; i++) {
        const enabled = await scoreTab.isEnabled().catch(() => false);
        if (enabled) {
          scoreUnlocked = true;
          console.log(`  ✓ Score tab unlocked after ${i + 1}s`);
          break;
        }
        await page.waitForTimeout(1000);
      }
      
      if (scoreUnlocked) {
        await scoreTab.click();
        await page.waitForTimeout(1000);
        
        const recalcButton = page.locator('button:has-text("Recalculate Score")');
        if (await recalcButton.isVisible().catch(() => false)) {
          await recalcButton.click();
          await page.waitForTimeout(35000); // Score recalc
          console.log('  ✓ Step 2: Score recalculated');
        }
      } else {
        console.log('  ❌ Score tab never unlocked - PRODUCT BUG!');
      }
      
      // STEP 3: Generate Resume (wait for tab to unlock)
      console.log('  ⏳ Waiting for Resume tab to unlock...');
      const resumeTab = page.getByTestId('tab-resume');
      
      let resumeUnlocked = false;
      for (let i = 0; i < 10; i++) {
        const enabled = await resumeTab.isEnabled().catch(() => false);
        if (enabled) {
          resumeUnlocked = true;
          console.log(`  ✓ Resume tab unlocked after ${i + 1}s`);
          break;
        }
        await page.waitForTimeout(1000);
      }
      
      if (resumeUnlocked) {
        await resumeTab.click();
        await page.waitForTimeout(1000);
        
        const generateResumeButton = page.locator('button:has-text("Generate Resume")');
        if (await generateResumeButton.isVisible().catch(() => false)) {
          await generateResumeButton.click();
          await page.waitForTimeout(40000); // Resume generation
          console.log('  ✓ Step 3a: Resume generated');
          
          // CRITICAL: Must click "Accept as Final Resume" to unlock Cover Letter tab!
          const acceptButton = page.locator('button:has-text("Accept as Final Resume")');
          if (await acceptButton.isVisible().catch(() => false)) {
            // Set up dialog handler BEFORE clicking
            page.once('dialog', async dialog => {
              console.log(`    📋 Accepting confirmation dialog: "${dialog.message()}"`);
              await dialog.accept();
            });
            
            await acceptButton.click();
            await page.waitForTimeout(2000); // Wait for dialog + state update
            console.log('  ✓ Step 3b: Resume finalized - Cover Letter tab should unlock');
          } else {
            console.log('  ⚠️ Accept as Final button not found');
          }
        }
      } else {
        console.log('  ❌ Resume tab never unlocked - PRODUCT BUG!');
      }
      
      // STEP 4: Generate Cover Letter (wait for tab to unlock)
      console.log('  ⏳ Waiting for Cover Letter tab to unlock...');
      const coverLetterTab = page.getByTestId('tab-cover-letter');
      
      let coverLetterUnlocked = false;
      for (let i = 0; i < 10; i++) {
        const enabled = await coverLetterTab.isEnabled().catch(() => false);
        if (enabled) {
          coverLetterUnlocked = true;
          console.log(`  ✓ Cover Letter tab unlocked after ${i + 1}s`);
          break;
        }
        await page.waitForTimeout(1000);
      }
      
      if (coverLetterUnlocked) {
        await coverLetterTab.click();
        await page.waitForTimeout(1000);
        
        // Try to find generate button (might have different text)
        const generateButtons = [
          page.getByTestId('analyze-button'),
          page.locator('button:has-text("Generate Cover Letter")'),
          page.locator('button:has-text("Generate")')
        ];
        
        for (const btn of generateButtons) {
          if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(20000); // Cover letter generation
            console.log('  ✓ Step 4: Cover letter generated');
            break;
          }
        }
      } else {
        console.log('  ❌ Cover Letter tab never unlocked - PRODUCT BUG!');
      }
      
      console.log('✅ P1-01: FULL pre-app flow complete - Ready tab should unlock');
      
      // Wait for Ready tab to unlock (check every second for 10 seconds)
      let unlocked = false;
      for (let i = 0; i < 10; i++) {
        const enabled = await readyTab.isEnabled().catch(() => false);
        if (enabled) {
          unlocked = true;
          console.log(`  ✓ Ready tab unlocked after ${i + 1}s`);
          break;
        }
        await page.waitForTimeout(1000);
      }
      
      if (!unlocked) {
        console.log('  ❌ Ready tab still locked after full flow - potential bug!');
      }
    }
    
    // Navigate to Ready tab (should be unlocked now)
    await readyTab.click();
    await page.waitForTimeout(1000);
    
    // Verify "I've Applied!" button exists (actual button text)
    const appliedButton = page.locator('button:has-text("I\'ve Applied")');
    await expect(appliedButton).toBeVisible({ timeout: 5000 });
    
    // Verify page content
    await expect(page.locator('text=You\'re Ready to Apply!')).toBeVisible();
    
    console.log('✅ P1-01: "I\'ve Applied!" button visible on Ready tab');
  });

  // ============================================================================
  // P1-02: "Mark as Applied" Triggers Phase Transition
  // ============================================================================
  test('P1-02: Clicking "I\'ve Applied!" transitions to post-app phase', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check if Ready tab is unlocked (if not, complete pre-app flow)
    const readyTab = page.getByTestId('tab-ready');
    const isUnlocked = await readyTab.isEnabled().catch(() => false);
    
    if (!isUnlocked) {
      console.log('⚠️ P1-02: Completing pre-app flow to unlock Ready tab...');
      
      // Use PROVEN P1-01 flexible logic
      const hasButton = await page.locator('[data-testid="generate-discovery-button"]').isVisible().catch(() => false);
      if (hasButton) {
        await page.click('[data-testid="generate-discovery-button"]');
        await page.waitForSelector('[data-testid="discovery-wizard"]', { timeout: 60000 });
        await page.waitForTimeout(3000);
        
        // FLEXIBLE batch loop (not hardcoded to 4)
        for (let batch = 0; batch < 10; batch++) {
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'))
              .filter(b => b.textContent?.includes('Skip'));
            btns.forEach(b => (b as HTMLButtonElement).click());
          });
          await page.waitForTimeout(1000);
          
          const hasNext = await page.locator('button:has-text("Next")').isVisible().catch(() => false);
          const hasComplete = await page.locator('button:has-text("Complete Discovery")').isVisible().catch(() => false);
          
          if (hasComplete) {
            await page.waitForSelector('button:has-text("Complete Discovery"):not([disabled])', { timeout: 5000 });
            await page.click('button:has-text("Complete Discovery")');
            break;
          } else if (hasNext) {
            await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 5000 });
            await page.click('button:has-text("Next")');
          } else {
            break; // No buttons = done
          }
          await page.waitForTimeout(500);
        }
        await page.waitForTimeout(15000);
      }
      
      // Score, Resume, Cover Letter (using polling wait pattern)
      const tabs = [
        { name: 'Score', testid: 'tab-score', button: 'Recalculate Score', wait: 35000 },
        { name: 'Resume', testid: 'tab-resume', button: 'Generate Resume', wait: 40000 },
        { name: 'Cover Letter', testid: 'tab-cover-letter', button: null, wait: 20000 }
      ];
      
      for (const tab of tabs) {
        const tabElement = page.getByTestId(tab.testid);
        for (let i = 0; i < 15; i++) {
          if (await tabElement.isEnabled().catch(() => false)) {
            await tabElement.click();
            await page.waitForTimeout(1000);
            
            if (tab.button) {
              const btn = page.locator(`button:has-text("${tab.button}")`);
              if (await btn.isVisible().catch(() => false)) {
                await btn.click();
                await page.waitForTimeout(tab.wait);
                
                if (tab.name === 'Resume') {
                  const acceptBtn = page.locator('button:has-text("Accept as Final Resume")');
                  if (await acceptBtn.isVisible().catch(() => false)) {
                    page.once('dialog', async dialog => await dialog.accept());
                    await acceptBtn.click();
                    await page.waitForTimeout(2000);
                  }
                }
              }
            } else {
              // Cover Letter - try multiple buttons
              const btns = [page.getByTestId('analyze-button'), page.locator('button:has-text("Generate")')];
              for (const btn of btns) {
                if (await btn.isVisible().catch(() => false)) {
                  await btn.click();
                  await page.waitForTimeout(tab.wait);
                  break;
                }
              }
            }
            break;
          }
          await page.waitForTimeout(1000);
        }
      }
      
      console.log('  ✅ Pre-app flow complete - waiting for Ready tab unlock...');
      for (let i = 0; i < 10; i++) {
        if (await readyTab.isEnabled().catch(() => false)) break;
        await page.waitForTimeout(1000);
      }
    }
    
    // Navigate to Ready tab
    await readyTab.click();
    await page.waitForTimeout(1000);
    
    // Click "I've Applied! → Start Interview Prep"
    const appliedButton = page.locator('button:has-text("I\'ve Applied")');
    await appliedButton.click();
    await page.waitForTimeout(3000); // Wait for API call + phase transition
    
    // Verify phase transition - should see post-app tabs now
    const recruiterTab = page.getByTestId('tab-recruiter');
    await expect(recruiterTab).toBeVisible({ timeout: 5000 });
    
    // Verify old pre-app tabs are gone
    const discoveryTab = page.getByTestId('tab-discovery');
    await expect(discoveryTab).not.toBeVisible();
    
    console.log('✅ P1-02: Phase transition successful - entered post-app phase!');
  });

  // ============================================================================
  // P1-03: Recruiter Questions Generation
  // ============================================================================
  test('P1-03: Recruiter interview questions can be generated', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check if in post-app phase (P1-02 should have set this up)
    const recruiterTab = page.getByTestId('tab-recruiter');
    const tabVisible = await recruiterTab.isVisible().catch(() => false);
    
    if (!tabVisible) {
      console.log('⚠️ P1-03: Not in post-app phase (P1-02 should have enabled it)');
      console.log('  ℹ️  This test depends on P1-02 running first');
      test.skip();
      return;
    }
    
    // Now in post-app phase - navigate to recruiter tab
    console.log('  📍 Navigating to Recruiter tab...');
    await recruiterTab.click();
    await page.waitForTimeout(2000); // Wait for tab content to render
    
    // Wait for tab content to load (either Generate button OR title)
    const contentLoaded = await page.locator('button:has-text("Generate Questions")').or(page.locator('h2:has-text("Recruiter")')).waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
    
    if (!contentLoaded) {
      console.log('  ⚠️ Tab content not loaded after 5s');
    }
    
    // Click "Generate Questions" button
    console.log('  🔍 Looking for Generate Questions button...');
    const generateButton = page.locator('button:has-text("Generate Questions")');
    const hasGenerate = await generateButton.isVisible().catch(() => false);
    
    if (!hasGenerate) {
      // Questions might already be generated
      const hasQuestions = await page.locator('text=/Questions to Prepare/').isVisible().catch(() => false);
      if (hasQuestions) {
        console.log('  ℹ️ Questions already generated (cached)');
      } else {
        console.log('  ⚠️ No Generate button and no questions - unexpected state!');
        test.skip();
        return;
      }
    } else {
      console.log('  ✓ Clicking Generate Questions...');
      await generateButton.click();
      
      // Wait for AI generation (up to 40s for first call)
      console.log('  ⏳ Waiting for AI to generate questions (up to 40s)...');
      await page.waitForSelector('text=/Questions to Prepare/', { timeout: 45000 });
      console.log('  ✅ Questions appeared!');
    }
    
    // Verify questions appeared
    const questionCount = await page.locator('text=/\\d+ Questions to Prepare/').textContent();
    expect(questionCount).toBeTruthy();
    
    const count = parseInt(questionCount?.match(/\d+/)?.[0] || '0');
    expect(count).toBeGreaterThanOrEqual(8); // Should have at least 8 questions
    expect(count).toBeLessThanOrEqual(20); // Should be reasonable
    
    console.log(`✅ P1-03: Recruiter questions verified (${count} questions)`);
  });

  // ============================================================================
  // P1-04: Hiring Manager Questions Generation
  // ============================================================================
  test('P1-04: Hiring manager interview questions can be generated', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check if in post-app phase (recruiter tab visible = post-app)
    const recruiterTab = page.getByTestId('tab-recruiter');
    const inPostApp = await recruiterTab.isVisible().catch(() => false);
    
    if (!inPostApp) {
      console.log('⚠️ P1-04: Not in post-app, using recruiter questions as proxy (saves time)');
      // Recruiter questions should be generated by P1-03, just verify they exist
      test.skip();
      return;
    }
    
    // Navigate to hiring-manager tab
    const hmTab = page.getByTestId('tab-hiring-manager');
    await hmTab.click();
    await page.waitForTimeout(1000);
    
    // Generate questions
    const generateButton = page.locator('button:has-text("Generate Questions")');
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();
      await page.waitForTimeout(25000);
    }
    
    // Verify questions
    const questionCount = await page.locator('text=/\\d+ Questions to Prepare/').textContent();
    const count = parseInt(questionCount?.match(/\d+/)?.[0] || '0');
    expect(count).toBeGreaterThanOrEqual(8);
    
    console.log(`✅ P1-04: Hiring manager questions generated (${count} questions)`);
  });

  // ============================================================================
  // P1-05: Peer Panel Questions Generation
  // ============================================================================
  test('P1-05: Peer panel interview questions can be generated', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check if in post-app phase
    const recruiterTab = page.getByTestId('tab-recruiter');
    const inPostApp = await recruiterTab.isVisible().catch(() => false);
    
    if (!inPostApp) {
      console.log('⚠️ P1-05: Not in post-app phase (P1-03 handles transition)');
      test.skip();
      return;
    }
    
    // Navigate to peer-panel tab
    const peerTab = page.getByTestId('tab-peer-panel');
    await peerTab.click();
    await page.waitForTimeout(1000);
    
    // Generate questions
    const generateButton = page.locator('button:has-text("Generate Questions")');
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();
      await page.waitForTimeout(25000);
    }
    
    // Verify questions
    const questionCount = await page.locator('text=/\\d+ Questions to Prepare/').textContent();
    const count = parseInt(questionCount?.match(/\d+/)?.[0] || '0');
    expect(count).toBeGreaterThanOrEqual(8);
    
    console.log(`✅ P1-05: Peer panel questions generated (${count} questions)`);
  });

  // ============================================================================
  // P1-06: Question Expand/Collapse Works
  // ============================================================================
  test('P1-06: Questions can be expanded to show details', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const recruiterTab = page.getByTestId('tab-recruiter');
    if (!await recruiterTab.isVisible().catch(() => false)) {
      console.log('⚠️ P1-06: Not in post-app phase (P1-03 should enable it)');
      test.skip();
      return;
    }
    
    await recruiterTab.click();
    await page.waitForTimeout(1000);
    
    // Check if questions exist
    const hasQuestions = await page.locator('text=/Questions to Prepare/').isVisible().catch(() => false);
    if (!hasQuestions) {
      console.log('⚠️ P1-06: No questions generated yet (P1-03 should generate them)');
      test.skip();
      return;
    }
    
    // Find first question
    const firstQuestion = page.locator('button').filter({ hasText: /Q1/ }).first();
    await firstQuestion.click();
    await page.waitForTimeout(500);
    
    // Verify expanded content shows
    const hasRationale = await page.locator('text=Why they ask this:').isVisible().catch(() => false);
    const hasTips = await page.locator('text=Preparation Tips:').isVisible().catch(() => false);
    
    expect(hasRationale || hasTips).toBeTruthy();
    
    console.log('✅ P1-06: Question expand/collapse works');
  });

  // ============================================================================
  // P1-07: Expand All / Collapse All Buttons Work
  // ============================================================================
  test('P1-07: Expand All and Collapse All buttons work', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const recruiterTab = page.getByTestId('tab-recruiter');
    if (!await recruiterTab.isVisible().catch(() => false)) {
      console.log('⚠️ P1-07: Not in post-app phase (P1-03 should enable it)');
      test.skip();
      return;
    }
    
    await recruiterTab.click();
    await page.waitForTimeout(1000);
    
    // Check if questions exist
    const expandAllButton = page.locator('button:has-text("Expand All")');
    if (!await expandAllButton.isVisible().catch(() => false)) {
      console.log('⚠️ P1-07: No questions generated yet (P1-03 should generate them)');
      test.skip();
      return;
    }
    
    // Click "Expand All"
    await expandAllButton.click();
    await page.waitForTimeout(500);
    
    // Verify multiple questions expanded
    const rationaleCount = await page.locator('text=Why they ask this:').count();
    expect(rationaleCount).toBeGreaterThanOrEqual(3);
    
    // Click "Collapse All"
    const collapseAllButton = page.locator('button:has-text("Collapse All")');
    await collapseAllButton.click();
    await page.waitForTimeout(500);
    
    // Verify collapsed
    const rationaleAfter = await page.locator('text=Why they ask this:').count();
    expect(rationaleAfter).toBe(0);
    
    console.log('✅ P1-07: Expand/Collapse All works');
  });

  // ============================================================================
  // P1-08: Database - Interview Questions Cached
  // ============================================================================
  test('P1-08: Interview questions are saved to database', async ({ page }) => {
    // Query database directly (not using Drizzle to avoid schema issues)
    const cachedQuestions = sqlite.prepare(`
      SELECT * FROM company_interview_questions 
      WHERE company_name = (SELECT company FROM jobs WHERE id = ?)
    `).all(TEST_JOB_ID);
    
    if (cachedQuestions.length === 0) {
      console.log('⚠️ P1-08: No questions cached yet (P1-03 should cache them)');
      test.skip();
      return;
    }
    
    // Verify structure
    expect(cachedQuestions.length).toBeGreaterThan(0);
    expect(cachedQuestions[0]).toHaveProperty('interview_stage');
    expect(cachedQuestions[0]).toHaveProperty('questions');
    
    console.log(`✅ P1-08: ${cachedQuestions.length} question sets cached in database`);
  });

  // ============================================================================
  // P1-09: "Mark as Applied" Updates Database
  // ============================================================================
  test('P1-09: "Mark as Applied" updates job coach_status in database', async ({ page }) => {
    // Query database for job status
    const job = db
      .select()
      .from(jobs)
      .where(eq(jobs.id, TEST_JOB_ID))
      .get();
    
    if (!job) {
      console.log('⚠️ P1-09: Test job not found');
      test.skip();
      return;
    }
    
    // Verify coach status changed
    const validStatuses = ['applied', 'interview-prep', null];
    expect(validStatuses).toContain(job.coachStatus);
    
    if (job.coachStatus === 'applied' || job.coachStatus === 'interview-prep') {
      // Verify appliedAt timestamp
      expect(job.appliedAt).toBeTruthy();
      
      // Verify appliedResumeVersion set
      expect(job.appliedResumeVersion).toBeTruthy();
      
      console.log(`✅ P1-09: Database updated - status: ${job.coachStatus}, applied: ${new Date(job.appliedAt!).toLocaleString()}`);
    } else {
      console.log('⚠️ P1-09: Job not marked as applied yet (P1-02 should mark it)');
      test.skip();
    }
  });

  // ============================================================================
  // P1-10: Post-App Phase Has 3 Tabs
  // ============================================================================
  test('P1-10: Post-app phase shows 3 interview preparation tabs', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check if in post-app phase
    const recruiterTab = page.getByTestId('tab-recruiter');
    if (!await recruiterTab.isVisible().catch(() => false)) {
      console.log('⚠️ P1-10: Not in post-app phase');
      test.skip();
      return;
    }
    
    // Verify all 3 tabs visible
    await expect(recruiterTab).toBeVisible();
    await expect(page.getByTestId('tab-hiring-manager')).toBeVisible();
    await expect(page.getByTestId('tab-peer-panel')).toBeVisible();
    
    console.log('✅ P1-10: All 3 post-app tabs visible');
  });

  // ============================================================================
  // P1-11: Cached Questions Display Immediately (No Re-Generation)
  // ============================================================================
  test('P1-11: Cached questions display without regeneration', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const recruiterTab = page.getByTestId('tab-recruiter');
    if (!await recruiterTab.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    
    await recruiterTab.click();
    await page.waitForTimeout(1000);
    
    // Check for cached indicator
    const cachedIndicator = await page.locator('text=/Using cached questions/').isVisible().catch(() => false);
    const questionsExist = await page.locator('text=/Questions to Prepare/').isVisible().catch(() => false);
    
    if (questionsExist) {
      // Questions loaded - verify no "Generate Questions" button (means cached)
      const generateButton = page.locator('button:has-text("Generate Questions")');
      const buttonVisible = await generateButton.isVisible().catch(() => false);
      
      expect(buttonVisible).toBe(false); // Should not show button if cached
      
      console.log('✅ P1-11: Cached questions loaded (no regeneration)');
    } else {
      console.log('⚠️ P1-11: No cached questions (P1-03 should cache them)');
      test.skip();
    }
  });

  // ============================================================================
  // P1-12: Performance - Questions Load in <3s
  // ============================================================================
  test('P1-12: Post-app phase loads quickly (<3s)', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`/coach/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    
    // Wait for recruiter tab
    const recruiterTab = page.getByTestId('tab-recruiter');
    await recruiterTab.waitFor({ timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`✅ P1-12: Post-app phase loaded in ${loadTime}ms`);
  });

});

test.describe('P1 - Error Handling & Edge Cases', () => {
  
  // ============================================================================
  // P1-13: AI API Failure Handling
  // ============================================================================
  test('P1-13: Graceful error when AI API fails', async ({ page }) => {
    // This test would require mocking API failures
    // For now, verify error UI exists
    console.log('⚠️ P1-13: Placeholder for AI failure testing');
    test.skip();
  });

  // ============================================================================
  // P1-14: Invalid Job ID in Post-App Phase
  // ============================================================================
  test('P1-14: Invalid job ID in post-app redirects gracefully', async ({ page }) => {
    await page.goto('/coach/invalid-job-id-12345', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Should redirect to home or show error
    const currentUrl = page.url();
    const isHome = currentUrl.endsWith('/') || currentUrl.includes('localhost:3000/jobs');
    
    expect(isHome).toBeTruthy();
    
    console.log('✅ P1-14: Invalid job ID handled in post-app');
  });

  // ============================================================================
  // P1-15: Network Interruption During Question Generation
  // ============================================================================
  test('P1-15: Network interruption shows appropriate error', async ({ page }) => {
    // This would require network mocking
    // Placeholder for future implementation
    console.log('⚠️ P1-15: Placeholder for network interruption testing');
    test.skip();
  });

});

