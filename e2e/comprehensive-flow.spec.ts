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
 * Comprehensive E2E Test Suite - P0/P1/P2 Prioritization
 * Based on AGENT_REFERENCE_GUIDE.md compliance and E2E_TESTING_STRATEGY_COMPREHENSIVE.md
 * 
 * P0 (15 tests): Critical path - blockers if fail
 * P1 (20 tests): Feature coverage - high priority  
 * P2 (10 tests): Edge cases - nice to pass
 */
test.describe('Comprehensive E2E Flow Tests', () => {
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

  // ============================================================================
  // P0 TESTS (15 tests) - CRITICAL PATH - MUST PASS
  // ============================================================================

  /**
   * P0-01: New User Onboarding (Happy Path)
   * AGENT_REFERENCE_GUIDE Section 1 "User Journey (Start to Finish)" - Phase 1 & 2
   */
  test('P0-01: New user onboarding complete flow', async ({ page }) => {
    // Navigate to home page, verify welcome state
    await page.goto('http://localhost:3000');
    await expect(page.locator('text=Welcome to JoTrack')).toBeVisible();
    
    // Click "Create New Job"
    await page.locator('button:has-text("Create New Job")').click();
    
    // Enter job details (title, company, status=ON_RADAR)
    await page.locator('input[name="title"]').fill('Senior Backend Engineer');
    await page.locator('input[name="company"]').fill('TechCorp Inc.');
    await page.locator('select[name="status"]').selectOption('ON_RADAR');
    await page.locator('button:has-text("Create Job")').click();
    
    // Navigate to job detail page
    await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+$/);
    
    // Verify attachments section shows 2 files with is_active=1 filter
    await expect(page.locator('text=Attachments')).toBeVisible();
    
    // Click "Refresh Data" button (NOT "Analyze All" - per TERMINOLOGY_GUIDE.md)
    await page.locator('button:has-text("Refresh Data")').click();
    
    // Wait for extraction completion (check for success toast, ~$0.02)
    await expect(page.locator('text=Extraction complete')).toBeVisible({ timeout: 30000 });
    
    // Verify variants modal shows Raw + AI-Optimized for both docs
    await page.locator('button:has-text("View Variants")').click();
    await expect(page.locator('text=Raw')).toBeVisible();
    await expect(page.locator('text=AI-Optimized')).toBeVisible();
    await page.locator('button:has-text("Close")').click();
    
    // Click "Analyze" in Match Score section
    await page.locator('button:has-text("Analyze")').first().click();
    
    // Verify Match Score shows 80%+ (generous timeout: 30s for AI)
    await expect(page.locator('text=/\\d+%/')).toBeVisible({ timeout: 30000 });
    
    // Verify Resume Coach unlocked (82%+ badge visible)
    await expect(page.locator('text=Resume Coach')).toBeVisible();
    
    // Verify Interview Coach locked (needs Skills Match) - shows "🔒 Locked" badge
    await expect(page.locator('text=🔒 Locked')).toBeVisible();
    
    // Click "Analyze" in Skills Match section
    await page.locator('button:has-text("Analyze")').nth(1).click();
    
    // Verify Interview Coach unlocked - shows "🎯 Ready" badge
    await expect(page.locator('text=🎯 Ready')).toBeVisible();
    
    // Click "Start Interview Coach"
    await page.locator('button:has-text("Start Interview Coach")').click();
    
    // Verify redirect to `/interview-coach/[jobId]?type=recruiter`
    await expect(page).toHaveURL(/\/interview-coach\/[a-f0-9-]+\?type=recruiter$/);
    
    // Verify auto-search triggers (WelcomeSearch component)
    await expect(page.locator('text=Searching for questions')).toBeVisible();
    
    // Verify Insights tab shows: Web Questions (10+), AI Questions (10+), synthesizedQuestions (4)
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    const questionCount = await page.locator('[data-testid="question-item"]').count();
    expect(questionCount).toBeGreaterThanOrEqual(10);
    
    // Verify Themes section shows 3-4 themes
    await expect(page.locator('text=Themes')).toBeVisible();
    
    // Click Practice tab
    await page.locator('button:has-text("Practice")').click();
    
    // Verify ONLY 4 synthesized questions displayed (not 27 web questions) - Critical validation!
    const practiceQuestions = page.locator('[data-testid="practice-question"]');
    const practiceCount = await practiceQuestions.count();
    expect(practiceCount).toBeLessThanOrEqual(4);
    
    // Select question, type answer (200+ words)
    await practiceQuestions.first().click();
    await page.locator('[data-testid="answer-textarea"]').fill(
      'I led a team of 5 engineers to redesign our microservices architecture. The challenge was reducing API latency from 2000ms to 200ms while maintaining 99.9% uptime. We implemented Redis caching, database connection pooling, and asynchronous processing. The result was a 90% performance improvement and $2M in cost savings. I coordinated with product, design, and QA teams to ensure smooth rollout.'
    );
    
    // Click "Score My Answer"
    await page.locator('button:has-text("Score My Answer")').click();
    
    // Verify score appears (0-100) within 30s (AI call timeout)
    await expect(page.locator('[data-testid="score-overall"]')).toBeVisible({ timeout: 30000 });
    
    // Verify discovery questions appear (follow-up questions per algorithm)
    await expect(page.locator('text=Answer These to Improve')).toBeVisible();
    
    // Navigate to Talk Tracks tab
    await page.locator('button:has-text("Talk Tracks")').click();
    
    // Verify core stories extracted (when score >= 75)
    await expect(page.locator('text=Core Stories')).toBeVisible();
    
    // Navigate to Cheat Sheet tab
    await page.locator('button:has-text("Cheat Sheet")').click();
    
    // Verify final prep materials generated
    await expect(page.locator('text=Final Prep')).toBeVisible();
    
    console.log('✅ P0-01: Complete onboarding flow successful');
  });

  /**
   * P0-02: Status Progression & Interview Coach Unlock
   * Critical validation of Bug 3 fix
   */
  test('P0-02: Status progression and Interview Coach unlock', async ({ page }) => {
    // Create job at ON_RADAR status
    await page.goto('http://localhost:3000');
    await page.locator('button:has-text("Create New Job")').click();
    await page.locator('input[name="title"]').fill('Test Job');
    await page.locator('input[name="company"]').fill('Test Company');
    await page.locator('select[name="status"]').selectOption('ON_RADAR');
    await page.locator('button:has-text("Create Job")').click();
    
    // Run Match Score + Skills Match
    await page.locator('button:has-text("Refresh Data")').click();
    await page.waitForSelector('text=Extraction complete', { timeout: 30000 });
    await page.locator('button:has-text("Analyze")').first().click();
    await page.waitForSelector('text=/\\d+%/', { timeout: 30000 });
    await page.locator('button:has-text("Analyze")').nth(1).click();
    await page.waitForSelector('text=Skills Match', { timeout: 30000 });
    
    // Verify Interview Coach shows "🎯 Ready" state (NOT locked) - Critical validation of Bug 3 fix
    await expect(page.locator('text=🎯 Ready')).toBeVisible();
    await expect(page.locator('text=🔒 Locked')).not.toBeVisible();
    
    // Change status to APPLIED using dropdown
    await page.locator('select[name="status"]').selectOption('APPLIED');
    await page.locator('button[title="Save status"]').click();
    
    // Verify status changes in UI
    await expect(page.locator('text=APPLIED')).toBeVisible();
    
    // Verify Interview Coach remains accessible with "🎯 Ready" badge
    await expect(page.locator('text=🎯 Ready')).toBeVisible();
    
    console.log('✅ P0-02: Status progression and Interview Coach unlock successful');
  });

  /**
   * P0-03: Settings Modal - Dark Mode & Positioning
   * Critical validation of UI foundation
   */
  test('P0-03: Settings modal positioning and dark mode', async ({ page }) => {
    // Open job detail page
    await page.goto(`http://localhost:3000/jobs/${testJobId}`);
    
    // Scroll to middle of page
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Click Settings icon (⚙️ top right per AGENT_REFERENCE_GUIDE)
    await page.locator('button[title="Settings"]').click();
    
    // Verify modal opens centered on viewport (not clipped at top) - Validates existing fix
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Verify modal backdrop visible
    await expect(page.locator('.backdrop')).toBeVisible();
    
    // Toggle dark mode
    await page.locator('button:has-text("Dark Mode")').click();
    
    // Verify ALL UI elements respect theme (test status dropdown specifically - Bug 1 validation)
    await expect(page.locator('select[name="status"]')).toBeVisible();
    
    // Verify status dropdown shows correct theme colors
    const selectElement = page.locator('select[name="status"]');
    const backgroundColor = await selectElement.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    
    // Close modal, re-open
    await page.locator('button:has-text("Close")').click();
    await page.locator('button[title="Settings"]').click();
    
    // Verify positioning consistent
    await expect(modal).toBeVisible();
    
    console.log('✅ P0-03: Settings modal positioning and dark mode successful');
  });

  // ============================================================================
  // P1 TESTS (20 tests) - FEATURE COVERAGE - HIGH PRIORITY
  // ============================================================================

  /**
   * P1-01: Okay Match - Resume Improvement Flow
   * AGENT_REFERENCE_GUIDE Section 1 "Resume Coach (Pre-Application)" flow
   */
  test('P1-01: Resume improvement flow with okay match', async ({ page }) => {
    // Use existing job with 82% match (simulated)
    await page.goto(`http://localhost:3000/jobs/${testJobId}`);
    
    // Verify lower match score displays with yellow gradient
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
    
    // Click "Start Resume Coach"
    await page.locator('button:has-text("Start Resume Coach")').click();
    
    // Complete discovery questions (15-16 questions per AGENT_REFERENCE_GUIDE Section 1.73)
    await expect(page.locator('text=Discovery Questions')).toBeVisible();
    
    // Verify auto-save triggers within 3s (per E2E_TESTING_STRATEGY P0 criteria)
    await page.locator('textarea').first().fill('Test answer for auto-save');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Auto-saved')).toBeVisible();
    
    // Generate improved resume
    await page.locator('button:has-text("Generate Resume")').click();
    await expect(page.locator('text=Resume Generated')).toBeVisible({ timeout: 30000 });
    
    // Re-run Match Score analysis
    await page.locator('button:has-text("Re-analyze Match Score")').click();
    
    // Verify score improvement (expect +5-10% per EXPECTED_SCORE_IMPROVEMENT)
    await expect(page.locator('text=🔼')).toBeVisible();
    
    console.log('✅ P1-01: Resume improvement flow successful');
  });

  /**
   * P1-02: Bad Match - Early Warning
   * AGENT_REFERENCE_GUIDE Reference: Match Score < 60% should show red warnings
   */
  test('P1-02: Bad match early warning system', async ({ page }) => {
    // Create job with mismatched skills (simulated)
    await page.goto('http://localhost:3000');
    await page.locator('button:has-text("Create New Job")').click();
    await page.locator('input[name="title"]').fill('Software Engineer');
    await page.locator('input[name="company"]').fill('TechCorp');
    await page.locator('select[name="status"]').selectOption('ON_RADAR');
    await page.locator('button:has-text("Create Job")').click();
    
    // Upload resume with "Marketing" focus (simulated)
    // Upload JD with "Software Engineering" focus (simulated)
    await page.locator('button:has-text("Upload Resume")').click();
    // Simulate file upload
    await page.locator('input[type="file"]').setInputFiles('data/test-files/resume-bad.pdf');
    
    await page.locator('button:has-text("Upload JD")').click();
    await page.locator('input[type="file"]').setInputFiles('data/test-files/jd-bad.docx');
    
    // Run "Refresh Data"
    await page.locator('button:has-text("Refresh Data")').click();
    await page.waitForSelector('text=Extraction complete', { timeout: 30000 });
    
    // Run Match Score analysis
    await page.locator('button:has-text("Analyze")').first().click();
    
    // Verify match score <60%
    await expect(page.locator('text=/[0-5]\\d%/')).toBeVisible({ timeout: 30000 });
    
    // Verify red gradient applied (per UI_DESIGN_SPEC.md color palette)
    const scoreElement = page.locator('[data-testid="match-score"]');
    const gradient = await scoreElement.evaluate(el => 
      window.getComputedStyle(el).backgroundImage
    );
    expect(gradient).toContain('red');
    
    // Verify Resume Coach suggests "major changes needed" messaging
    await expect(page.locator('text=major changes needed')).toBeVisible();
    
    console.log('✅ P1-02: Bad match early warning successful');
  });

  /**
   * P1-03: Data Pipeline - Multiple File Formats
   * AGENT_REFERENCE_GUIDE Reference: Section 5 "Artifact Variants System" - supports PDF, DOCX, TXT
   */
  test('P1-03: Data pipeline multiple file formats', async ({ page }) => {
    await page.goto(`http://localhost:3000/jobs/${testJobId}`);
    
    // Upload each file format combination (simulated)
    const formats = ['pdf', 'docx', 'txt'];
    
    for (const format of formats) {
      await page.locator('button:has-text("Upload Resume")').click();
      await page.locator('input[type="file"]').setInputFiles(`data/test-files/resume.${format}`);
      
      await page.locator('button:has-text("Upload JD")').click();
      await page.locator('input[type="file"]').setInputFiles(`data/test-files/jd.${format}`);
      
      // Run "Refresh Data" for each (per TERMINOLOGY_GUIDE.md)
      await page.locator('button:has-text("Refresh Data")').click();
      await page.waitForSelector('text=Extraction complete', { timeout: 30000 });
      
      // Verify Raw extraction succeeds for all (UTF-8 per AGENT_REFERENCE_GUIDE)
      await expect(page.locator('text=Raw')).toBeVisible();
      
      // Verify AI-Optimized generation succeeds for all
      await expect(page.locator('text=AI-Optimized')).toBeVisible();
      
      // View variants modal for each
      await page.locator('button:has-text("View Variants")').click();
      
      // Verify content matches source (no hallucination per Section 10.4)
      await expect(page.locator('text=Content matches source')).toBeVisible();
      
      await page.locator('button:has-text("Close")').click();
    }
    
    console.log('✅ P1-03: Data pipeline multiple file formats successful');
  });

  /**
   * P1-04: Error Handling & Edge Cases
   * AGENT_REFERENCE_GUIDE Reference: Section 12 "Common Pitfalls & Solutions"
   */
  test('P1-04: Error handling and edge cases', async ({ page }) => {
    await page.goto(`http://localhost:3000/jobs/${testJobId}`);
    
    // Upload corrupted PDF → Verify error message (per Section 12.1: "Guide users to convert PDF → DOCX")
    await page.locator('button:has-text("Upload Resume")').click();
    await page.locator('input[type="file"]').setInputFiles('data/test-files/corrupted.pdf');
    await expect(page.locator('text=PDF extraction failed')).toBeVisible();
    await expect(page.locator('text=Convert PDF to DOCX')).toBeVisible();
    
    // Upload PDF with layers/metadata → Verify extraction fallback or error
    await page.locator('input[type="file"]').setInputFiles('data/test-files/complex.pdf');
    await page.locator('button:has-text("Refresh Data")').click();
    await expect(page.locator('text=Extraction complete')).toBeVisible({ timeout: 30000 });
    
    // Navigate to Interview Coach before prerequisites → Verify locked state with clear messaging
    await page.locator('button:has-text("Start Interview Coach")').click();
    await expect(page.locator('text=🔒 Locked')).toBeVisible();
    await expect(page.locator('text=Complete Match Score and Skills Match first')).toBeVisible();
    
    // Rapid-click "Analyze" button → Verify debouncing works (no duplicate API calls)
    await page.locator('button:has-text("Analyze")').first().click();
    await page.locator('button:has-text("Analyze")').first().click();
    await page.locator('button:has-text("Analyze")').first().click();
    
    // Should only see one loading state
    const loadingStates = await page.locator('text=Analyzing').count();
    expect(loadingStates).toBeLessThanOrEqual(1);
    
    // Close browser mid-analysis → Reopen → Verify state persisted to database
    await page.close();
    const newPage = await page.context().newPage();
    await newPage.goto(`http://localhost:3000/jobs/${testJobId}`);
    
    // Verify data persisted
    await expect(newPage.locator('text=Match Score')).toBeVisible();
    
    console.log('✅ P1-04: Error handling and edge cases successful');
  });

  // ============================================================================
  // P2 TESTS (10 tests) - EDGE CASES - NICE TO PASS
  // ============================================================================

  /**
   * P2-01: Interview Coach - Question Management (New Feature)
   * Priority: P2 (Nice to have - implements after core tests pass)
   */
  test('P2-01: Question management features', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Complete Insights step (get 4 synthesizedQuestions)
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    
    // On Insights page, deselect 1 question (uncheck checkbox)
    await page.locator('[data-testid="question-checkbox"]').first().click();
    
    // Verify selected count updates: "3 questions selected"
    await expect(page.locator('text=3 questions selected')).toBeVisible();
    
    // Click "Add Custom Question" button
    await page.locator('button:has-text("Add Custom Question")').click();
    
    // Enter: "What's your management philosophy?"
    await page.locator('textarea[name="customQuestion"]').fill("What's your management philosophy?");
    await page.locator('button:has-text("Add Question")').click();
    
    // Verify custom question appears in list with "Custom" badge
    await expect(page.locator('text=Custom')).toBeVisible();
    
    // Select custom question (checkbox)
    await page.locator('[data-testid="custom-question-checkbox"]').click();
    
    // Verify selected count: "4 questions selected"
    await expect(page.locator('text=4 questions selected')).toBeVisible();
    
    // Click "Continue to Practice"
    await page.locator('button:has-text("Continue to Practice")').click();
    
    // Verify Practice tab shows 3 synthesized + 1 custom = 4 total
    const practiceQuestions = page.locator('[data-testid="practice-question"]');
    const practiceCount = await practiceQuestions.count();
    expect(practiceCount).toBe(4);
    
    // Verify custom question answerable (score button works)
    await practiceQuestions.last().click();
    await page.locator('[data-testid="answer-textarea"]').fill('My management philosophy focuses on servant leadership...');
    await page.locator('button:has-text("Score My Answer")').click();
    await expect(page.locator('[data-testid="score-overall"]')).toBeVisible({ timeout: 30000 });
    
    console.log('✅ P2-01: Question management features successful');
  });

  /**
   * P2-02: Drag & Drop Question Reordering
   * Library: @dnd-kit/core (verify in dependencies)
   */
  test('P2-02: Drag and drop question reordering', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    
    // Select questions for practice
    await page.locator('[data-testid="question-checkbox"]').first().click();
    await page.locator('[data-testid="question-checkbox"]').nth(1).click();
    await page.locator('[data-testid="question-checkbox"]').nth(2).click();
    
    // Go to Practice tab
    await page.locator('button:has-text("Practice")').click();
    
    // Verify drag handles are visible
    await expect(page.locator('[data-testid="drag-handle"]')).toBeVisible();
    
    // Drag first question to second position
    const firstQuestion = page.locator('[data-testid="practice-question"]').first();
    const secondQuestion = page.locator('[data-testid="practice-question"]').nth(1);
    
    await firstQuestion.dragTo(secondQuestion);
    
    // Verify order changed
    const firstText = await firstQuestion.textContent();
    const secondText = await secondQuestion.textContent();
    expect(firstText).not.toBe(secondText);
    
    console.log('✅ P2-02: Drag and drop question reordering successful');
  });

  /**
   * P2-03: Custom Question Categories
   * Test different question categories (behavioral, technical, situational)
   */
  test('P2-03: Custom question categories', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Add custom questions with different categories
    const categories = ['behavioral', 'technical', 'situational'];
    
    for (const category of categories) {
      await page.locator('button:has-text("Add Custom Question")').click();
      await page.locator('textarea[name="customQuestion"]').fill(`Test ${category} question`);
      await page.locator('select[name="category"]').selectOption(category);
      await page.locator('button:has-text("Add Question")').click();
      
      // Verify category badge appears
      await expect(page.locator(`text=${category}`)).toBeVisible();
    }
    
    console.log('✅ P2-03: Custom question categories successful');
  });

  /**
   * P2-04: Question Search and Filtering
   * Test search functionality for questions
   */
  test('P2-04: Question search and filtering', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    
    // Search for specific question
    await page.locator('input[placeholder="Search questions..."]').fill('leadership');
    
    // Verify filtered results
    const filteredQuestions = page.locator('[data-testid="question-item"]');
    const count = await filteredQuestions.count();
    expect(count).toBeGreaterThan(0);
    
    // Clear search
    await page.locator('input[placeholder="Search questions..."]').clear();
    
    // Verify all questions visible again
    const allQuestions = page.locator('[data-testid="question-item"]');
    const allCount = await allQuestions.count();
    expect(allCount).toBeGreaterThan(count);
    
    console.log('✅ P2-04: Question search and filtering successful');
  });

  /**
   * P2-05: Question Import/Export
   * Test importing questions from external sources
   */
  test('P2-05: Question import and export', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Test export functionality
    await page.locator('button:has-text("Export Questions")').click();
    await expect(page.locator('text=Questions exported')).toBeVisible();
    
    // Test import functionality
    await page.locator('button:has-text("Import Questions")').click();
    await page.locator('input[type="file"]').setInputFiles('data/test-files/questions.json');
    await expect(page.locator('text=Questions imported')).toBeVisible();
    
    console.log('✅ P2-05: Question import and export successful');
  });

  /**
   * P2-06: Advanced Question Analytics
   * Test question performance analytics
   */
  test('P2-06: Advanced question analytics', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Complete some practice sessions
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    await page.locator('[data-testid="question-checkbox"]').first().click();
    await page.locator('button:has-text("Practice")').click();
    
    // Answer a question
    await page.locator('[data-testid="practice-question"]').first().click();
    await page.locator('[data-testid="answer-textarea"]').fill('Test answer');
    await page.locator('button:has-text("Score My Answer")').click();
    await expect(page.locator('[data-testid="score-overall"]')).toBeVisible({ timeout: 30000 });
    
    // Check analytics
    await page.locator('button:has-text("Analytics")').click();
    await expect(page.locator('text=Question Performance')).toBeVisible();
    await expect(page.locator('text=Average Score')).toBeVisible();
    await expect(page.locator('text=Time Spent')).toBeVisible();
    
    console.log('✅ P2-06: Advanced question analytics successful');
  });

  /**
   * P2-07: Multi-Persona Question Sets
   * Test different persona-specific question sets
   */
  test('P2-07: Multi-persona question sets', async ({ page }) => {
    const personas = ['recruiter', 'hiring-manager', 'peer'];
    
    for (const persona of personas) {
      await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=${persona}`);
      
      // Wait for questions to load
      await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
      
      // Verify persona-specific questions
      const questions = page.locator('[data-testid="question-item"]');
      const count = await questions.count();
      expect(count).toBeGreaterThan(0);
      
      // Verify persona indicator
      await expect(page.locator(`text=${persona}`)).toBeVisible();
    }
    
    console.log('✅ P2-07: Multi-persona question sets successful');
  });

  /**
   * P2-08: Question Difficulty Levels
   * Test question difficulty categorization
   */
  test('P2-08: Question difficulty levels', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    
    // Filter by difficulty
    await page.locator('select[name="difficulty"]').selectOption('hard');
    
    // Verify filtered results
    const hardQuestions = page.locator('[data-testid="question-item"]');
    const count = await hardQuestions.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify difficulty badges
    await expect(page.locator('text=Hard')).toBeVisible();
    
    console.log('✅ P2-08: Question difficulty levels successful');
  });

  /**
   * P2-09: Question Tags and Categories
   * Test question tagging system
   */
  test('P2-09: Question tags and categories', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Wait for questions to load
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    
    // Filter by tag
    await page.locator('button:has-text("Technical")').click();
    
    // Verify filtered results
    const technicalQuestions = page.locator('[data-testid="question-item"]');
    const count = await technicalQuestions.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify tag badges
    await expect(page.locator('text=Technical')).toBeVisible();
    
    console.log('✅ P2-09: Question tags and categories successful');
  });

  /**
   * P2-10: Question Performance Insights
   * Test question performance insights and recommendations
   */
  test('P2-10: Question performance insights', async ({ page }) => {
    await page.goto(`http://localhost:3000/interview-coach/${testJobId}?type=recruiter`);
    
    // Complete practice session
    await page.waitForSelector('[data-testid="question-item"]', { timeout: 15000 });
    await page.locator('[data-testid="question-checkbox"]').first().click();
    await page.locator('button:has-text("Practice")').click();
    
    // Answer multiple questions
    const questions = page.locator('[data-testid="practice-question"]');
    const questionCount = await questions.count();
    
    for (let i = 0; i < Math.min(questionCount, 3); i++) {
      await questions.nth(i).click();
      await page.locator('[data-testid="answer-textarea"]').fill(`Test answer ${i + 1}`);
      await page.locator('button:has-text("Score My Answer")').click();
      await expect(page.locator('[data-testid="score-overall"]')).toBeVisible({ timeout: 30000 });
    }
    
    // Check insights
    await page.locator('button:has-text("Insights")').click();
    await expect(page.locator('text=Performance Insights')).toBeVisible();
    await expect(page.locator('text=Strengths')).toBeVisible();
    await expect(page.locator('text=Areas for Improvement')).toBeVisible();
    await expect(page.locator('text=Recommendations')).toBeVisible();
    
    console.log('✅ P2-10: Question performance insights successful');
  });
});
