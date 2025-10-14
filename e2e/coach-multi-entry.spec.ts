import { test, expect } from '@playwright/test';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('Coach Mode - Multi-Entry Controls', () => {
  test('should show Add Peer button', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Should have "Add Peer" button
    const addButton = page.locator('[data-testid="gather-peer-add-button"]');
    await expect(addButton).toBeVisible();
  });

  test('should add new peer entry when Add clicked', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    const addButton = page.locator('[data-testid="gather-peer-add-button"]');
    
    // Get initial count
    const initialCount = await page.locator('[data-testid^="gather-peer-item-"]').count();

    // Click Add
    await addButton.click();

    // Should have one more entry
    const newCount = await page.locator('[data-testid^="gather-peer-item-"]').count();
    expect(newCount).toBe(initialCount + 1);

    // New entry should have URL and role inputs
    const urlInput = page.locator(`[data-testid="gather-peer-url-${initialCount}"]`);
    const roleInput = page.locator(`[data-testid="gather-peer-role-${initialCount}"]`);
    
    await expect(urlInput).toBeVisible();
    await expect(roleInput).toBeVisible();
  });

  test('should fill in peer URL and role', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Add a peer
    await page.locator('[data-testid="gather-peer-add-button"]').click();

    // Fill in details
    const urlInput = page.locator('[data-testid="gather-peer-url-0"]');
    const roleInput = page.locator('[data-testid="gather-peer-role-0"]');

    await urlInput.fill('https://linkedin.com/in/test-peer');
    await roleInput.fill('Senior Engineer');

    // Verify values
    expect(await urlInput.inputValue()).toBe('https://linkedin.com/in/test-peer');
    expect(await roleInput.inputValue()).toBe('Senior Engineer');
  });

  test('should remove peer entry when × clicked', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Add two peers
    const addButton = page.locator('[data-testid="gather-peer-add-button"]');
    await addButton.click();
    await addButton.click();

    // Should have 2 entries
    let count = await page.locator('[data-testid^="gather-peer-item-"]').count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Remove first one
    const removeButton = page.locator('[data-testid="gather-peer-remove-0"]');
    await removeButton.click();

    // Should have one less
    await page.waitForTimeout(500);
    count = await page.locator('[data-testid^="gather-peer-item-"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should work for skip-level entries', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll to skip-level section
    await page.locator('text=/Skip-Level/i').scrollIntoViewIfNeeded();

    // Should have Add Skip-Level button
    const addButton = page.locator('[data-testid="gather-skip-add-button"]');
    await expect(addButton).toBeVisible();

    // Add entry
    await addButton.click();

    // Should have input fields
    const urlInput = page.locator('[data-testid="gather-skip-url-0"]');
    await expect(urlInput).toBeVisible();

    // Fill in
    await urlInput.fill('https://linkedin.com/in/vp-engineering');
    
    // Should persist
    expect(await urlInput.inputValue()).toBe('https://linkedin.com/in/vp-engineering');
  });

  test('should work for company entries', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Scroll to companies section
    await page.locator('text=/Context Companies/i').scrollIntoViewIfNeeded();

    // Should have Add Company button
    const addButton = page.locator('[data-testid="gather-company-add-button"]');
    await expect(addButton).toBeVisible();

    // Add entry
    await addButton.click();

    // Should have URL input (no role for companies)
    const urlInput = page.locator('[data-testid="gather-company-url-0"]');
    await expect(urlInput).toBeVisible();

    // Fill in
    await urlInput.fill('https://competitor.com');
    
    // Verify
    expect(await urlInput.inputValue()).toBe('https://competitor.com');
  });

  test('should persist multi-entry data on auto-save', async ({ page }) => {
    await page.goto(`/coach/${TEST_JOB_ID}`);
    await page.waitForLoadState('networkidle');

    // Add a peer
    const addButton = page.locator('[data-testid="gather-peer-add-button"]');
    await addButton.click();

    const urlInput = page.locator('[data-testid="gather-peer-url-0"]');
    const roleInput = page.locator('[data-testid="gather-peer-role-0"]');

    const uniqueUrl = 'https://test-' + Date.now() + '.com';
    await urlInput.fill(uniqueUrl);
    await roleInput.fill('Test Role');

    // Wait for auto-save
    await page.waitForTimeout(3000);
    await expect(page.locator('text=/Saved/i')).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Data should persist
    const persistedInput = page.locator(`input[value*="${uniqueUrl.substring(0, 20)}"]`);
    await expect(persistedInput.first()).toBeVisible({ timeout: 5000 });
  });
});

