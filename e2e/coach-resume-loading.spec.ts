import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Coach Mode - Resume/JD Loading', () => {
  test('should pre-populate JD from attachment', async ({ page }) => {
    // Navigate to coach mode
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Wait for JD preview to load
    const jdPreview = page.locator('[data-testid="preview-jd"]');
    await expect(jdPreview).toBeVisible({ timeout: 10000 });

    // Should show content from attachment
    const jdContent = await jdPreview.textContent();
    expect(jdContent).toBeTruthy();
    expect(jdContent!.length).toBeGreaterThan(50); // Should have substantial content
  });

  test('should pre-populate Resume from attachment', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Wait for Resume preview to load
    const resumePreview = page.locator('[data-testid="preview-resume"]');
    await expect(resumePreview).toBeVisible({ timeout: 10000 });

    // Should show content from attachment
    const resumeContent = await resumePreview.textContent();
    expect(resumeContent).toBeTruthy();
    expect(resumeContent!.length).toBeGreaterThan(50);
  });

  test('should show Edit button for pre-populated content', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // JD section should have Edit button
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible();
  });

  test('should unlock field when Edit is clicked', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Click Edit button
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();

    // Textarea should become editable
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeEditable();
  });

  test('should show Update Baseline and Revert buttons when edited', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Click Edit
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();

    // Make a change
    const textarea = page.locator('textarea').first();
    await textarea.fill('Updated content for testing');

    // Should show Update Baseline and Revert buttons
    await expect(page.locator('button:has-text("Update Baseline")')).toBeVisible();
    await expect(page.locator('button:has-text("Revert")')).toBeVisible();
  });

  test('should revert changes when Revert clicked', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Get original content
    const jdPreview = page.locator('[data-testid="preview-jd"]');
    const originalContent = await jdPreview.textContent();

    // Click Edit
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();

    // Change content
    const textarea = page.locator('textarea').first();
    await textarea.fill('Different content');

    // Click Revert
    await page.locator('button:has-text("Revert")').click();

    // Content should be back to original
    const revertedContent = await textarea.inputValue();
    expect(revertedContent).toContain(originalContent?.substring(0, 50) || '');
  });
});

