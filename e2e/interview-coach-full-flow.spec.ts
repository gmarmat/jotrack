import { test, expect } from '@playwright/test';
import {
  setupTestJobWithPrerequisites,
  cleanupTestJob,
  selectQuestions,
  draftAndScoreAnswer,
  draftHighQualityAnswer,
  completeThreeTalkTracks,
  completeFlowToCoreStories
} from './helpers/interview-coach-helpers';

/**
 * Interview Coach - Full Flow E2E Tests
 * Tests the complete user journey from entry to core stories extraction
 */
test.describe('Interview Coach - Full Flow', () => {
  let testJobId: string;
  
  test.beforeEach(async () => {
    // Setup complete test environment
    testJobId = await setupTestJobWithPrerequisites();
    console.log(`🧪 Test starting with job: ${testJobId}`);
  });
  
  test.afterEach(async ({ }, testInfo) => {
    // Cleanup test data (runs even on test failure)
    try {
      if (testJobId) {
        await cleanupTestJob(testJobId);
        console.log(`🧹 Test cleanup complete for ${testInfo.title}`);
      }
    } catch (error) {
      console.error(`⚠️ Cleanup failed (non-fatal):`, error);
    }
  });
  
  /**
   * IC-01: Entry Point Visibility
   * Verify Interview Coach entry point appears after job is marked as APPLIED
   */
  test('IC-01: Interview Coach entry point appears after applying', async ({ page }) => {
    await page.goto(`http://localhost:3001/jobs/${testJobId}`);
    
    // Verify entry banner visible (job is already APPLIED from setup)
    await expect(page.locator('text=🎯 Interview Scheduled?')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Master your 2-3 core stories')).toBeVisible();
    
    // Verify 3 persona buttons
    await expect(page.locator('button:has-text("Recruiter Screen")')).toBeVisible();
    await expect(page.locator('button:has-text("Hiring Manager")')).toBeVisible();
    await expect(page.locator('button:has-text("Peer / Panel")')).toBeVisible();
    
    console.log('✅ IC-01: Entry point visible');
  });
  
  /**
   * IC-02: Navigation to Interview Coach
   * Verify user can navigate to Interview Coach page via persona button
   */
  test('IC-02: Can navigate to Interview Coach page', async ({ page }) => {
    await page.goto(`http://localhost:3001/jobs/${testJobId}`);
    
    // Click Recruiter Screen button
    await page.locator('button:has-text("Recruiter Screen")').click();
    
    // Verify navigation
    await expect(page).toHaveURL(new RegExp(`/interview-coach/${testJobId}\\?type=recruiter`));
    
    // Verify page elements
    await expect(page.locator('h1:has-text("Interview Coach")')).toBeVisible();
    await expect(page.locator('text=Master 2-3 core stories')).toBeVisible();
    
    // Verify 5 tabs (use flexible text matching for dynamic counts)
    await expect(page.locator('button:has-text("Select Questions")')).toBeVisible();
    await expect(page.locator('button:has-text("Practice")')).toBeVisible();
    await expect(page.locator('button:has-text("Talk Tracks")')).toBeVisible();
    await expect(page.locator('button:has-text("Core Stories")')).toBeVisible();
    await expect(page.locator('button:has-text("Final Prep")')).toBeVisible();
    
    // Verify progress stats
    await expect(page.locator('text=0').first()).toBeVisible(); // 0 answers
    
    console.log('✅ IC-02: Navigation successful');
  });
  
  /**
   * IC-03: Question Selection Flow
   * Verify user can load, filter, and select interview questions
   */
  test('IC-03: Can select questions for practice', async ({ page }) => {
    await page.goto(`http://localhost:3001/interview-coach/${testJobId}?type=recruiter`);
    
    console.log('⏳ Waiting for questions to load...');
    // Wait for questions to load (generous timeout for data fetching)
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    
    // Verify questions loaded (should have 10 from seed)
    const questionItems = page.locator('[data-testid="question-item"]');
    const count = await questionItems.count();
    console.log(`✅ Found ${count} questions`);
    expect(count).toBeGreaterThanOrEqual(10);
    
    // Select 8 questions
    console.log('📝 Selecting 8 questions...');
    await selectQuestions(page, 8);
    
    // Verify selection count updated
    await expect(page.locator('text=8').first()).toBeVisible();
    await expect(page.locator('text=selected')).toBeVisible();
    
    // Verify helper message appears
    await expect(page.locator('text=You\'ve selected 8 questions')).toBeVisible();
    
    console.log('✅ IC-03: Question selection successful');
  });
  
  /**
   * IC-04: Draft Answer and Initial Scoring
   * Verify user can draft answer and receive AI score with feedback
   */
  test('IC-04: Can draft answer and receive score', async ({ page }) => {
    await page.goto(`http://localhost:3001/interview-coach/${testJobId}?type=recruiter`);
    
    // Select questions
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 10000 });
    await selectQuestions(page, 3);
    
    // Go to Practice tab
    await page.locator('button:has-text("Practice & Score")').click();
    
    // Select first question
    await page.locator('[data-testid="question-item"]').first().click();
    
    // Verify question loaded
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
    
    // Draft a weak answer (should score low)
    const weakAnswer = "I worked on a project. It was good. We made improvements.";
    await draftAndScoreAnswer(page, weakAnswer);
    
    // Verify score received
    await expect(page.locator('[data-testid="score-overall"]')).toBeVisible({ timeout: 15000 });
    
    // Verify score is low (< 50)
    const scoreText = await page.locator('[data-testid="score-overall"]').textContent();
    const score = parseInt(scoreText || '0');
    expect(score).toBeLessThan(50);
    
    // Verify breakdown visible
    await expect(page.locator('text=STAR')).toBeVisible();
    await expect(page.locator('text=Specificity')).toBeVisible();
    await expect(page.locator('text=Metrics')).toBeVisible();
    
    // Verify feedback sections
    await expect(page.locator('text=What\'s Missing')).toBeVisible();
    await expect(page.locator('text=Answer These to Improve')).toBeVisible();
    
    console.log(`✅ IC-04: Answer scored ${score}/100`);
  });
  
  /**
   * IC-05: Answer Follow-Ups and Improve Score
   * Verify user can answer follow-ups and see score improvement
   */
  test('IC-05: Can answer follow-ups and improve score', async ({ page }) => {
    await page.goto(`http://localhost:3001/interview-coach/${testJobId}?type=recruiter`);
    
    // Setup: Select questions and draft weak answer
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 10000 });
    await selectQuestions(page, 3);
    await page.locator('button:has-text("Practice & Score")').click();
    await page.locator('[data-testid="question-item"]').first().click();
    
    const weakAnswer = "I worked on microservices. It was challenging.";
    await draftAndScoreAnswer(page, weakAnswer);
    
    // Get initial score
    const initialScoreText = await page.locator('[data-testid="score-overall"]').textContent();
    const initialScore = parseInt(initialScoreText || '0');
    
    // Answer follow-ups
    const followUps = page.locator('[data-testid="followup-textarea"]');
    const followUpCount = await followUps.count();
    
    if (followUpCount > 0) {
      await followUps.nth(0).fill("The challenge was scaling to 100K users with limited infrastructure");
      await followUps.nth(1).fill("We reduced latency from 2000ms to 200ms (90% improvement)");
      
      if (followUpCount > 2) {
        await followUps.nth(2).fill("Team of 5 engineers, I was the tech lead");
      }
      
      // Click "Add to Answer & Re-score"
      await page.locator('button:has-text("Add to Answer & Re-score")').click();
      
      // Wait for new score
      await page.waitForTimeout(12000);
      
      // Verify score improved
      const newScoreText = await page.locator('[data-testid="score-overall"]').textContent();
      const newScore = parseInt(newScoreText || '0');
      
      expect(newScore).toBeGreaterThan(initialScore);
      
      console.log(`✅ IC-05: Score improved ${initialScore} → ${newScore}`);
    } else {
      console.log('⚠️ IC-05: No follow-ups generated (initial answer may have been too good)');
    }
  });
  
  /**
   * IC-06: Generate Talk Track
   * Verify user can generate STAR talk track when score ≥ 75
   */
  test('IC-06: Can generate talk track when score ≥ 75', async ({ page }) => {
    await page.goto(`http://localhost:3001/interview-coach/${testJobId}?type=recruiter`);
    
    // Setup: Select questions and draft high-quality answer
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 10000 });
    await selectQuestions(page, 3);
    await page.locator('button:has-text("Practice & Score")').click();
    await page.locator('[data-testid="question-item"]').first().click();
    
    await draftHighQualityAnswer(page);
    
    // Verify score ≥ 75
    const scoreText = await page.locator('[data-testid="score-overall"]').textContent();
    const score = parseInt(scoreText || '0');
    expect(score).toBeGreaterThanOrEqual(75);
    
    // Verify "Generate Talk Track" button appears
    await expect(page.locator('button:has-text("Generate STAR Talk Track")')).toBeVisible();
    
    // Click button
    await page.locator('button:has-text("Generate STAR Talk Track")').click();
    
    // Wait for generation (5-10 seconds)
    await expect(page.locator('text=Generating')).toBeVisible();
    await page.waitForTimeout(12000);
    
    // Verify confirmation appears
    await expect(page.locator('text=Talk Track Generated')).toBeVisible({ timeout: 3000 });
    
    console.log(`✅ IC-06: Talk track generated (score: ${score})`);
  });
  
  /**
   * IC-08: Extract Core Stories
   * Verify user can extract 2-3 core stories from multiple talk tracks
   */
  test('IC-08: Can extract 2-3 core stories from talk tracks', async ({ page }) => {
    await page.goto(`http://localhost:3001/interview-coach/${testJobId}?type=recruiter`);
    
    // Complete 3 talk tracks
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 10000 });
    await completeThreeTalkTracks(page);
    
    // Navigate to Core Stories tab
    await page.locator('button:has-text("Core Stories")').click();
    
    // Verify ready state
    await expect(page.locator('text=Ready to Extract Core Stories!')).toBeVisible();
    await expect(page.locator('text=You have 3 talk tracks ready')).toBeVisible();
    
    // Click extract button
    await page.locator('button:has-text("Extract Core Stories")').click();
    
    // Wait for extraction (8-15 seconds)
    await expect(page.locator('text=Extracting')).toBeVisible();
    await page.waitForTimeout(18000);
    
    // Verify stories displayed
    const stories = page.locator('[data-testid="core-story-card"]');
    const storyCount = await stories.count();
    
    expect(storyCount).toBeGreaterThanOrEqual(2);
    expect(storyCount).toBeLessThanOrEqual(3);
    
    // Verify story 1 has required fields
    const story1 = stories.first();
    await expect(story1.locator('[data-testid="story-title"]')).not.toBeEmpty();
    await expect(story1.locator('[data-testid="story-stat"]')).not.toBeEmpty();
    await expect(story1.locator('[data-testid="story-coverage"]')).toContainText(/\d+ question/);
    
    // Verify coverage analysis
    await expect(page.locator('text=% of your interview questions')).toBeVisible();
    
    console.log(`✅ IC-08: Extracted ${storyCount} core stories`);
  });
  
  /**
   * IC-10: Data Persistence Across Sessions
   * Verify all data persists after browser close/reopen
   */
  test('IC-10: Data persists across browser sessions', async ({ page, context }) => {
    await page.goto(`http://localhost:3001/interview-coach/${testJobId}?type=recruiter`);
    
    // Select questions and draft answer
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 10000 });
    await selectQuestions(page, 3);
    await page.locator('button:has-text("Practice & Score")').click();
    
    await page.locator('[data-testid="question-item"]').first().click();
    const testAnswer = "My test answer about system design with microservices";
    await page.locator('[data-testid="answer-textarea"]').fill(testAnswer);
    
    // Wait for auto-save
    await page.waitForTimeout(3000);
    
    // Close page and create new one (simulates closing browser)
    await page.close();
    const newPage = await context.newPage();
    
    // Navigate back to Interview Coach
    await newPage.goto(`http://localhost:3001/interview-coach/${testJobId}?type=recruiter`);
    await newPage.locator('button:has-text("Practice & Score")').click();
    await newPage.locator('[data-testid="question-item"]').first().click();
    
    // Verify data persisted
    const answerValue = await newPage.locator('[data-testid="answer-textarea"]').inputValue();
    expect(answerValue).toContain('My test answer');
    
    console.log('✅ IC-10: Data persisted across sessions');
  });
});

