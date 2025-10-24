import { test, expect, Page } from '@playwright/test';
import { setupTestJobWithPrerequisites, cleanupTestJob } from './helpers/interview-coach-helpers';

test.describe('Interview Coach V2 PX Extensions E2E', () => {
  let testJobId: string;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test.beforeAll(async () => {
    testJobId = await setupTestJobWithPrerequisites();
    console.log(`📦 Test job created for V2 PX extensions: ${testJobId}`);
  });

  test.afterAll(async () => {
    await cleanupTestJob(testJobId);
    console.log(`🧹 Test job cleaned up for V2 PX extensions: ${testJobId}`);
  });

  test('should successfully test PX extension features: Your Work drawer, Interviewer Profile, Cross-Persona Compare, and Guided Tutorial', async ({ page }) => {
    console.log('\n🎯 TESTING: Interview Coach V2 PX Extensions\n');

    await page.goto(`${baseUrl}/interview-coach/${testJobId}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    await page.waitForSelector('[data-testid="persona-selector"]', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Interview Coach');

    // 1. Test Guided Tutorial (if shown for new users)
    const tutorialButton = page.locator('button', { hasText: 'Start Tutorial' });
    if (await tutorialButton.isVisible()) {
      console.log('✅ Guided Tutorial button visible');
      await tutorialButton.click();
      await page.waitForSelector('[data-testid="guided-tutorial"]', { timeout: 5000 });
      console.log('✅ Guided Tutorial modal opened');
      // Close tutorial for now
      await page.locator('button', { hasText: 'Skip Tutorial' }).click();
    }

    // 2. Select Recruiter persona pill
    await page.locator('[data-testid="persona-pill"]', { hasText: 'Recruiter' }).click();
    await expect(page.locator('[data-testid="persona-pill"]', { hasText: 'Recruiter' })).toHaveClass(/border-purple-500/);
    console.log('✅ Selected Recruiter persona');

    // 3. Verify Interviewer Profile Card appears
    await page.waitForSelector('[data-testid="interviewer-profile-card"]', { timeout: 10000 });
    const profileCard = page.locator('[data-testid="interviewer-profile-card"]');
    await expect(profileCard).toBeVisible();
    
    // Check that profile card has name and at least one tag
    const profileName = profileCard.locator('text=/Tushar|Chelsea|Samir/');
    await expect(profileName).toBeVisible();
    console.log('✅ Interviewer Profile Card visible with name');
    
    // Check for at least one tag (values, focus areas, or decision factors)
    const profileTags = profileCard.locator('[class*="bg-"]').first();
    await expect(profileTags).toBeVisible();
    console.log('✅ Interviewer Profile Card has tags');

    // 4. Enter answer and Analyze
    const answerText = "I led a project to migrate our legacy database to a new cloud-based solution. It was challenging but we finished it.";
    await page.locator('[data-testid="answer-textarea"]').fill(answerText);
    await page.locator('[data-testid="analyze-button"]').click();

    // Expect score display
    await page.waitForSelector('[data-testid="score-display"]', { timeout: 30000 });
    const scoreText = await page.locator('[data-testid="score-display"]').textContent();
    expect(scoreText).toMatch(/\d+\/100/);
    console.log(`✅ Answer analyzed. Score: ${scoreText}`);

    // 5. Save Snapshot
    await page.waitForSelector('[data-testid="save-snapshot-button"]', { timeout: 10000 });
    await page.locator('[data-testid="save-snapshot-button"]').click();

    // Expect success toast
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(/Snapshot saved: snapshot_/);
    console.log('✅ Snapshot saved successfully');

    // 6. Test Your Work Drawer
    await page.locator('[data-testid="your-work-button"]').click();
    await page.waitForSelector('[data-testid="snapshot-card"]', { timeout: 10000 });
    
    // Verify snapshot card is visible
    const snapshotCard = page.locator('[data-testid="snapshot-card"]').first();
    await expect(snapshotCard).toBeVisible();
    console.log('✅ Your Work drawer opened with snapshot card');

    // 7. Test Snapshot Comparison
    // Click on the first snapshot to select it
    await snapshotCard.click();
    
    // Create another snapshot for comparison
    await page.locator('[data-testid="your-work-button"]').click(); // Close drawer
    await page.locator('[data-testid="save-snapshot-button"]').click(); // Save another snapshot
    await page.waitForSelector('[data-testid="success-toast"]', { timeout: 10000 });
    
    // Open drawer again
    await page.locator('[data-testid="your-work-button"]').click();
    await page.waitForSelector('[data-testid="snapshot-card"]', { timeout: 10000 });
    
    // Select two snapshots for comparison
    const snapshotCards = page.locator('[data-testid="snapshot-card"]');
    await snapshotCards.nth(0).click();
    await snapshotCards.nth(1).click();
    
    // Verify compare modal opens
    await page.waitForSelector('[data-testid="snapshot-compare-modal"]', { timeout: 10000 });
    const compareModal = page.locator('[data-testid="snapshot-compare-modal"]');
    await expect(compareModal).toBeVisible();
    console.log('✅ Snapshot comparison modal opened');

    // Close comparison modal
    await page.locator('button', { hasText: 'Close' }).click();
    await page.locator('[data-testid="your-work-button"]').click(); // Close drawer

    // 8. Test Cross-Persona Compare in Talk Tracks
    await page.locator('button', { hasText: 'Talk Tracks' }).click();
    await page.waitForSelector('[data-testid="generate-talk-tracks"]', { timeout: 10000 });
    await page.locator('[data-testid="generate-talk-tracks"]').click();

    // Expect stories to be visible
    await page.waitForSelector('[data-testid="talk-track-story"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="talk-track-story"]')).toHaveCount(expect.any(Number));
    console.log('✅ Talk Tracks generated and visible');

    // Test Cross-Persona Compare toggle
    await page.locator('[data-testid="compare-personas-toggle"]').click();
    
    // Verify comparison view is shown
    const compareView = page.locator('text=Cross-Persona Comparison');
    await expect(compareView).toBeVisible();
    console.log('✅ Cross-Persona Compare view toggled');

    // Verify all three personas are shown
    await expect(page.locator('text=Recruiter')).toBeVisible();
    await expect(page.locator('text=Hiring Manager')).toBeVisible();
    await expect(page.locator('text=Peer')).toBeVisible();
    console.log('✅ All three personas displayed in comparison');

    await page.screenshot({
      path: 'playwright-report/interview-coach-v2-px-extensions-final.png',
      fullPage: true
    });
    console.log('🏁 V2 PX Extensions E2E Test Completed Successfully!');
  });
});
