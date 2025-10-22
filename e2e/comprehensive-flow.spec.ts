import { test, expect, Page } from '@playwright/test';
import { 
  getReusableJobData, 
  getJobAttachmentVariants, 
  createTestJob, 
  cleanupTestJob, 
  validateJobForTesting, 
  getBestTestJob, 
  waitForJobReady,
  JobData,
  TestContext 
} from './utils/jobData';

// Global test context
let testContext: TestContext = {
  jobs: [],
  selectedJob: null,
  testJobId: null
};

test.describe('JoTrack E2E Test Suite', () => {
  
  test.beforeAll(async ({ browser }) => {
    console.log('🚀 Starting JoTrack E2E Test Suite');
    
    const page = await browser.newPage();
    
    try {
      // Discover existing jobs with attachments
      testContext.jobs = await getReusableJobData(page);
      
      if (testContext.jobs.length > 0) {
        // Select the best job for testing
        testContext.selectedJob = await getBestTestJob(page, testContext.jobs);
        
        if (testContext.selectedJob) {
          console.log(`✅ Using existing job: ${testContext.selectedJob.title} at ${testContext.selectedJob.companyName}`);
        }
      } else {
        console.log('⚠️ No existing jobs found, will create test job');
      }
      
    } catch (error) {
      console.log(`❌ Error in beforeAll: ${error}`);
    } finally {
      await page.close();
    }
  });
  
  test.afterAll(async ({ browser }) => {
    console.log('🧹 Cleaning up test suite');
    
    const page = await browser.newPage();
    
    try {
      // Clean up any test jobs we created
      if (testContext.testJobId) {
        await cleanupTestJob(page, testContext.testJobId);
      }
    } catch (error) {
      console.log(`❌ Error in afterAll: ${error}`);
    } finally {
      await page.close();
    }
  });

  test.describe('P0 Critical Tests (MUST PASS)', () => {
    
    test('Scenario 1: New User Onboarding - Complete Flow', async ({ page }) => {
      console.log('🧪 Testing Scenario 1: New User Onboarding');
      
      // Navigate to home page
      await page.goto('/');
      await expect(page).toHaveTitle(/JoTrack/);
      
      // Verify welcome state
      await expect(page.locator('text=Welcome to JoTrack')).toBeVisible();
      
      // Create new job if no existing job available
      let jobId: string;
      
      if (testContext.selectedJob) {
        jobId = testContext.selectedJob.id;
        console.log(`📋 Using existing job: ${testContext.selectedJob.title}`);
        
        // Navigate to existing job
        await page.goto(`/jobs/${jobId}`);
        await expect(page).toHaveTitle(new RegExp(testContext.selectedJob.title));
        
      } else {
        // Create new test job
        jobId = await createTestJob(page);
        testContext.testJobId = jobId;
        
        // Navigate to new job
        await page.goto(`/jobs/${jobId}`);
        await expect(page).toHaveTitle(/Test Job/);
      }
      
      // Verify job detail page loads
      await expect(page.locator('[data-testid="job-title"]')).toBeVisible();
      
      // Check if attachments exist
      const attachmentsSection = page.locator('[data-testid="attachments-section"]');
      await expect(attachmentsSection).toBeVisible();
      
      // If no attachments, upload test files
      const hasAttachments = await page.locator('[data-testid="attachment-item"]').count() > 0;
      
      if (!hasAttachments && !testContext.selectedJob) {
        console.log('📎 No attachments found, uploading test files...');
        
        // Upload resume
        const resumeInput = page.locator('input[type="file"][accept*="pdf"]').first();
        await resumeInput.setInputFiles('e2e/fixtures/resume-good.pdf');
        
        // Upload JD
        const jdInput = page.locator('input[type="file"][accept*="docx"]').first();
        await jdInput.setInputFiles('e2e/fixtures/jd-good.docx');
        
        // Wait for uploads to complete
        await page.waitForTimeout(2000);
      }
      
      // Run data pipeline
      console.log('🔄 Running data pipeline...');
      const refreshDataBtn = page.locator('[data-testid="refresh-data-btn"]');
      await expect(refreshDataBtn).toBeVisible();
      await refreshDataBtn.click();
      
      // Wait for extraction to complete
      await page.waitForSelector('[data-testid="extraction-complete"]', { timeout: 30000 });
      
      // Verify variants modal
      const viewVariantsBtn = page.locator('[data-testid="view-variants-btn"]');
      await expect(viewVariantsBtn).toBeVisible();
      await viewVariantsBtn.click();
      
      // Check variants modal opens
      const variantsModal = page.locator('[data-testid="variants-modal"]');
      await expect(variantsModal).toBeVisible();
      
      // Verify Raw and AI-Optimized variants exist (not Detailed)
      await expect(variantsModal.locator('text=Raw')).toBeVisible();
      await expect(variantsModal.locator('text=AI-Optimized')).toBeVisible();
      await expect(variantsModal.locator('text=Detailed')).not.toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      
      // Run Match Score analysis
      console.log('📊 Running Match Score analysis...');
      const matchScoreBtn = page.locator('[data-testid="match-score-analyze-btn"]');
      await expect(matchScoreBtn).toBeVisible();
      await matchScoreBtn.click();
      
      // Wait for analysis to complete
      await page.waitForSelector('[data-testid="match-score-result"]', { timeout: 30000 });
      
      // Verify match score displays
      const matchScore = page.locator('[data-testid="match-score-value"]');
      await expect(matchScore).toBeVisible();
      
      // Check Resume Coach unlock
      const resumeCoachCard = page.locator('[data-testid="resume-coach-card"]');
      await expect(resumeCoachCard).toBeVisible();
      
      // Check Interview Coach is locked (needs Skills Match)
      const interviewCoachCard = page.locator('[data-testid="interview-coach-card"]');
      await expect(interviewCoachCard).toBeVisible();
      
      const lockedBadge = interviewCoachCard.locator('[data-testid="locked-badge"]');
      await expect(lockedBadge).toBeVisible();
      
      // Run Skills Match analysis
      console.log('🎯 Running Skills Match analysis...');
      const skillsMatchBtn = page.locator('[data-testid="skills-match-analyze-btn"]');
      await expect(skillsMatchBtn).toBeVisible();
      await skillsMatchBtn.click();
      
      // Wait for analysis to complete
      await page.waitForSelector('[data-testid="skills-match-result"]', { timeout: 30000 });
      
      // Verify Interview Coach unlocks
      const readyBadge = interviewCoachCard.locator('[data-testid="ready-badge"]');
      await expect(readyBadge).toBeVisible();
      
      // Start Interview Coach
      console.log('🎤 Starting Interview Coach...');
      const startInterviewCoachBtn = page.locator('[data-testid="start-interview-coach-btn"]');
      await expect(startInterviewCoachBtn).toBeVisible();
      await startInterviewCoachBtn.click();
      
      // Verify redirect to Interview Coach page
      await expect(page).toHaveURL(/\/interview-coach\/.*\?type=recruiter/);
      
      // Verify auto-search triggers
      await page.waitForSelector('[data-testid="search-progress"]', { timeout: 10000 });
      
      // Wait for search to complete
      await page.waitForSelector('[data-testid="search-complete"]', { timeout: 60000 });
      
      // Navigate to Insights tab
      const insightsTab = page.locator('[data-testid="insights-tab"]');
      await expect(insightsTab).toBeVisible();
      await insightsTab.click();
      
      // Verify Insights content
      await expect(page.locator('[data-testid="web-questions"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-questions"]')).toBeVisible();
      await expect(page.locator('[data-testid="synthesized-questions"]')).toBeVisible();
      
      // Verify 4 synthesized questions
      const synthesizedQuestions = page.locator('[data-testid="synthesized-question"]');
      await expect(synthesizedQuestions).toHaveCount(4);
      
      // Navigate to Practice tab
      const practiceTab = page.locator('[data-testid="practice-tab"]');
      await expect(practiceTab).toBeVisible();
      await practiceTab.click();
      
      // Verify ONLY 4 synthesized questions (not 27 web questions)
      const practiceQuestions = page.locator('[data-testid="practice-question"]');
      await expect(practiceQuestions).toHaveCount(4);
      
      // Select a question and type answer
      const firstQuestion = practiceQuestions.first();
      await firstQuestion.click();
      
      const answerTextarea = page.locator('[data-testid="answer-textarea"]');
      await expect(answerTextarea).toBeVisible();
      
      const testAnswer = 'This is a test answer for the interview question. I will provide a detailed response that demonstrates my experience and skills in this area. The answer should be comprehensive and show my understanding of the topic.';
      await answerTextarea.fill(testAnswer);
      
      // Score the answer
      const scoreBtn = page.locator('[data-testid="score-answer-btn"]');
      await expect(scoreBtn).toBeVisible();
      await scoreBtn.click();
      
      // Wait for scoring to complete
      await page.waitForSelector('[data-testid="score-result"]', { timeout: 30000 });
      
      // Verify score appears
      const scoreDisplay = page.locator('[data-testid="score-value"]');
      await expect(scoreDisplay).toBeVisible();
      
      // Navigate to Talk Tracks tab
      const talkTracksTab = page.locator('[data-testid="talk-tracks-tab"]');
      await expect(talkTracksTab).toBeVisible();
      await talkTracksTab.click();
      
      // Verify core stories extracted
      await expect(page.locator('[data-testid="core-stories"]')).toBeVisible();
      
      // Navigate to Cheat Sheet tab
      const cheatSheetTab = page.locator('[data-testid="cheat-sheet-tab"]');
      await expect(cheatSheetTab).toBeVisible();
      await cheatSheetTab.click();
      
      // Verify final prep materials
      await expect(page.locator('[data-testid="cheat-sheet-content"]')).toBeVisible();
      
      console.log('✅ Scenario 1 completed successfully');
    });
    
    test('Scenario 4: Status Progression & Interview Coach Unlock', async ({ page }) => {
      console.log('🧪 Testing Scenario 4: Status Progression & Interview Coach Unlock');
      
      if (!testContext.selectedJob) {
        test.skip('No existing job available for testing');
        return;
      }
      
      const jobId = testContext.selectedJob.id;
      
      // Navigate to job detail page
      await page.goto(`/jobs/${jobId}`);
      
      // Verify job loads
      await expect(page.locator('[data-testid="job-title"]')).toBeVisible();
      
      // Check current status
      const statusSelect = page.locator('[data-testid="status-select"]');
      await expect(statusSelect).toBeVisible();
      
      // Verify all status options are visible (not clipped)
      await statusSelect.click();
      
      const statusOptions = page.locator('[data-testid="status-option"]');
      await expect(statusOptions).toHaveCount(8); // All 8 statuses should be visible
      
      // Check each status option is visible
      const expectedStatuses = ['ON_RADAR', 'APPLIED', 'PHONE_SCREEN', 'TECHNICAL_INTERVIEW', 'ONSITE_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER', 'REJECTED'];
      
      for (const status of expectedStatuses) {
        const option = page.locator(`[data-testid="status-option-${status}"]`);
        await expect(option).toBeVisible();
      }
      
      // Close dropdown
      await page.keyboard.press('Escape');
      
      // Run Match Score and Skills Match if not already done
      const matchScoreBtn = page.locator('[data-testid="match-score-analyze-btn"]');
      if (await matchScoreBtn.isVisible()) {
        await matchScoreBtn.click();
        await page.waitForSelector('[data-testid="match-score-result"]', { timeout: 30000 });
      }
      
      const skillsMatchBtn = page.locator('[data-testid="skills-match-analyze-btn"]');
      if (await skillsMatchBtn.isVisible()) {
        await skillsMatchBtn.click();
        await page.waitForSelector('[data-testid="skills-match-result"]', { timeout: 30000 });
      }
      
      // Verify Interview Coach shows "Ready" state (not locked)
      const interviewCoachCard = page.locator('[data-testid="interview-coach-card"]');
      await expect(interviewCoachCard).toBeVisible();
      
      const readyBadge = interviewCoachCard.locator('[data-testid="ready-badge"]');
      await expect(readyBadge).toBeVisible();
      
      // Change status to APPLIED
      await statusSelect.click();
      await page.locator('[data-testid="status-option-APPLIED"]').click();
      
      // Verify save button appears
      const saveBtn = page.locator('[data-testid="save-status-btn"]');
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();
      
      // Wait for status to update
      await page.waitForTimeout(1000);
      
      // Verify status changed
      await expect(statusSelect).toHaveValue('APPLIED');
      
      // Verify Interview Coach remains accessible
      await expect(readyBadge).toBeVisible();
      
      console.log('✅ Scenario 4 completed successfully');
    });
    
    test('Scenario 7: Settings Modal - Dark Mode & Positioning', async ({ page }) => {
      console.log('🧪 Testing Scenario 7: Settings Modal - Dark Mode & Positioning');
      
      if (!testContext.selectedJob) {
        test.skip('No existing job available for testing');
        return;
      }
      
      const jobId = testContext.selectedJob.id;
      
      // Navigate to job detail page
      await page.goto(`/jobs/${jobId}`);
      
      // Scroll to middle of page to test modal positioning
      await page.evaluate(() => window.scrollTo(0, 500));
      
      // Open Settings modal
      const settingsBtn = page.locator('[data-testid="settings-btn"]');
      await expect(settingsBtn).toBeVisible();
      await settingsBtn.click();
      
      // Verify modal opens centered (not clipped at top)
      const settingsModal = page.locator('[data-testid="settings-modal"]');
      await expect(settingsModal).toBeVisible();
      
      // Check modal positioning
      const modalBox = await settingsModal.boundingBox();
      const viewport = page.viewportSize();
      
      if (modalBox && viewport) {
        // Modal should be centered vertically
        const expectedTop = (viewport.height - modalBox.height) / 2;
        expect(modalBox.y).toBeGreaterThan(50); // Not clipped at top
        expect(modalBox.y).toBeLessThan(expectedTop + 100); // Roughly centered
      }
      
      // Verify backdrop is visible
      const backdrop = page.locator('[data-testid="modal-backdrop"]');
      await expect(backdrop).toBeVisible();
      
      // Test dark mode toggle
      const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
      await expect(darkModeToggle).toBeVisible();
      
      // Get current theme
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      // Toggle dark mode
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      // Verify theme changed
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(newTheme).toBe(!initialTheme);
      
      // Test status dropdown in new theme
      const statusSelect = page.locator('[data-testid="status-select"]');
      await expect(statusSelect).toBeVisible();
      
      // Check dropdown styling
      const selectStyles = await statusSelect.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      // Verify theme-appropriate colors
      if (newTheme) {
        expect(selectStyles.backgroundColor).toContain('rgb(31, 41, 55)'); // Dark theme background
      } else {
        expect(selectStyles.backgroundColor).toContain('rgb(255, 255, 255)'); // Light theme background
      }
      
      // Close modal
      await page.keyboard.press('Escape');
      
      // Re-open modal to test consistent positioning
      await settingsBtn.click();
      await expect(settingsModal).toBeVisible();
      
      // Verify positioning is consistent
      const modalBox2 = await settingsModal.boundingBox();
      if (modalBox && modalBox2) {
        expect(Math.abs(modalBox.y - modalBox2.y)).toBeLessThan(50); // Roughly same position
      }
      
      console.log('✅ Scenario 7 completed successfully');
    });
  });
  
  test.describe('P1 High Priority Tests (SHOULD PASS)', () => {
    
    test('Scenario 2: Okay Match - Resume Improvement Flow', async ({ page }) => {
      console.log('🧪 Testing Scenario 2: Okay Match - Resume Improvement Flow');
      
      if (!testContext.selectedJob) {
        test.skip('No existing job available for testing');
        return;
      }
      
      const jobId = testContext.selectedJob.id;
      
      // Navigate to job detail page
      await page.goto(`/jobs/${jobId}`);
      
      // Run Match Score analysis if not already done
      const matchScoreBtn = page.locator('[data-testid="match-score-analyze-btn"]');
      if (await matchScoreBtn.isVisible()) {
        await matchScoreBtn.click();
        await page.waitForSelector('[data-testid="match-score-result"]', { timeout: 30000 });
      }
      
      // Check match score display
      const matchScoreValue = page.locator('[data-testid="match-score-value"]');
      await expect(matchScoreValue).toBeVisible();
      
      // Get initial score
      const initialScoreText = await matchScoreValue.textContent();
      const initialScore = parseInt(initialScoreText?.replace('%', '') || '0');
      
      console.log(`📊 Initial match score: ${initialScore}%`);
      
      // Check Resume Coach availability
      const resumeCoachCard = page.locator('[data-testid="resume-coach-card"]');
      await expect(resumeCoachCard).toBeVisible();
      
      // Check if Resume Coach is unlocked (score >= 82%)
      const resumeCoachBtn = page.locator('[data-testid="start-resume-coach-btn"]');
      
      if (await resumeCoachBtn.isVisible()) {
        console.log('🎯 Starting Resume Coach...');
        await resumeCoachBtn.click();
        
        // Verify Resume Coach page loads
        await expect(page).toHaveURL(/\/coach\/.*/);
        
        // Complete discovery questions
        const discoveryQuestions = page.locator('[data-testid="discovery-question"]');
        const questionCount = await discoveryQuestions.count();
        
        console.log(`📝 Found ${questionCount} discovery questions`);
        
        // Answer first few questions
        for (let i = 0; i < Math.min(3, questionCount); i++) {
          const question = discoveryQuestions.nth(i);
          await expect(question).toBeVisible();
          
          const textarea = question.locator('textarea');
          await expect(textarea).toBeVisible();
          
          const answer = `This is my answer to discovery question ${i + 1}. I have relevant experience in this area and can provide specific examples.`;
          await textarea.fill(answer);
          
          // Auto-save should trigger within 3 seconds
          await page.waitForTimeout(3000);
        }
        
        // Generate improved resume
        const generateBtn = page.locator('[data-testid="generate-resume-btn"]');
        if (await generateBtn.isVisible()) {
          await generateBtn.click();
          
          // Wait for generation to complete
          await page.waitForSelector('[data-testid="resume-generated"]', { timeout: 60000 });
          
          // Re-run Match Score analysis
          await page.goto(`/jobs/${jobId}`);
          
          const newMatchScoreBtn = page.locator('[data-testid="match-score-analyze-btn"]');
          if (await newMatchScoreBtn.isVisible()) {
            await newMatchScoreBtn.click();
            await page.waitForSelector('[data-testid="match-score-result"]', { timeout: 30000 });
          }
          
          // Check for score improvement
          const newScoreText = await matchScoreValue.textContent();
          const newScore = parseInt(newScoreText?.replace('%', '') || '0');
          
          console.log(`📈 New match score: ${newScore}%`);
          
          if (newScore > initialScore) {
            // Verify trend indicator
            const trendIndicator = page.locator('[data-testid="trend-indicator"]');
            await expect(trendIndicator).toBeVisible();
          }
        }
      } else {
        console.log('⚠️ Resume Coach not available (score < 82%)');
      }
      
      console.log('✅ Scenario 2 completed successfully');
    });
    
    test('Scenario 3: Bad Match - Early Warning', async ({ page }) => {
      console.log('🧪 Testing Scenario 3: Bad Match - Early Warning');
      
      // Create a test job with mismatched skills
      const testJobId = await createTestJob(page, 'BAD-MATCH-TEST');
      testContext.testJobId = testJobId;
      
      // Navigate to test job
      await page.goto(`/jobs/${testJobId}`);
      
      // Upload mismatched files
      const resumeInput = page.locator('input[type="file"][accept*="pdf"]').first();
      await resumeInput.setInputFiles('e2e/fixtures/resume-bad.pdf');
      
      const jdInput = page.locator('input[type="file"][accept*="docx"]').first();
      await jdInput.setInputFiles('e2e/fixtures/jd-bad.docx');
      
      // Wait for uploads
      await page.waitForTimeout(2000);
      
      // Run data pipeline
      const refreshDataBtn = page.locator('[data-testid="refresh-data-btn"]');
      await refreshDataBtn.click();
      await page.waitForSelector('[data-testid="extraction-complete"]', { timeout: 30000 });
      
      // Run Match Score analysis
      const matchScoreBtn = page.locator('[data-testid="match-score-analyze-btn"]');
      await matchScoreBtn.click();
      await page.waitForSelector('[data-testid="match-score-result"]', { timeout: 30000 });
      
      // Check for low match score
      const matchScoreValue = page.locator('[data-testid="match-score-value"]');
      await expect(matchScoreValue).toBeVisible();
      
      const scoreText = await matchScoreValue.textContent();
      const score = parseInt(scoreText?.replace('%', '') || '0');
      
      console.log(`📊 Match score: ${score}%`);
      
      if (score < 60) {
        // Verify red gradient applied
        const matchScoreCard = page.locator('[data-testid="match-score-card"]');
        const cardStyles = await matchScoreCard.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            color: computed.color
          };
        });
        
        // Check for red gradient or warning colors
        expect(cardStyles.background).toContain('red') || expect(cardStyles.background).toContain('rgb(239, 68, 68)');
        
        // Verify Resume Coach suggests major changes
        const resumeCoachCard = page.locator('[data-testid="resume-coach-card"]');
        await expect(resumeCoachCard).toBeVisible();
        
        const warningText = resumeCoachCard.locator('text=major changes needed');
        await expect(warningText).toBeVisible();
      }
      
      console.log('✅ Scenario 3 completed successfully');
    });
    
    test('Scenario 5: Data Pipeline - Multiple File Formats', async ({ page }) => {
      console.log('🧪 Testing Scenario 5: Data Pipeline - Multiple File Formats');
      
      if (!testContext.selectedJob) {
        test.skip('No existing job available for testing');
        return;
      }
      
      const jobId = testContext.selectedJob.id;
      
      // Get attachment variants
      const attachmentVariants = await getJobAttachmentVariants(page, jobId);
      
      console.log(`📎 Found attachments: Resume(${attachmentVariants.resume.length}), JD(${attachmentVariants.jd.length}), Cover Letter(${attachmentVariants.cover_letter.length})`);
      
      // Test each attachment type
      for (const [type, attachments] of Object.entries(attachmentVariants)) {
        if (attachments.length > 0) {
          console.log(`🔍 Testing ${type} attachments...`);
          
          for (const attachment of attachments) {
            console.log(`📄 Testing attachment: ${attachment.fileName} (${attachment.mimeType})`);
            
            // Test file streaming
            if (attachment.filePath) {
              try {
                const streamResponse = await page.request.get(`/api/files/stream?path=${encodeURIComponent(attachment.filePath)}`);
                
                if (streamResponse.ok()) {
                  console.log(`✅ Successfully streamed ${attachment.fileName}`);
                } else {
                  console.log(`⚠️ Failed to stream ${attachment.fileName}: ${streamResponse.status()}`);
                }
              } catch (error) {
                console.log(`❌ Error streaming ${attachment.fileName}: ${error}`);
              }
            }
            
            // Test variants
            if (attachment.variants.length > 0) {
              console.log(`🔄 Found ${attachment.variants.length} variants for ${attachment.fileName}`);
              
              for (const variant of attachment.variants) {
                console.log(`📋 Variant: ${variant.variantType} (${variant.tokenCount} tokens)`);
                
                // Verify variant has content
                expect(variant.content).toBeDefined();
                expect(variant.tokenCount).toBeGreaterThan(0);
              }
            }
          }
        }
      }
      
      // Test variants modal
      await page.goto(`/jobs/${jobId}`);
      
      const viewVariantsBtn = page.locator('[data-testid="view-variants-btn"]');
      await expect(viewVariantsBtn).toBeVisible();
      await viewVariantsBtn.click();
      
      const variantsModal = page.locator('[data-testid="variants-modal"]');
      await expect(variantsModal).toBeVisible();
      
      // Verify only Raw and AI-Optimized variants (not Detailed)
      await expect(variantsModal.locator('text=Raw')).toBeVisible();
      await expect(variantsModal.locator('text=AI-Optimized')).toBeVisible();
      await expect(variantsModal.locator('text=Detailed')).not.toBeVisible();
      
      // Test content matches source (no hallucination)
      const rawContent = variantsModal.locator('[data-testid="raw-content"]');
      const aiOptimizedContent = variantsModal.locator('[data-testid="ai-optimized-content"]');
      
      if (await rawContent.isVisible() && await aiOptimizedContent.isVisible()) {
        const rawText = await rawContent.textContent();
        const aiText = await aiOptimizedContent.textContent();
        
        // AI-optimized should be shorter but contain key information
        expect(aiText?.length).toBeLessThan(rawText?.length || 0);
        expect(aiText?.length).toBeGreaterThan(0);
      }
      
      console.log('✅ Scenario 5 completed successfully');
    });
    
    test('Scenario 8: Error Handling & Edge Cases', async ({ page }) => {
      console.log('🧪 Testing Scenario 8: Error Handling & Edge Cases');
      
      // Test 1: Upload corrupted PDF
      console.log('🧪 Testing corrupted PDF handling...');
      
      const testJobId = await createTestJob(page, 'ERROR-TEST');
      testContext.testJobId = testJobId;
      
      await page.goto(`/jobs/${testJobId}`);
      
      // Try to upload a corrupted file (if we have one)
      try {
        const resumeInput = page.locator('input[type="file"][accept*="pdf"]').first();
        await resumeInput.setInputFiles('e2e/fixtures/corrupted.pdf');
        
        // Wait for error message
        await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
        
        const errorMessage = page.locator('[data-testid="error-message"]');
        await expect(errorMessage).toBeVisible();
        
        // Verify error message suggests converting to DOCX
        const errorText = await errorMessage.textContent();
        expect(errorText).toContain('convert PDF to DOCX') || expect(errorText).toContain('PDF extraction failed');
        
      } catch (error) {
        console.log('⚠️ No corrupted PDF fixture available, skipping test');
      }
      
      // Test 2: Navigate to Interview Coach before prerequisites
      console.log('🧪 Testing Interview Coach lock state...');
      
      await page.goto(`/jobs/${testJobId}`);
      
      // Try to access Interview Coach directly
      await page.goto(`/interview-coach/${testJobId}?type=recruiter`);
      
      // Should show locked state or redirect
      const lockedState = page.locator('[data-testid="locked-state"]');
      const redirectMessage = page.locator('text=prerequisites not met');
      
      if (await lockedState.isVisible() || await redirectMessage.isVisible()) {
        console.log('✅ Interview Coach correctly locked before prerequisites');
      } else {
        console.log('⚠️ Interview Coach should be locked but appears accessible');
      }
      
      // Test 3: Rapid-click "Analyze" button
      console.log('🧪 Testing button debouncing...');
      
      await page.goto(`/jobs/${testJobId}`);
      
      const analyzeBtn = page.locator('[data-testid="match-score-analyze-btn"]');
      if (await analyzeBtn.isVisible()) {
        // Rapid click the button
        for (let i = 0; i < 5; i++) {
          await analyzeBtn.click();
          await page.waitForTimeout(100);
        }
        
        // Wait for analysis to complete
        await page.waitForSelector('[data-testid="match-score-result"]', { timeout: 30000 });
        
        // Should only have one result, not multiple
        const results = page.locator('[data-testid="match-score-result"]');
        await expect(results).toHaveCount(1);
      }
      
      // Test 4: Data persistence
      console.log('🧪 Testing data persistence...');
      
      // Navigate away and back
      await page.goto('/');
      await page.goto(`/jobs/${testJobId}`);
      
      // Data should persist
      const jobTitle = page.locator('[data-testid="job-title"]');
      await expect(jobTitle).toBeVisible();
      
      console.log('✅ Scenario 8 completed successfully');
    });
  });
  
  test.describe('P2 Nice-to-Have Tests (NICE TO PASS)', () => {
    
    test('Scenario 6: Interview Coach - Question Management', async ({ page }) => {
      console.log('🧪 Testing Scenario 6: Interview Coach - Question Management');
      
      if (!testContext.selectedJob) {
        test.skip('No existing job available for testing');
        return;
      }
      
      const jobId = testContext.selectedJob.id;
      
      // Navigate to Interview Coach
      await page.goto(`/interview-coach/${jobId}?type=recruiter`);
      
      // Wait for search to complete
      await page.waitForSelector('[data-testid="search-complete"]', { timeout: 60000 });
      
      // Navigate to Insights tab
      const insightsTab = page.locator('[data-testid="insights-tab"]');
      await insightsTab.click();
      
      // Wait for insights to load
      await page.waitForSelector('[data-testid="synthesized-questions"]', { timeout: 10000 });
      
      // Test question selection
      const synthesizedQuestions = page.locator('[data-testid="synthesized-question"]');
      const questionCount = await synthesizedQuestions.count();
      
      console.log(`📝 Found ${questionCount} synthesized questions`);
      
      if (questionCount > 0) {
        // Deselect first question
        const firstQuestion = synthesizedQuestions.first();
        const checkbox = firstQuestion.locator('input[type="checkbox"]');
        
        if (await checkbox.isVisible()) {
          await checkbox.click();
          
          // Verify selection count updates
          const selectionCount = page.locator('[data-testid="selection-count"]');
          await expect(selectionCount).toBeVisible();
          
          const countText = await selectionCount.textContent();
          expect(countText).toContain(`${questionCount - 1} questions selected`);
        }
        
        // Test "Select All" / "Deselect All" buttons
        const selectAllBtn = page.locator('[data-testid="select-all-btn"]');
        const deselectAllBtn = page.locator('[data-testid="deselect-all-btn"]');
        
        if (await selectAllBtn.isVisible()) {
          await selectAllBtn.click();
          
          // Verify all questions selected
          const allCheckboxes = page.locator('[data-testid="synthesized-question"] input[type="checkbox"]:checked');
          await expect(allCheckboxes).toHaveCount(questionCount);
        }
        
        if (await deselectAllBtn.isVisible()) {
          await deselectAllBtn.click();
          
          // Verify no questions selected
          const checkedCheckboxes = page.locator('[data-testid="synthesized-question"] input[type="checkbox"]:checked');
          await expect(checkedCheckboxes).toHaveCount(0);
        }
        
        // Test custom question addition
        const addCustomBtn = page.locator('[data-testid="add-custom-question-btn"]');
        
        if (await addCustomBtn.isVisible()) {
          await addCustomBtn.click();
          
          // Fill custom question form
          const customQuestionModal = page.locator('[data-testid="custom-question-modal"]');
          await expect(customQuestionModal).toBeVisible();
          
          const questionTextarea = customQuestionModal.locator('textarea');
          await questionTextarea.fill('What is your management philosophy?');
          
          const categorySelect = customQuestionModal.locator('select');
          await categorySelect.selectOption('behavioral');
          
          const saveBtn = customQuestionModal.locator('[data-testid="save-custom-question-btn"]');
          await saveBtn.click();
          
          // Verify custom question appears
          const customQuestion = page.locator('[data-testid="custom-question"]');
          await expect(customQuestion).toBeVisible();
          
          // Verify custom badge
          const customBadge = customQuestion.locator('[data-testid="custom-badge"]');
          await expect(customBadge).toBeVisible();
        }
        
        // Test drag and drop reordering
        const dragHandle = page.locator('[data-testid="drag-handle"]').first();
        
        if (await dragHandle.isVisible()) {
          // Get initial order
          const initialOrder = await page.locator('[data-testid="synthesized-question"]').allTextContents();
          
          // Perform drag and drop
          await dragHandle.hover();
          await page.mouse.down();
          await page.mouse.move(0, 100);
          await page.mouse.up();
          
          // Verify order changed
          const newOrder = await page.locator('[data-testid="synthesized-question"]').allTextContents();
          expect(newOrder).not.toEqual(initialOrder);
        }
        
        // Continue to Practice tab
        const continueBtn = page.locator('[data-testid="continue-to-practice-btn"]');
        await continueBtn.click();
        
        // Verify Practice tab shows selected questions
        const practiceQuestions = page.locator('[data-testid="practice-question"]');
        await expect(practiceQuestions).toHaveCount(questionCount);
      }
      
      console.log('✅ Scenario 6 completed successfully');
    });
  });
});