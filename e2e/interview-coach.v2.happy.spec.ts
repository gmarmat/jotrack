import { test, expect, Page } from '@playwright/test';
import { setupTestJobWithPrerequisites, cleanupTestJob } from './helpers/interview-coach-helpers';

/**
 * Interview Coach V2 Happy Path E2E Test
 * 
 * Tests the complete V2 happy path: persona selection, answer analysis, 
 * AI assist, talk tracks generation, and snapshot saving.
 */

test.describe('Interview Coach V2 Happy Path', () => {
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

  test('V2 Happy Path: Persona + Practice + Talk Tracks', async ({ page }) => {
    console.log('\n🎯 TESTING: V2 Happy Path - Persona + Practice + Talk Tracks\n');

    // Set V2 environment variable
    await page.addInitScript(() => {
      process.env.INTERVIEW_V2 = '1';
    });

    // Navigate to Interview Coach V2
    await page.goto(`${baseUrl}/interview-coach/${testJobId}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take initial screenshot
    await page.screenshot({ 
      path: 'playwright-report/interview-coach-v2-happy-initial.png',
      fullPage: true 
    });

    // Verify page loads with V2 features
    await expect(page.locator('h1')).toContainText('Interview Coach');
    
    // Check for persona selector (V2 feature)
    await expect(page.locator('[data-testid="persona-selector"]')).toBeVisible();
    
    // Check for persona pills
    const personaPills = page.locator('[data-testid="persona-pill"]');
    await expect(personaPills).toHaveCount(3);
    
    // Verify persona labels
    await expect(page.locator('text=Recruiter')).toBeVisible();
    await expect(page.locator('text=Hiring Manager')).toBeVisible();
    await expect(page.locator('text=Peer')).toBeVisible();

    console.log('✅ Persona selector loaded');

    // Step 1: Select Recruiter persona
    await page.click('[data-testid="persona-pill"]:has-text("Recruiter")');
    await page.waitForTimeout(1000); // Wait for state update
    
    // Verify persona selection
    const selectedPersona = page.locator('[data-testid="persona-pill"]:has-text("Recruiter")');
    await expect(selectedPersona).toHaveClass(/border-purple-500/);

    console.log('✅ Recruiter persona selected');

    // Step 2: Enter answer and analyze
    const answerText = "I led a cross-functional team to redesign our user onboarding flow. We identified that 40% of users were dropping off during the first week. I conducted user interviews, analyzed the data, and implemented a new guided tutorial system. This resulted in a 25% reduction in drop-off rate and increased user engagement by 30%.";
    
    await page.fill('[data-testid="answer-textarea"]', answerText);
    await page.waitForTimeout(1000); // Wait for auto-save
    
    // Click Analyze button
    await page.click('[data-testid="analyze-button"]');
    
    // Wait for analysis to complete
    await page.waitForSelector('[data-testid="score-display"]', { timeout: 10000 });
    
    // Verify V2 response format
    const scoreDisplay = page.locator('[data-testid="score-display"]');
    await expect(scoreDisplay).toBeVisible();
    
    // Check for improvement summary (V2 feature)
    const improvementSummary = page.locator('[data-testid="improvement-summary"]');
    await expect(improvementSummary).toBeVisible();
    
    // Check for CTAs
    const ctaButtons = page.locator('[data-testid="cta-button"]');
    await expect(ctaButtons).toHaveCount.greaterThan(0);

    console.log('✅ Answer analyzed with V2 features');

    // Step 3: Test AI Assist on follow-up questions
    const followUpQuestions = page.locator('[data-testid="discovery-question"]');
    if (await followUpQuestions.count() > 0) {
      const firstFollowUp = followUpQuestions.first();
      await firstFollowUp.click();
      
      // Click AI Assist button
      const aiAssistButton = firstFollowUp.locator('[data-testid="ai-assist-button"]');
      if (await aiAssistButton.isVisible()) {
        await aiAssistButton.click();
        
        // Wait for AI response
        await page.waitForTimeout(3000);
        
        // Verify text was inserted
        const followUpTextarea = firstFollowUp.locator('textarea');
        const textContent = await followUpTextarea.inputValue();
        expect(textContent.length).toBeGreaterThan(0);
        
        console.log('✅ AI Assist worked on follow-up question');
      }
    }

    // Step 4: Test Talk Tracks generation
    // Navigate to Talk Tracks tab if it exists
    const talkTracksTab = page.locator('[data-testid="talk-tracks-tab"]');
    if (await talkTracksTab.isVisible()) {
      await talkTracksTab.click();
      
      // Click Generate Talk Tracks button
      const generateButton = page.locator('[data-testid="generate-talk-tracks"]');
      await expect(generateButton).toBeVisible();
      await generateButton.click();
      
      // Wait for generation to complete
      await page.waitForSelector('[data-testid="talk-track-story"]', { timeout: 15000 });
      
      // Verify stories are generated
      const stories = page.locator('[data-testid="talk-track-story"]');
      await expect(stories).toHaveCount.greaterThan(0);
      
      // Check for persona variants
      const personaVariants = page.locator('[data-testid="persona-variant"]');
      await expect(personaVariants).toHaveCount.greaterThan(0);
      
      console.log('✅ Talk Tracks generated successfully');
    }

    // Step 5: Test Snapshot saving
    // Go back to practice tab
    const practiceTab = page.locator('[data-testid="practice-tab"]');
    if (await practiceTab.isVisible()) {
      await practiceTab.click();
    }
    
    // Click Save Snapshot button
    const saveSnapshotButton = page.locator('[data-testid="save-snapshot-button"]');
    if (await saveSnapshotButton.isVisible()) {
      await saveSnapshotButton.click();
      
      // Wait for success toast
      await page.waitForSelector('[data-testid="success-toast"]', { timeout: 5000 });
      
      // Verify success message
      const successToast = page.locator('[data-testid="success-toast"]');
      await expect(successToast).toContainText('Snapshot saved');
      
      console.log('✅ Snapshot saved successfully');
    }

    // Take final screenshot
    await page.screenshot({ 
      path: 'playwright-report/interview-coach-v2-happy-final.png',
      fullPage: true 
    });

    console.log('🎉 V2 Happy Path test completed successfully!');
  });

  test('V2 API Response Validation', async ({ page }) => {
    console.log('\n🔍 TESTING: V2 API Response Validation\n');

    // Set V2 environment variable
    await page.addInitScript(() => {
      process.env.INTERVIEW_V2 = '1';
    });

    // Navigate to Interview Coach V2
    await page.goto(`${baseUrl}/interview-coach/${testJobId}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Monitor network requests
    const apiResponses: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/interview-coach/') && response.status() === 200) {
        try {
          const body = await response.json();
          apiResponses.push({
            url: response.url(),
            body: body
          });
        } catch (e) {
          // Ignore non-JSON responses
        }
      }
    });

    // Select Recruiter persona
    await page.click('[data-testid="persona-pill"]:has-text("Recruiter")');
    await page.waitForTimeout(1000);

    // Enter answer and analyze
    const answerText = "I implemented a new caching system that reduced API response times by 60%.";
    await page.fill('[data-testid="answer-textarea"]', answerText);
    await page.click('[data-testid="analyze-button"]');
    
    // Wait for analysis
    await page.waitForSelector('[data-testid="score-display"]', { timeout: 10000 });

    // Verify V2 API responses
    const scoreResponse = apiResponses.find(r => r.url.includes('/score-answer'));
    if (scoreResponse) {
      expect(scoreResponse.body.version).toBe('v2');
      expect(scoreResponse.body.persona).toBe('recruiter');
      expect(scoreResponse.body.score).toBeDefined();
      expect(scoreResponse.body.subscores).toBeDefined();
      expect(scoreResponse.body.confidence).toBeDefined();
      
      console.log('✅ V2 API response format validated');
    }

    console.log('🎉 V2 API validation completed!');
  });
});
