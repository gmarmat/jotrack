import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Coach Mode - Auto-Save', () => {
  test('should show save status banner', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Save status banner should be visible
    const saveBanner = page.locator('text=/Sav(ing|ed)/i');
    await expect(saveBanner).toBeVisible({ timeout: 5000 });
  });

  test('should show "Saving..." when typing', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Click Edit to unlock JD field
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // Type in a field
    const textarea = page.locator('textarea').first();
    await textarea.fill('Testing auto-save functionality');

    // Should show "Saving..." status
    const savingStatus = page.locator('text=/Saving/i');
    await expect(savingStatus).toBeVisible({ timeout: 3000 });
  });

  test('should show "Saved ✓" after save completes', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Click Edit
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // Make a change
    const textarea = page.locator('textarea').first();
    await textarea.fill('Testing save completion');

    // Wait for save to complete
    await page.waitForTimeout(3000);

    // Should show "Saved" status
    const savedStatus = page.locator('text=/Saved/i');
    await expect(savedStatus).toBeVisible();
  });

  test('should update timestamp after save', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Get initial timestamp if visible
    const timestampLocator = page.locator('text=/Last saved/i, text=/ago/i');
    
    // Make a change
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    const textarea = page.locator('textarea').first();
    await textarea.fill('Update to trigger save ' + Date.now());

    // Wait for save
    await page.waitForTimeout(3000);

    // Timestamp should be visible
    await expect(timestampLocator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should persist changes after page reload', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const uniqueText = 'Persistence test ' + Date.now();

    // Make a change
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    const textarea = page.locator('textarea').first();
    await textarea.fill(uniqueText);

    // Wait for save
    await page.waitForTimeout(3000);
    await expect(page.locator('text=/Saved/i')).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Content should persist
    const content = await page.locator('textarea').first().inputValue();
    expect(content).toContain(uniqueText);
  });
});

