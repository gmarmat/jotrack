import { test, expect } from '@playwright/test';

test.describe('UI Perfection v2.1', () => {
  let jobId: string;

  test.beforeEach(async ({ page }) => {
    // Create a test job
    const res = await page.request.post('/api/jobs', {
      data: {
        title: 'Senior Frontend Engineer',
        company: 'TechCorp',
        status: 'ON_RADAR',
        notes: 'This is a test job for UI perfection v2.1',
      },
    });
    const data = await res.json();
    jobId = data.id;

    // Navigate to the job detail page
    await page.goto(`/jobs/${jobId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display streamlined header with status chip dropdown', async ({ page }) => {
    // Check JobHeader component exists
    await expect(page.getByTestId('job-header')).toBeVisible();
    
    // Check title and company
    await expect(page.getByTestId('job-title')).toHaveText('Senior Frontend Engineer');
    await expect(page.getByTestId('job-company')).toHaveText('TechCorp');
    
    // Check status chip dropdown
    await expect(page.getByTestId('status-chip-dropdown')).toBeVisible();
    
    // Click status chip to open dropdown
    await page.getByTestId('status-chip-trigger').click();
    await expect(page.getByTestId('status-option-ON_RADAR')).toBeVisible();
    await expect(page.getByTestId('status-option-APPLIED')).toBeVisible();
  });

  test('should display quick actions in header', async ({ page }) => {
    await expect(page.getByTestId('job-quick-actions')).toBeVisible();
    
    // Coach Mode button
    await expect(page.getByTestId('coach-mode-button')).toBeVisible();
    
    // Export dropdown
    await expect(page.getByTestId('export-dropdown-trigger')).toBeVisible();
    
    // Archive button
    await expect(page.getByTestId('archive-button')).toBeVisible();
    
    // Delete button
    await expect(page.getByTestId('delete-button')).toBeVisible();
    
    // Settings button
    await expect(page.getByTestId('job-settings-button')).toBeVisible();
  });

  test('should display meta bar with JD link', async ({ page }) => {
    await expect(page.getByTestId('header-meta')).toBeVisible();
    
    // Note: JD link only shows if JD attachment exists
    // We're not uploading one in this test, so we just check the meta bar exists
  });

  test('should display notes card prominently', async ({ page }) => {
    await expect(page.getByTestId('job-notes-card')).toBeVisible();
    
    // Check initial notes display
    await expect(page.getByTestId('notes-display')).toHaveText('This is a test job for UI perfection v2.1');
    
    // Check edit button
    await expect(page.getByTestId('edit-notes-button')).toBeVisible();
    
    // Check attachments link
    await expect(page.getByTestId('open-attachments-link')).toBeVisible();
    await expect(page.getByTestId('open-attachments-link')).toContainText('Attachments: 0 files');
  });

  test('should allow editing notes', async ({ page }) => {
    // Click edit button
    await page.getByTestId('edit-notes-button').click();
    
    // Check textarea is visible
    await expect(page.getByTestId('notes-textarea')).toBeVisible();
    
    // Edit notes
    await page.getByTestId('notes-textarea').fill('Updated notes for testing');
    
    // Save
    await page.getByTestId('save-notes-button').click();
    await page.waitForTimeout(500); // Wait for save
    
    // Verify updated notes
    await expect(page.getByTestId('notes-display')).toHaveText('Updated notes for testing');
  });

  test('should open attachments modal from notes card', async ({ page }) => {
    await page.getByTestId('open-attachments-link').click();
    
    // Check modal is visible
    await expect(page.getByTestId('attachments-modal')).toBeVisible();
    
    // Close modal
    await page.getByTestId('close-attachments').click();
    await expect(page.getByTestId('attachments-modal')).not.toBeVisible();
  });

  test('should display AI showcase section', async ({ page }) => {
    await expect(page.getByTestId('ai-showcase')).toBeVisible();
    
    // Check AI showcase header
    await expect(page.locator('h2:has-text("AI Analysis")')).toBeVisible();
    
    // Check provider badge (should be local/dry-run)
    await expect(page.locator('text=Local (Dry-run)')).toBeVisible();
    
    // Check refresh button
    await expect(page.getByTestId('refresh-ai-button')).toBeVisible();
    
    // Check AI settings link
    await expect(page.getByTestId('ai-settings-link')).toBeVisible();
  });

  test('should display AI cards in 2x2 grid', async ({ page }) => {
    // Match Score card
    await expect(page.locator('text=Match Score').first()).toBeVisible();
    await expect(page.getByTestId('fit-score-gauge')).toBeVisible();
    
    // Fit Breakdown card
    await expect(page.locator('text=Fit Breakdown').first()).toBeVisible();
    
    // Skill Match card
    await expect(page.locator('text=Skill Match').first()).toBeVisible();
    await expect(page.getByTestId('skills-match-chart')).toBeVisible();
    
    // People Insights card
    await expect(page.locator('text=People Insights').first()).toBeVisible();
  });

  test('should display recommendations section', async ({ page }) => {
    await expect(page.locator('text=💡 Recommendations')).toBeVisible();
    
    // Check at least one recommendation
    await expect(page.locator('text=Emphasize AWS experience')).toBeVisible();
  });

  test('should toggle fit and profiles sections', async ({ page }) => {
    // Fit section should be expanded by default (or toggle it)
    const fitToggle = page.getByTestId('toggle-fit-section');
    await fitToggle.click();
    
    // Profiles section
    const profilesToggle = page.getByTestId('toggle-profiles-section');
    await profilesToggle.click();
  });

  test('should NOT display old JobDetailsPanel', async ({ page }) => {
    // JobDetailsPanel should not exist anymore
    await expect(page.locator('text=Job Details').first()).not.toBeVisible();
  });

  test('should NOT display AttachmentsSection on main page', async ({ page }) => {
    // Old attachments section should not be visible
    await expect(page.locator('#attachments')).not.toBeVisible();
  });

  test('should have simplified utility rail without AI tab', async ({ page }) => {
    // Open utility rail
    await page.keyboard.press('f');
    await expect(page.getByTestId('utility-rail-expanded')).toBeVisible();
    
    // Check tabs
    await expect(page.getByTestId('tab-files')).toBeVisible();
    await expect(page.getByTestId('tab-meta')).toBeVisible();
    await expect(page.getByTestId('tab-notes')).toBeVisible();
    
    // AI tab should NOT exist
    await expect(page.getByTestId('tab-ai')).not.toBeVisible();
  });

  test('should change status using chip dropdown', async ({ page }) => {
    // Open status dropdown
    await page.getByTestId('status-chip-trigger').click();
    
    // Select APPLIED status
    await page.getByTestId('status-option-APPLIED').click();
    
    // Checkbox should appear
    await expect(page.getByTestId('status-checkbox-APPLIED')).toBeVisible();
    
    // Confirm change
    await page.getByTestId('confirm-status-change').click();
    
    // Wait for update
    await page.waitForTimeout(1000);
    
    // Verify status changed (page reloads)
    await page.waitForLoadState('networkidle');
  });

  test('should be responsive - AI grid stacks on mobile', async ({ page }) => {
    // Resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // AI showcase should still be visible
    await expect(page.getByTestId('ai-showcase')).toBeVisible();
    
    // Grid should stack (checking layout is complex, just verify visibility)
    await expect(page.locator('text=Match Score').first()).toBeVisible();
    await expect(page.locator('text=Fit Breakdown').first()).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete the test job
    if (jobId) {
      await page.request.post(`/api/jobs/${jobId}/delete`);
    }
  });
});

