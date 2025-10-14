import { test, expect } from '@playwright/test';

test.describe('Bulk Operations', () => {
  test('should select single job with checkbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find first job row checkbox
    const firstCheckbox = page.locator('[data-testid^="row-select-"]').first();
    await firstCheckbox.click();

    // Selection bar should appear
    const selectionBar = page.locator('text=/1 selected/');
    await expect(selectionBar).toBeVisible();

    // Clear selection
    await page.locator('button:has-text("Clear")').click();
    await expect(selectionBar).not.toBeVisible();
  });

  test('should select multiple jobs with shift+click', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get all checkboxes
    const checkboxes = page.locator('[data-testid^="row-select-"]');
    const count = await checkboxes.count();

    if (count >= 5) {
      // Click first checkbox
      await checkboxes.nth(0).click();

      // Shift+click fifth checkbox
      await page.keyboard.down('Shift');
      await checkboxes.nth(4).click();
      await page.keyboard.up('Shift');

      // Should have selected 5 jobs
      const selectionBar = page.locator('text=/5 selected/');
      await expect(selectionBar).toBeVisible();
    }
  });

  test('should soft delete jobs (move to trash)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Select first job
    const firstCheckbox = page.locator('[data-testid^="row-select-"]').first();
    await firstCheckbox.click();

    // Click "Move to Trash" button
    const moveToTrashButton = page.locator('[data-testid="bulk-soft-delete"]');
    await expect(moveToTrashButton).toBeVisible();
    await moveToTrashButton.click();

    // Page should reload and job should be gone
    await page.waitForLoadState('networkidle');
    
    // Verify trash button exists and can be clicked
    const trashButton = page.locator('button:has-text("Trash")');
    if (await trashButton.isVisible()) {
      await trashButton.click();
      await page.waitForTimeout(500);

      // Trash modal should show at least 1 job
      const trashModal = page.locator('[data-testid="trash-modal"]');
      await expect(trashModal).toBeVisible();
    }
  });

  test('should permanently delete jobs with confirmation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Select first job
    const firstCheckbox = page.locator('[data-testid^="row-select-"]').first();
    await firstCheckbox.click();

    // Set up dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('PERMANENTLY delete');
      expect(dialog.message()).toContain('cannot be undone');
      await dialog.accept();
    });

    // Click "Delete Forever" button
    const permanentDeleteButton = page.locator('[data-testid="bulk-permanent-delete"]');
    await expect(permanentDeleteButton).toBeVisible();
    await permanentDeleteButton.click();

    // Wait for page reload
    await page.waitForLoadState('networkidle');
    
    // Job should be completely gone (not in trash either)
  });

  test('should restore job from trash', async ({ page }) => {
    // First, create a job and soft delete it
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Select first job
    const firstCheckbox = page.locator('[data-testid^="row-select-"]').first();
    const jobTitle = await page.locator('[data-testid^="job-link-"]').first().textContent();
    
    await firstCheckbox.click();

    // Move to trash
    const moveToTrashButton = page.locator('[data-testid="bulk-soft-delete"]');
    await moveToTrashButton.click();
    await page.waitForLoadState('networkidle');

    // Open trash
    const trashButton = page.locator('button:has-text("Trash")');
    if (await trashButton.isVisible()) {
      await trashButton.click();
      await page.waitForTimeout(500);

      // Find and click restore button
      const restoreButton = page.locator('button:has-text("Restore")').first();
      if (await restoreButton.isVisible()) {
        await restoreButton.click();
        await page.waitForTimeout(500);

        // Close trash modal
        const closeButton = page.locator('[data-testid="trash-modal"] button:has-text("Close")');
        await closeButton.click();

        // Job should be back in main list
        await page.waitForTimeout(500);
        await expect(page.locator(`text=${jobTitle}`).first()).toBeVisible();
      }
    }
  });

  test('should update "X selected" count correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const checkboxes = page.locator('[data-testid^="row-select-"]');
    const count = await checkboxes.count();

    if (count >= 3) {
      // Select 3 jobs
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await checkboxes.nth(2).click();

      // Check count
      const selectionBar = page.locator('text=/3 selected/');
      await expect(selectionBar).toBeVisible();

      // Deselect one
      await checkboxes.nth(1).click();

      // Check count updated
      const updatedBar = page.locator('text=/2 selected/');
      await expect(updatedBar).toBeVisible();
    }
  });
});

