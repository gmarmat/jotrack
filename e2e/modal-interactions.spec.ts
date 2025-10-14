import { test, expect } from '@playwright/test';

test.describe('Modal Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for jobs to load
    await page.waitForSelector('[data-testid="job-row"]');
  });

  test('should close modal with ESC key', async ({ page }) => {
    // Open attachments modal by clicking on a job's attachment link
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    const attachmentLink = firstJobRow.locator('a[href*="attachments"]');
    await attachmentLink.click();
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="attachments-modal"]')).toBeVisible();
    
    // Press ESC key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('[data-testid="attachments-modal"]')).not.toBeVisible();
  });

  test('should close modal by clicking outside', async ({ page }) => {
    // Open attachments modal
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    const attachmentLink = firstJobRow.locator('a[href*="attachments"]');
    await attachmentLink.click();
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="attachments-modal"]')).toBeVisible();
    
    // Click outside the modal (on the backdrop)
    const modalBackdrop = page.locator('.fixed.inset-0');
    await modalBackdrop.click();
    
    // Modal should close
    await expect(page.locator('[data-testid="attachments-modal"]')).not.toBeVisible();
  });

  test('should not close modal when clicking inside', async ({ page }) => {
    // Open attachments modal
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    const attachmentLink = firstJobRow.locator('a[href*="attachments"]');
    await attachmentLink.click();
    
    // Wait for modal to open
    const modal = page.locator('[data-testid="attachments-modal"]');
    await expect(modal).toBeVisible();
    
    // Click inside the modal content
    const modalContent = modal.locator('.bg-white, .bg-blue-50, .bg-gray-800').first();
    await modalContent.click();
    
    // Modal should still be open
    await expect(modal).toBeVisible();
  });

  test('should close modal with X button', async ({ page }) => {
    // Open attachments modal
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    const attachmentLink = firstJobRow.locator('a[href*="attachments"]');
    await attachmentLink.click();
    
    // Wait for modal to open
    const modal = page.locator('[data-testid="attachments-modal"]');
    await expect(modal).toBeVisible();
    
    // Find and click the X button
    const closeButton = modal.locator('button').filter({ hasText: '×' }).or(
      modal.locator('button[aria-label*="close" i]')
    ).or(
      modal.locator('button').filter({ has: page.locator('svg') }).first()
    );
    
    await closeButton.click();
    
    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test('should handle ESC key in Global Settings modal', async ({ page }) => {
    // Open Global Settings modal
    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await settingsButton.click();
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="global-settings-modal"]')).toBeVisible();
    
    // Press ESC key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('[data-testid="global-settings-modal"]')).not.toBeVisible();
  });

  test('should handle click-outside in Global Settings modal', async ({ page }) => {
    // Open Global Settings modal
    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await settingsButton.click();
    
    // Wait for modal to open
    const modal = page.locator('[data-testid="global-settings-modal"]');
    await expect(modal).toBeVisible();
    
    // Click outside the modal
    const modalBackdrop = page.locator('.fixed.inset-0');
    await modalBackdrop.click();
    
    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test('should handle ESC key in History modal', async ({ page }) => {
    // Open History modal by clicking on a job's history button
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    const historyButton = firstJobRow.locator('[data-testid*="history-btn"]');
    await historyButton.click();
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="history-modal"]')).toBeVisible();
    
    // Press ESC key
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('[data-testid="history-modal"]')).not.toBeVisible();
  });

  test('should handle multiple modals correctly', async ({ page }) => {
    // Open first modal (attachments)
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    const attachmentLink = firstJobRow.locator('a[href*="attachments"]');
    await attachmentLink.click();
    
    await expect(page.locator('[data-testid="attachments-modal"]')).toBeVisible();
    
    // Open second modal (settings) - should open on top
    const settingsButton = page.locator('[data-testid="global-settings-button"]');
    await settingsButton.click();
    
    // Both modals should be visible, but settings should be on top
    await expect(page.locator('[data-testid="attachments-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="global-settings-modal"]')).toBeVisible();
    
    // ESC should close the top modal (settings) first
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="global-settings-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="attachments-modal"]')).toBeVisible();
    
    // ESC again should close the attachments modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="attachments-modal"]')).not.toBeVisible();
  });

  test('should maintain scroll behavior in modals', async ({ page }) => {
    // Open attachments modal
    const firstJobRow = page.locator('[data-testid="job-row"]').first();
    const attachmentLink = firstJobRow.locator('a[href*="attachments"]');
    await attachmentLink.click();
    
    // Wait for modal to open
    const modal = page.locator('[data-testid="attachments-modal"]');
    await expect(modal).toBeVisible();
    
    // Check that modal content is scrollable
    const modalContent = modal.locator('.overflow-y-auto, .flex-1');
    
    // Try to scroll within the modal
    await modalContent.evaluate(el => el.scrollTop = 100);
    
    // Modal should still be open and functional
    await expect(modal).toBeVisible();
  });
});
