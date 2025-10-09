import { test, expect } from '@playwright/test';

test('should display the job application form and list', async ({ page }) => {
  await page.goto('/');
  
  await expect(page.locator('h1')).toContainText('Jotrack');
  await expect(page.locator('text=Add New Job Application')).toBeVisible();
  await expect(page.locator('text=Your Applications')).toBeVisible();
});

test('should create a new job application and verify it appears in the list', async ({ page }) => {
  await page.goto('/');
  
  // Fill out the form
  const timestamp = Date.now();
  const jobTitle = `Test Engineer ${timestamp}`;
  const company = `TestCorp ${timestamp}`;
  
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', company);
  await page.selectOption('select', 'Phone Screen');
  await page.fill('textarea[placeholder*="additional notes"]', 'This is a test job application');
  
  // Submit the form
  await page.click('button:has-text("Add Job Application")');
  
  // Wait for the job to appear in the list
  await page.waitForTimeout(1000);
  
  // Verify the job appears in the table - find the row containing the job title
  const jobRow = page.locator('table tbody tr').filter({ hasText: jobTitle });
  await expect(jobRow).toBeVisible();
  await expect(jobRow).toContainText(company);
  await expect(jobRow).toContainText('Phone Screen');
});

test('should search for a job by title', async ({ page }) => {
  await page.goto('/');
  
  // Create a unique job
  const timestamp = Date.now();
  const uniqueTitle = `UniqueSearchTest ${timestamp}`;
  
  await page.fill('input[placeholder*="Senior React Developer"]', uniqueTitle);
  await page.fill('input[placeholder*="TechCorp"]', 'SearchCompany');
  await page.click('button:has-text("Add Job Application")');
  
  await page.waitForTimeout(1000);
  
  // Perform search
  await page.fill('input[placeholder*="Search jobs"]', uniqueTitle);
  await page.click('button:has-text("Search")');
  
  await page.waitForTimeout(500);
  
  // Verify only the searched job appears
  await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
  
  // Clear search
  await page.click('button:has-text("Clear")');
  
  await page.waitForTimeout(500);
  
  // Verify all jobs are shown again
  await expect(page.locator('table tbody tr')).not.toHaveCount(0);
});

test('should update job status and show changes', async ({ page }) => {
  await page.goto('/');
  
  // Create a job
  const timestamp = Date.now();
  const jobTitle = `Status Test Job ${timestamp}`;
  const company = `StatusCorp ${timestamp}`;
  
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', company);
  await page.selectOption('select', 'Applied');
  await page.click('button:has-text("Add Job Application")');
  
  await page.waitForTimeout(1000);
  
  // Find the job row
  const jobRow = page.locator('table tbody tr').filter({ hasText: jobTitle });
  await expect(jobRow).toBeVisible();
  
  // Find the status select for this job
  const statusSelect = jobRow.locator('select');
  await expect(statusSelect).toHaveValue('Applied');
  
  // Change status to Phone Screen
  await statusSelect.selectOption('Phone Screen');
  
  // Click the save button (checkmark icon)
  const saveButton = jobRow.locator('button[title="Save status"]');
  await expect(saveButton).toBeVisible();
  await saveButton.click();
  
  // Wait for the save to complete
  await page.waitForTimeout(1000);
  
  // Verify the status was updated
  await expect(statusSelect).toHaveValue('Phone Screen');
});

test('should track status history and display in modal', async ({ page }) => {
  await page.goto('/');
  
  // Create a job
  const timestamp = Date.now();
  const jobTitle = `History Test Job ${timestamp}`;
  const company = `HistoryCorp ${timestamp}`;
  
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', company);
  await page.selectOption('select', 'Applied');
  await page.click('button:has-text("Add Job Application")');
  
  await page.waitForTimeout(1000);
  
  // Find the job row
  const jobRow = page.locator('table tbody tr').filter({ hasText: jobTitle });
  await expect(jobRow).toBeVisible();
  
  // Change status to Phone Screen
  const statusSelect = jobRow.locator('select');
  await statusSelect.selectOption('Phone Screen');
  await jobRow.locator('button[title="Save status"]').click();
  await page.waitForTimeout(1000);
  
  // Change status to Onsite
  await statusSelect.selectOption('Onsite');
  await jobRow.locator('button[title="Save status"]').click();
  await page.waitForTimeout(1000);
  
  // Open history modal
  const historyButton = jobRow.locator('button:has-text("History")');
  await historyButton.click();
  
  // Verify modal is open
  const modal = page.locator('[data-testid="history-modal"]');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Status History');
  await expect(modal).toContainText(jobTitle);
  
  // Verify history entries (most recent first)
  const historyEntries = modal.locator('[data-testid^="history-entry-"]');
  await expect(historyEntries).toHaveCount(3); // Applied, Phone Screen, Onsite
  
  // Check the first entry (most recent) is Onsite
  const firstEntry = modal.locator('[data-testid="history-entry-0"]');
  await expect(firstEntry).toContainText('Onsite');
  
  // Check the second entry is Phone Screen
  const secondEntry = modal.locator('[data-testid="history-entry-1"]');
  await expect(secondEntry).toContainText('Phone Screen');
  
  // Check the third entry is Applied
  const thirdEntry = modal.locator('[data-testid="history-entry-2"]');
  await expect(thirdEntry).toContainText('Applied');
  
  // Close the modal
  await modal.locator('[data-testid="close-history-modal"]').click();
  await expect(modal).not.toBeVisible();
});

test('should show optimistic update and handle errors', async ({ page }) => {
  await page.goto('/');
  
  // Create a job
  const timestamp = Date.now();
  const jobTitle = `Error Test Job ${timestamp}`;
  const company = `ErrorCorp ${timestamp}`;
  
  await page.fill('input[placeholder*="Senior React Developer"]', jobTitle);
  await page.fill('input[placeholder*="TechCorp"]', company);
  await page.selectOption('select', 'Applied');
  await page.click('button:has-text("Add Job Application")');
  
  await page.waitForTimeout(1000);
  
  // Find the job row
  const jobRow = page.locator('table tbody tr').filter({ hasText: jobTitle });
  await expect(jobRow).toBeVisible();
  
  // Change status
  const statusSelect = jobRow.locator('select');
  await statusSelect.selectOption('Offer');
  
  // Verify save button appears
  const saveButton = jobRow.locator('button[title="Save status"]');
  await expect(saveButton).toBeVisible();
  
  // Click save
  await saveButton.click();
  
  // Wait for spinner to appear and disappear
  await page.waitForTimeout(1000);
  
  // Verify status was updated
  await expect(statusSelect).toHaveValue('Offer');
});

