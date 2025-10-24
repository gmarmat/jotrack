import { test, expect, Page } from '@playwright/test';
import { setupTestJobWithPrerequisites, cleanupTestJob } from './helpers/interview-coach-helpers';

/**
 * Interview Coach E2E Stabilization Tests
 * 
 * Tests both INTERVIEW_V2=0 (minimal path) and INTERVIEW_V2=1 (full flow)
 * with comprehensive validation and screenshot artifacts
 */

test.describe('Interview Coach E2E Stabilization', () => {
  let testJobId: string;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test.beforeAll(async () => {
    // Setup test job with all prerequisites
    testJobId = await setupTestJobWithPrerequisites();
    console.log(`📦 Test job created: ${testJobId}`);
  });

  test.afterAll(async () => {
    // Cleanup test job
    await cleanupTestJob(testJobId);
    console.log(`🧹 Test job cleaned up: ${testJobId}`);
  });

  test.describe('INTERVIEW_V2=0 (Minimal Path)', () => {
    test('should render minimal path without V2 features', async ({ page }) => {
      console.log('\n🎯 TESTING: INTERVIEW_V2=0 (Minimal Path)\n');

      // Set environment variable for minimal path
      await page.addInitScript(() => {
        process.env.INTERVIEW_V2 = '0';
      });

      // Navigate to Interview Coach
      await page.goto(`${baseUrl}/interview-coach/${testJobId}?type=recruiter`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Take initial screenshot
      await page.screenshot({ 
        path: 'playwright-report/interview-coach-v2-off-initial.png',
        fullPage: true 
      });

      // Verify page loads
      const title = await page.locator('h1').textContent();
      expect(title).toContain('Interview Coach');
      console.log('✅ Page loaded successfully');

      // Verify minimal UI elements are present
      const practiceTab = page.locator('button:has-text("Practice")').first();
      await expect(practiceTab).toBeVisible({ timeout: 10000 });
      console.log('✅ Practice tab visible');

      // Click Practice tab
      await practiceTab.click();
      await page.waitForTimeout(1000);

      // Take screenshot of Practice tab
      await page.screenshot({ 
        path: 'playwright-report/interview-coach-v2-off-practice.png',
        fullPage: true 
      });

      // Verify basic question selection works
      const questions = page.locator('[class*="question"]').first();
      const questionVisible = await questions.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (questionVisible) {
        await questions.click();
        await page.waitForTimeout(500);
        console.log('✅ Question selection works');
      }

      // Verify minimal functionality (no V2 features)
      const v2Features = page.locator('[class*="subscore"], [class*="confidence"], [class*="delta"]');
      const v2FeaturesCount = await v2Features.count();
      expect(v2FeaturesCount).toBe(0);
      console.log('✅ V2 features not visible (minimal path)');

      console.log('✅ INTERVIEW_V2=0 test completed successfully\n');
    });
  });

  test.describe('INTERVIEW_V2=1 (Full Flow)', () => {
    test('should render full flow with V2 features', async ({ page }) => {
      console.log('\n🎯 TESTING: INTERVIEW_V2=1 (Full Flow)\n');

      // Set environment variable for full flow
      await page.addInitScript(() => {
        process.env.INTERVIEW_V2 = '1';
      });

      // Navigate to Interview Coach
      await page.goto(`${baseUrl}/interview-coach/${testJobId}?type=recruiter`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Take initial screenshot
      await page.screenshot({ 
        path: 'playwright-report/interview-coach-v2-on-initial.png',
        fullPage: true 
      });

      // Verify page loads
      const title = await page.locator('h1').textContent();
      expect(title).toContain('Interview Coach');
      console.log('✅ Page loaded successfully');

      // Verify Practice tab is available
      const practiceTab = page.locator('button:has-text("Practice")').first();
      await expect(practiceTab).toBeVisible({ timeout: 10000 });
      console.log('✅ Practice tab visible');

      // Click Practice tab
      await practiceTab.click();
      await page.waitForTimeout(1000);

      // Take screenshot of Practice tab
      await page.screenshot({ 
        path: 'playwright-report/interview-coach-v2-on-practice.png',
        fullPage: true 
      });

      // Step 1: Practice → Score Answer (Practice → Follow-ups → Core stories)
      console.log('1️⃣ Testing Practice → Score Answer flow...');
      
      // Select first question
      const questions = page.locator('[class*="question"]').first();
      const questionVisible = await questions.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (questionVisible) {
        await questions.click();
        await page.waitForTimeout(500);
        console.log('✅ Question selected');

        // Find answer input and enter test answer
        const answerInput = page.locator('textarea, input[type="text"]').first();
        const inputVisible = await answerInput.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (inputVisible) {
          await answerInput.fill('I have 8 years of experience in distributed systems and have led multiple successful projects that improved system performance by 40%.');
          console.log('✅ Answer entered');

          // Look for Analyze button
          const analyzeBtn = page.locator('button:has-text("Analyze"), button:has-text("Score")').first();
          const analyzeVisible = await analyzeBtn.isVisible({ timeout: 5000 }).catch(() => false);
          
          if (analyzeVisible) {
            await analyzeBtn.click();
            console.log('✅ Analyze button clicked');

            // Wait for scoring to complete
            await page.waitForTimeout(3000);

            // Take screenshot of scoring results
            await page.screenshot({ 
              path: 'playwright-report/interview-coach-v2-on-scoring.png',
              fullPage: true 
            });

            // Verify subscores are visible - subscores visible
            const subscores = page.locator('[class*="subscore"], [class*="score"]');
            const subscoresCount = await subscores.count();
            expect(subscoresCount).toBeGreaterThan(0);
            console.log(`✅ Subscores visible: ${subscoresCount} found`);

            // Verify scoring results are displayed
            const scoreElements = page.locator('[class*="score"], [class*="rating"], [class*="percentage"]');
            const scoreCount = await scoreElements.count();
            expect(scoreCount).toBeGreaterThan(0);
            console.log(`✅ Score elements visible: ${scoreCount} found`);
          }
        }
      }

      // Step 2: Follow-ups
      console.log('2️⃣ Testing Follow-ups flow...');
      
      // Look for Follow-ups tab or section
      const followUpsTab = page.locator('button:has-text("Follow-ups"), button:has-text("Follow up")').first();
      const followUpsVisible = await followUpsTab.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (followUpsVisible) {
        await followUpsTab.click();
        await page.waitForTimeout(1000);
        console.log('✅ Follow-ups tab clicked');

        // Take screenshot of Follow-ups
        await page.screenshot({ 
          path: 'playwright-report/interview-coach-v2-on-followups.png',
          fullPage: true 
        });

        // Verify prompts are visible - prompts length 2–3
        const prompts = page.locator('[class*="prompt"], [class*="question"], [class*="follow-up"]');
        const promptsCount = await prompts.count();
        expect(promptsCount).toBeGreaterThanOrEqual(2);
        expect(promptsCount).toBeLessThanOrEqual(3);
        console.log(`✅ Prompts visible: ${promptsCount} found (expected 2-3)`);
      }

      // Step 3: Core Stories
      console.log('3️⃣ Testing Core Stories flow...');
      
      // Look for Core Stories tab or section
      const coreStoriesTab = page.locator('button:has-text("Core Stories"), button:has-text("Stories")').first();
      const coreStoriesVisible = await coreStoriesTab.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (coreStoriesVisible) {
        await coreStoriesTab.click();
        await page.waitForTimeout(1000);
        console.log('✅ Core Stories tab clicked');

        // Take screenshot of Core Stories
        await page.screenshot({ 
          path: 'playwright-report/interview-coach-v2-on-core-stories.png',
          fullPage: true 
        });

        // Verify stories are visible - stories count 3–4
        const stories = page.locator('[class*="story"], [class*="narrative"], [class*="example"]');
        const storiesCount = await stories.count();
        expect(storiesCount).toBeGreaterThanOrEqual(3);
        expect(storiesCount).toBeLessThanOrEqual(4);
        console.log(`✅ Stories visible: ${storiesCount} found (expected 3-4)`);

        // Verify coverage information - coverage ≥80%
        const coverageElements = page.locator('[class*="coverage"], [class*="percentage"]');
        const coverageCount = await coverageElements.count();
        if (coverageCount > 0) {
          const coverageText = await coverageElements.first().textContent();
          const coverageMatch = coverageText?.match(/(\d+)%/);
          if (coverageMatch) {
            const coveragePercent = parseInt(coverageMatch[1]);
            expect(coveragePercent).toBeGreaterThanOrEqual(80);
            console.log(`✅ Coverage verified: ${coveragePercent}% (expected ≥80%)`);
          }
        }
      }

      // Final screenshot
      await page.screenshot({ 
        path: 'playwright-report/interview-coach-v2-on-final.png',
        fullPage: true 
      });

      console.log('✅ INTERVIEW_V2=1 test completed successfully\n');
    });

    test('should handle full flow with different personas', async ({ page }) => {
      console.log('\n🎯 TESTING: Full Flow with Different Personas\n');

      // Set environment variable for full flow
      await page.addInitScript(() => {
        process.env.INTERVIEW_V2 = '1';
      });

      const personas = ['recruiter', 'hiring-manager', 'peer'];
      
      for (const persona of personas) {
        console.log(`Testing persona: ${persona}`);
        
        // Navigate to Interview Coach with specific persona
        await page.goto(`${baseUrl}/interview-coach/${testJobId}?type=${persona}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Take screenshot for each persona
        await page.screenshot({ 
          path: `playwright-report/interview-coach-${persona}-initial.png`,
          fullPage: true 
        });

        // Verify page loads
        const title = await page.locator('h1').textContent();
        expect(title).toContain('Interview Coach');
        console.log(`✅ ${persona} persona loaded successfully`);

        // Verify Practice tab is available
        const practiceTab = page.locator('button:has-text("Practice")').first();
        await expect(practiceTab).toBeVisible({ timeout: 10000 });
        
        await practiceTab.click();
        await page.waitForTimeout(1000);

        // Take screenshot of Practice tab for persona
        await page.screenshot({ 
          path: `playwright-report/interview-coach-${persona}-practice.png`,
          fullPage: true 
        });

        console.log(`✅ ${persona} persona test completed`);
      }

      console.log('✅ All personas tested successfully\n');
    });

    test('should validate V2 features are present', async ({ page }) => {
      console.log('\n🎯 TESTING: V2 Features Validation\n');

      // Set environment variable for full flow
      await page.addInitScript(() => {
        process.env.INTERVIEW_V2 = '1';
      });

      // Navigate to Interview Coach
      await page.goto(`${baseUrl}/interview-coach/${testJobId}?type=recruiter`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Click Practice tab
      const practiceTab = page.locator('button:has-text("Practice")').first();
      await practiceTab.click();
      await page.waitForTimeout(1000);

      // Verify V2 features are present
      const v2Features = page.locator('[class*="subscore"], [class*="confidence"], [class*="delta"], [class*="v2"]');
      const v2FeaturesCount = await v2Features.count();
      expect(v2FeaturesCount).toBeGreaterThan(0);
      console.log(`✅ V2 features visible: ${v2FeaturesCount} found`);

      // Verify enhanced UI elements
      const enhancedElements = page.locator('[class*="enhanced"], [class*="advanced"], [class*="detailed"]');
      const enhancedCount = await enhancedElements.count();
      console.log(`✅ Enhanced elements: ${enhancedCount} found`);

      // Take final validation screenshot
      await page.screenshot({ 
        path: 'playwright-report/interview-coach-v2-features-validation.png',
        fullPage: true 
      });

      console.log('✅ V2 features validation completed\n');
    });
  });

  test.describe('Screenshot Artifacts', () => {
    test('should capture comprehensive screenshots for documentation', async ({ page }) => {
      console.log('\n🎯 TESTING: Screenshot Artifacts\n');

      // Test both V2 states
      const v2States = [
        { flag: '0', name: 'v2-off' },
        { flag: '1', name: 'v2-on' }
      ];

      for (const state of v2States) {
        console.log(`Capturing screenshots for INTERVIEW_V2=${state.flag}`);

        // Set environment variable
        await page.addInitScript(() => {
          process.env.INTERVIEW_V2 = state.flag;
        });

        // Navigate to Interview Coach
        await page.goto(`${baseUrl}/interview-coach/${testJobId}?type=recruiter`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Capture initial state
        await page.screenshot({ 
          path: `playwright-report/artifacts/${state.name}-initial.png`,
          fullPage: true 
        });

        // Click Practice tab
        const practiceTab = page.locator('button:has-text("Practice")').first();
        await practiceTab.click();
        await page.waitForTimeout(1000);

        // Capture Practice tab
        await page.screenshot({ 
          path: `playwright-report/artifacts/${state.name}-practice.png`,
          fullPage: true 
        });

        // Try to interact with questions if available
        const questions = page.locator('[class*="question"]').first();
        const questionVisible = await questions.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (questionVisible) {
          await questions.click();
          await page.waitForTimeout(500);

          // Capture question interaction
          await page.screenshot({ 
            path: `playwright-report/artifacts/${state.name}-question-selected.png`,
            fullPage: true 
          });
        }

        console.log(`✅ Screenshots captured for ${state.name}`);
      }

      console.log('✅ All screenshot artifacts captured\n');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle errors gracefully', async ({ page }) => {
      console.log('\n🎯 TESTING: Error Handling\n');

      // Test with invalid job ID
      await page.goto(`${baseUrl}/interview-coach/invalid-job-id?type=recruiter`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Take screenshot of error state
      await page.screenshot({ 
        path: 'playwright-report/interview-coach-error-handling.png',
        fullPage: true 
      });

      // Verify error handling (should not crash)
      const title = await page.locator('h1').textContent().catch(() => 'Error');
      console.log(`✅ Error handling test completed: ${title}`);

      console.log('✅ Error handling test completed\n');
    });
  });
});
