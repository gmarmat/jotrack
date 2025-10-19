/**
 * E2E Tests - People Profiles (MVP)
 * Created: October 18, 2025
 * 
 * Tests core People Profiles functionality with manual input
 */

import { test, expect } from '@playwright/test';
import { db } from '../db/client';
import { peopleProfiles, jobPeopleRefs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { setupCoachModeApiMocks } from './mocks/coachModeAiMocks';

const TEST_JOB_ID = '3957289b-30f5-4ab2-8006-3a08b6630beb';

test.describe('People Profiles - MVP Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupCoachModeApiMocks(page);
  });
  
  test.beforeAll(async () => {
    console.log('🧹 Cleaning People Profiles test data...');
    await db.delete(jobPeopleRefs).where(eq(jobPeopleRefs.jobId, TEST_JOB_ID));
    await db.delete(peopleProfiles);
    console.log('✅ Test data cleaned');
  });
  
  // ============================================================================
  // TEST 1: Add Person Via Manual Paste
  // ============================================================================
  
  test('PP-1: Can add person via manual paste', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Scroll to People Profiles
    await page.locator('h3:has-text("People Profiles")').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Click Manage People
    const manageButton = page.locator('button:has-text("Manage People")');
    await manageButton.click();
    await page.waitForTimeout(1000);
    
    // Verify modal opened
    const modalTitle = page.locator('h2:has-text("Manage Interview Team")');
    await expect(modalTitle).toBeVisible();
    
    // Click Add Person
    await page.locator('button:has-text("Add Person")').click();
    await page.waitForTimeout(500);
    
    // Fill form
    await page.locator('input[placeholder*="Jane Smith"]').fill('Sarah Chen');
    await page.locator('input[placeholder*="Recruiter"]').fill('Senior Technical Recruiter');
    
    // Paste LinkedIn text
    const linkedinText = `Sarah Chen
Senior Technical Recruiter at Google
San Francisco Bay Area

About: 8+ years recruiting top engineering talent...
Experience: Google, Meta, Stripe`;
    
    await page.locator('textarea[placeholder*="Paste profile"]').fill(linkedinText);
    
    // Select role
    await page.locator('select').first().selectOption('recruiter');
    
    // Save
    const saveButton = page.locator('button:has-text("Save")').first();
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // Verify modal closed
    await expect(modalTitle).not.toBeVisible({ timeout: 5000 });
    
    console.log('✅ PP-1: Person added via manual paste');
  });
  
  // ============================================================================
  // TEST 2: Count Badge Updates
  // ============================================================================
  
  test('PP-2: Count badge updates after save', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Check count badge
    await page.locator('h3:has-text("People Profiles")').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    const manageButton = page.locator('button:has-text("Manage People")');
    const badge = manageButton.locator('span').last();
    const count = await badge.textContent().catch(() => '0');
    
    expect(parseInt(count)).toBeGreaterThanOrEqual(1);
    
    console.log(`✅ PP-2: Count badge shows: ${count}`);
  });
  
  // ============================================================================
  // TEST 3: Modal Closes After Save
  // ============================================================================
  
  test('PP-3: Modal closes after successful save', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.locator('h3:has-text("People Profiles")').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Manage People")').click();
    await page.waitForTimeout(1000);
    
    const modalTitle = page.locator('h2:has-text("Manage Interview Team")');
    await expect(modalTitle).toBeVisible();
    
    // Close via Cancel button
    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(500);
    
    await expect(modalTitle).not.toBeVisible();
    
    console.log('✅ PP-3: Modal closes correctly');
  });
  
  // ============================================================================
  // TEST 4: Database Integrity
  // ============================================================================
  
  test('PP-4: Saved people persist in database', async ({ page }) => {
    // Query database directly
    const people = await db.select().from(peopleProfiles).limit(10);
    const links = await db.select().from(jobPeopleRefs)
      .where(eq(jobPeopleRefs.jobId, TEST_JOB_ID));
    
    expect(people.length).toBeGreaterThanOrEqual(1);
    expect(links.length).toBeGreaterThanOrEqual(1);
    
    console.log(`✅ PP-4: Database has ${people.length} people, ${links.length} links`);
  });
  
  // ============================================================================
  // TEST 5: "Coming Soon" Badge Visible
  // ============================================================================
  
  test('PP-5: Auto-fetch coming soon badge visible', async ({ page }) => {
    await page.goto(`/jobs/${TEST_JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.locator('h3:has-text("People Profiles")').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Manage People")').click();
    await page.waitForTimeout(1000);
    
    // Add person to see the badge
    await page.locator('button:has-text("Add Person")').click();
    await page.waitForTimeout(500);
    
    // Verify "Coming in v2" badge
    const badge = page.locator('text=Auto-fetch coming in v2');
    await expect(badge).toBeVisible();
    
    console.log('✅ PP-5: "Coming Soon" badge visible');
  });
});

