import { test, expect } from '@playwright/test';

test.describe('Complete UI Layout v2.2', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'Software Architect',
        company: 'UITest Solutions',
        status: 'APPLIED',
        notes: 'Comprehensive UI testing',
      },
    });
    const data = await res.json();
    jobId = data.id;

    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should have complete job detail page structure', async ({ page }) => {
    // Timeline at top
    await expect(page.locator('text=On Radar')).toBeVisible();
    
    // Header meta with dates
    await expect(page.getByTestId('header-meta')).toBeVisible();

    // Job header with title, company, status
    await expect(page.getByTestId('job-header')).toBeVisible();
    await expect(page.getByTestId('job-title')).toHaveText('Software Architect');
    await expect(page.getByTestId('job-company')).toHaveText('UITest Solutions');

    // Notes card
    await expect(page.getByTestId('job-notes-card')).toBeVisible();

    // AI Showcase
    await expect(page.getByTestId('ai-showcase')).toBeVisible();
  });

  test('should display all quick actions in header', async ({ page }) => {
    await expect(page.getByTestId('job-quick-actions')).toBeVisible();
    
    // Coach Mode button
    await expect(page.getByTestId('coach-mode-button')).toBeVisible();
    
    // Export dropdown
    await expect(page.getByTestId('export-dropdown-trigger')).toBeVisible();
    
    // Archive button
    await expect(page.getByTestId('archive-button')).toBeVisible();
    
    // Delete button
    await expect(page.getByTestId('delete-button')).toBeVisible();
  });

  test('should display notes card with edit capability', async ({ page }) => {
    const notesCard = page.getByTestId('job-notes-card');
    await expect(notesCard).toBeVisible();

    // Edit button
    await expect(page.getByTestId('edit-notes-button')).toBeVisible();

    // Attachments link
    await expect(page.getByTestId('open-attachments-link')).toBeVisible();
  });

  test('should display AI Analysis with all sections', async ({ page }) => {
    const aiShowcase = page.getByTestId('ai-showcase');
    await expect(aiShowcase).toBeVisible();

    // Match Score section
    await expect(page.locator('h3:has-text("Match Score")').first()).toBeVisible();
    await expect(page.getByTestId('match-score-gauge')).toBeVisible();

    // Skill Match section
    await expect(page.locator('h3:has-text("Skill Match")').first()).toBeVisible();
    await expect(page.getByTestId('skills-match-chart')).toBeVisible();

    // Match Score Breakdown (full width)
    await expect(page.locator('h3:has-text("Match Score Breakdown")')).toBeVisible();

    // People Insights (full width)
    await expect(page.locator('h3:has-text("People Insights")')).toBeVisible();
  });

  test('should have AInalyze button and AI settings link', async ({ page }) => {
    await expect(page.getByTestId('ainalyze-button')).toBeVisible();
    await expect(page.getByTestId('ai-settings-link')).toBeVisible();
  });

  test('should open attachments modal from notes card', async ({ page }) => {
    await page.getByTestId('open-attachments-link').click();

    // Modal should open
    await expect(page.getByTestId('attachments-modal')).toBeVisible();

    // Close modal
    await page.getByTestId('close-attachments').click();
    await expect(page.getByTestId('attachments-modal')).not.toBeVisible();
  });

  test('should NOT have old JobDetailsPanel', async ({ page }) => {
    // Old details panel should not exist
    await expect(page.locator('#job-details-panel')).not.toBeVisible();
  });

  test('should NOT have old AttachmentsSection on main page', async ({ page }) => {
    // Old inline attachments section should not exist
    await expect(page.locator('#attachments')).not.toBeVisible();
  });

  test('should be responsive - AI grid stacks on mobile', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // AI Showcase should still be visible
    await expect(page.getByTestId('ai-showcase')).toBeVisible();
    
    // Match Score should be visible
    await expect(page.getByTestId('match-score-gauge')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

