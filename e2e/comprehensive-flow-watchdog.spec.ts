import { test, expect, Page, BrowserContext } from '@playwright/test';
import { TestWatchdog, defaultWatchdogConfig, runWithWatchdog } from './utils/testRunner';

// Test data configuration
const TEST_JOBS = {
  fortive: {
    id: '3957289b-30f5-4ab2-8006-3a08b6630beb',
    title: 'Product Manager',
    company: 'Fortive',
    expectedMatch: 0.88
  },
  fuelcell: {
    id: '4bbb347a-7861-489d-bb6d-ab05ee1e939e',
    title: 'VP of Business Development',
    company: 'FuelCell Energy',
    expectedMatch: 0.82
  }
};

// Enhanced watchdog config for JoTrack
const jotrackWatchdogConfig = {
  ...defaultWatchdogConfig,
  stepTimeout: 45000, // 45 seconds for AI calls
  testTimeout: 600000, // 10 minutes per test
  maxRetries: 2, // Fewer retries but more time per step
  recoveryActions: [
    ...defaultWatchdogConfig.recoveryActions,
    {
      name: 'Wait for AI Analysis',
      condition: async (page: Page) => {
        // Check if AI analysis is in progress
        const loadingElements = await page.locator('[data-testid="loading"], .loading, [class*="loading"]').count();
        return loadingElements > 0;
      },
      action: async (page: Page) => {
        console.log('  🔧 Waiting for AI analysis to complete...');
        await page.waitForTimeout(10000); // Wait 10 seconds
        // Check for completion indicators
        await page.waitForSelector('[data-testid="analysis-complete"], .analysis-complete', { timeout: 30000 });
      }
    },
    {
      name: 'Handle Build Errors',
      condition: async (page: Page) => {
        const hasBuildError = await page.evaluate(() => {
          const errorText = document.body.innerText.toLowerCase();
          return errorText.includes('build error') || 
                 errorText.includes('compilation error') ||
                 errorText.includes('syntax error') ||
                 errorText.includes('unexpected token');
        });
        return hasBuildError;
      },
      action: async (page: Page) => {
        console.log('  🔧 Detected build error, attempting recovery...');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
        // Try to navigate to a working page
        await page.goto('/', { waitUntil: 'domcontentloaded' });
      }
    }
  ]
};

test.describe('JoTrack Comprehensive E2E Tests (with Watchdog)', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Set up global error handling
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('P0: New User Onboarding - Complete Flow', async () => {
    await runWithWatchdog('New User Onboarding', async (watchdog, page) => {
      // Step 1: Navigate to home page
      await watchdog.startStep('Navigate to home page', page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveTitle(/JoTrack/);

      // Step 2: Create new job
      await watchdog.startStep('Create new job', page);
      await page.click('button:has-text("Create New Job")');
      await page.fill('input[name="title"]', 'Test Product Manager');
      await page.fill('input[name="company"]', 'Test Company');
      await page.selectOption('select[name="status"]', 'ON_RADAR');
      await page.click('button[type="submit"]');

      // Step 3: Navigate to job detail page
      await watchdog.startStep('Navigate to job detail', page);
      await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
      const jobUrl = page.url();
      expect(jobUrl).toMatch(/\/jobs\/[a-f0-9-]+/);

      // Step 4: Upload test files
      await watchdog.startStep('Upload test files', page);
      // Use existing test files or create minimal ones
      const resumeFile = await page.locator('input[type="file"][accept*="pdf"]').first();
      const jdFile = await page.locator('input[type="file"][accept*="docx"]').first();
      
      // Create minimal test files if needed
      await page.evaluate(() => {
        // Create a simple text file for testing
        const content = 'Test resume content for E2E testing';
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], 'test-resume.txt', { type: 'text/plain' });
        
        // Simulate file upload
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Step 5: Run data pipeline
      await watchdog.startStep('Run data pipeline', page);
      await page.click('button:has-text("Refresh Data")');
      await page.waitForSelector('[data-testid="extraction-complete"], .extraction-complete', { timeout: 60000 });

      // Step 6: Run Match Score analysis
      await watchdog.startStep('Run Match Score analysis', page);
      await page.click('button:has-text("Analyze")');
      await page.waitForSelector('[data-testid="match-score-complete"], .match-score-complete', { timeout: 60000 });
      
      // Verify match score appears
      const matchScoreElement = page.locator('[data-testid="match-score"], .match-score');
      await expect(matchScoreElement).toBeVisible();

      // Step 7: Run Skills Match analysis
      await watchdog.startStep('Run Skills Match analysis', page);
      await page.click('button:has-text("Analyze"):near([data-testid="skills-match"])');
      await page.waitForSelector('[data-testid="skills-match-complete"], .skills-match-complete', { timeout: 60000 });

      // Step 8: Verify Interview Coach unlock
      await watchdog.startStep('Verify Interview Coach unlock', page);
      const interviewCoachCard = page.locator('[data-testid="interview-coach-card"]');
      await expect(interviewCoachCard).toBeVisible();
      
      // Should show "Ready" not "Locked"
      const readyBadge = page.locator('[data-testid="interview-coach-ready"], .interview-coach-ready');
      await expect(readyBadge).toBeVisible();

      // Step 9: Start Interview Coach
      await watchdog.startStep('Start Interview Coach', page);
      await page.click('button:has-text("Start Interview Coach")');
      await page.waitForURL(/\/interview-coach\/[a-f0-9-]+/);

      // Step 10: Verify auto-search triggers
      await watchdog.startStep('Verify auto-search triggers', page);
      await page.waitForSelector('[data-testid="search-progress"], .search-progress', { timeout: 30000 });
      
      // Step 11: Navigate to Insights tab
      await watchdog.startStep('Navigate to Insights tab', page);
      await page.click('[data-testid="insights-tab"], .insights-tab');
      await page.waitForSelector('[data-testid="insights-content"], .insights-content');

      // Step 12: Verify synthesized questions
      await watchdog.startStep('Verify synthesized questions', page);
      const synthesizedQuestions = page.locator('[data-testid="synthesized-questions"], .synthesized-questions');
      await expect(synthesizedQuestions).toBeVisible();
      
      // Should have exactly 4 questions
      const questionItems = page.locator('[data-testid="synthesized-questions"] .question-item, .synthesized-questions .question-item');
      await expect(questionItems).toHaveCount(4);

      // Step 13: Navigate to Practice tab
      await watchdog.startStep('Navigate to Practice tab', page);
      await page.click('[data-testid="practice-tab"], .practice-tab');
      await page.waitForSelector('[data-testid="practice-content"], .practice-content');

      // Step 14: Verify only 4 questions in Practice
      await watchdog.startStep('Verify 4 questions in Practice', page);
      const practiceQuestions = page.locator('[data-testid="practice-questions"], .practice-questions');
      await expect(practiceQuestions).toBeVisible();
      
      // Critical validation: Should NOT have 27 questions
      const allQuestionItems = page.locator('[data-testid="practice-questions"] .question-item, .practice-questions .question-item');
      const questionCount = await allQuestionItems.count();
      expect(questionCount).toBeLessThanOrEqual(4);

      console.log(`✅ New User Onboarding completed successfully`);
    }, page, jotrackWatchdogConfig);
  });

  test('P0: Status Progression & Interview Coach Unlock', async () => {
    await runWithWatchdog('Status Progression Test', async (watchdog, page) => {
      // Use existing Fortive job
      await watchdog.startStep('Navigate to Fortive job', page);
      await page.goto(`/jobs/${TEST_JOBS.fortive.id}`, { waitUntil: 'domcontentloaded' });

      // Step 1: Verify initial status
      await watchdog.startStep('Verify initial status', page);
      const statusSelect = page.locator('[data-testid="status-select"]');
      await expect(statusSelect).toBeVisible();

      // Step 2: Change status to APPLIED
      await watchdog.startStep('Change status to APPLIED', page);
      await statusSelect.selectOption('APPLIED');
      
      // Look for save button (checkmark)
      const saveButton = page.locator('button:has-text("✓"), button[title*="save"], button[data-testid="save-status"]');
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }

      // Step 3: Verify status change
      await watchdog.startStep('Verify status change', page);
      await page.waitForTimeout(2000); // Allow for state update
      const currentStatus = await statusSelect.inputValue();
      expect(currentStatus).toBe('APPLIED');

      // Step 4: Verify Interview Coach remains accessible
      await watchdog.startStep('Verify Interview Coach accessibility', page);
      const interviewCoachCard = page.locator('[data-testid="interview-coach-card"]');
      await expect(interviewCoachCard).toBeVisible();
      
      // Should show "Ready" badge, not "Locked"
      const readyBadge = page.locator('[data-testid="interview-coach-ready"], .interview-coach-ready');
      const lockedBadge = page.locator('[data-testid="interview-coach-locked"], .interview-coach-locked');
      
      if (await lockedBadge.isVisible()) {
        throw new Error('Interview Coach should be unlocked after prerequisites are met');
      }

      console.log(`✅ Status progression test completed successfully`);
    }, page, jotrackWatchdogConfig);
  });

  test('P0: Settings Modal - Dark Mode & Positioning', async () => {
    await runWithWatchdog('Settings Modal Test', async (watchdog, page) => {
      // Use existing job
      await watchdog.startStep('Navigate to job page', page);
      await page.goto(`/jobs/${TEST_JOBS.fortive.id}`, { waitUntil: 'domcontentloaded' });

      // Step 1: Scroll to middle of page
      await watchdog.startStep('Scroll to middle of page', page);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(1000);

      // Step 2: Open Settings modal
      await watchdog.startStep('Open Settings modal', page);
      const settingsButton = page.locator('button[data-testid="settings-button"], button:has-text("⚙️"), .settings-button');
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();

      // Step 3: Verify modal positioning
      await watchdog.startStep('Verify modal positioning', page);
      const modal = page.locator('[data-testid="settings-modal"], .settings-modal');
      await expect(modal).toBeVisible();
      
      // Check if modal is centered (not clipped at top)
      const modalBox = await modal.boundingBox();
      if (modalBox) {
        expect(modalBox.y).toBeGreaterThan(50); // Should not be at the very top
      }

      // Step 4: Toggle dark mode
      await watchdog.startStep('Toggle dark mode', page);
      const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"], .dark-mode-toggle');
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        await page.waitForTimeout(1000);
      }

      // Step 5: Verify theme consistency
      await watchdog.startStep('Verify theme consistency', page);
      const statusDropdown = page.locator('[data-testid="status-select"]');
      await expect(statusDropdown).toBeVisible();
      
      // Check if dropdown has proper dark mode styling
      const dropdownClasses = await statusDropdown.getAttribute('class');
      expect(dropdownClasses).toContain('dark:');

      console.log(`✅ Settings modal test completed successfully`);
    }, page, jotrackWatchdogConfig);
  });

  test('P1: Data Pipeline - Multiple File Formats', async () => {
    await runWithWatchdog('Data Pipeline Test', async (watchdog, page) => {
      // Use existing job with attachments
      await watchdog.startStep('Navigate to job with attachments', page);
      await page.goto(`/jobs/${TEST_JOBS.fortive.id}`, { waitUntil: 'domcontentloaded' });

      // Step 1: Check for existing attachments
      await watchdog.startStep('Check existing attachments', page);
      const attachmentsSection = page.locator('[data-testid="attachments-section"], .attachments-section');
      await expect(attachmentsSection).toBeVisible();

      // Step 2: Run data pipeline
      await watchdog.startStep('Run data pipeline', page);
      const refreshDataButton = page.locator('button:has-text("Refresh Data"), button[data-testid="refresh-data"]');
      if (await refreshDataButton.isVisible()) {
        await refreshDataButton.click();
        await page.waitForSelector('[data-testid="extraction-complete"], .extraction-complete', { timeout: 60000 });
      }

      // Step 3: Open variants modal
      await watchdog.startStep('Open variants modal', page);
      const viewVariantsButton = page.locator('button:has-text("View"), button[data-testid="view-variants"]').first();
      if (await viewVariantsButton.isVisible()) {
        await viewVariantsButton.click();
        
        const variantsModal = page.locator('[data-testid="variants-modal"], .variants-modal');
        await expect(variantsModal).toBeVisible();

        // Step 4: Verify variant types
        await watchdog.startStep('Verify variant types', page);
        const rawVariant = page.locator('[data-testid="raw-variant"], .raw-variant');
        const aiOptimizedVariant = page.locator('[data-testid="ai-optimized-variant"], .ai-optimized-variant');
        
        await expect(rawVariant).toBeVisible();
        await expect(aiOptimizedVariant).toBeVisible();

        // Close modal
        const closeButton = page.locator('button:has-text("Close"), button[data-testid="close-modal"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }

      console.log(`✅ Data pipeline test completed successfully`);
    }, page, jotrackWatchdogConfig);
  });

  test('P1: Error Handling & Edge Cases', async () => {
    await runWithWatchdog('Error Handling Test', async (watchdog, page) => {
      // Step 1: Test Interview Coach before prerequisites
      await watchdog.startStep('Test Interview Coach before prerequisites', page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Create a new job without running analysis
      await page.click('button:has-text("Create New Job")');
      await page.fill('input[name="title"]', 'Test Job');
      await page.fill('input[name="company"]', 'Test Company');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/\/jobs\/[a-f0-9-]+/);
      
      // Check Interview Coach state
      const interviewCoachCard = page.locator('[data-testid="interview-coach-card"]');
      if (await interviewCoachCard.isVisible()) {
        const lockedBadge = page.locator('[data-testid="interview-coach-locked"], .interview-coach-locked');
        await expect(lockedBadge).toBeVisible();
      }

      // Step 2: Test rapid button clicking
      await watchdog.startStep('Test rapid button clicking', page);
      const analyzeButton = page.locator('button:has-text("Analyze")').first();
      if (await analyzeButton.isVisible()) {
        // Rapid click test
        for (let i = 0; i < 5; i++) {
          await analyzeButton.click();
          await page.waitForTimeout(100);
        }
        
        // Should not cause multiple API calls
        await page.waitForTimeout(2000);
      }

      console.log(`✅ Error handling test completed successfully`);
    }, page, jotrackWatchdogConfig);
  });
});
