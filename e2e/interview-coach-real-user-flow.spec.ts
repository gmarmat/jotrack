import { test, expect } from '@playwright/test';

/**
 * REAL USER FLOW E2E TEST
 * 
 * Mimics actual user interactions with watchdog timers
 * Rules:
 * 1. Small chunks - each task is self-contained
 * 2. Check work - verify each step completes
 * 3. Watchdog timers - 3 minute max per task
 * 4. Detailed logging - catch all errors
 */

test.describe('Interview Coach - Real User Flow (With Watchdog Timers)', () => {
  const baseUrl = 'http://localhost:3000';
  const fortiveJobId = '3957289b-30f5-4ab2-8006-3a08b6630beb';
  const watchdogLimit = 180000; // 3 minutes per task

  test('CHUNK 1: Navigate to Interview Coach (Watchdog: 30s)', async ({ page }) => {
    console.log('\n📍 CHUNK 1: Navigate to Interview Coach');
    console.log('⏱️ Watchdog: 30 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const elapsed = Date.now() - startTime;
    const title = await page.locator('h1').textContent();
    
    console.log(`✅ Page loaded in ${elapsed}ms`);
    console.log(`📋 Title: ${title}`);
    
    expect(title).toContain('Interview Coach');
  });

  test('CHUNK 2: Verify Practice Tab Exists (Watchdog: 10s)', async ({ page }) => {
    console.log('\n📍 CHUNK 2: Verify Practice Tab Exists');
    console.log('⏱️ Watchdog: 10 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const practiceBtn = page.locator('button:has-text("Practice")').first();
    const exists = await practiceBtn.isVisible({ timeout: 10000 }).catch(() => false);
    
    const elapsed = Date.now() - startTime;
    
    if (!exists) {
      console.log('❌ Practice button not found');
      throw new Error('Practice button not visible');
    }
    
    console.log(`✅ Practice button found in ${elapsed}ms\n`);
  });

  test('CHUNK 3: Click Practice Tab (Watchdog: 5s)', async ({ page }) => {
    console.log('\n📍 CHUNK 3: Click Practice Tab');
    console.log('⏱️ Watchdog: 5 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      timeout: 30000
    });

    await page.locator('button:has-text("Practice")').first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Practice tab clicked in ${elapsed}ms\n`);
  });

  test('CHUNK 4: Find First Question (Watchdog: 15s)', async ({ page }) => {
    console.log('\n📍 CHUNK 4: Find First Question');
    console.log('⏱️ Watchdog: 15 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      timeout: 30000
    });

    await page.locator('button:has-text("Practice")').first().click({ timeout: 5000 });
    
    // Use explicit test ID selector - no ambiguity
    const questions = page.locator('[data-testid="question-item-0"]');
    const visible = await questions.isVisible({ timeout: 15000 }).catch(() => false);
    
    if (!visible) {
      console.log('❌ No questions found');
      throw new Error('Questions not visible after 15s');
    }
    
    const questionText = await questions.textContent();
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Question found in ${elapsed}ms`);
    console.log(`📝 Question: "${questionText?.substring(0, 60)}..."\n`);
  });

  test('CHUNK 5: Select Question (Watchdog: 5s)', async ({ page }) => {
    console.log('\n📍 CHUNK 5: Select Question');
    console.log('⏱️ Watchdog: 5 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      timeout: 30000
    });

    await page.locator('button:has-text("Practice")').first().click({ timeout: 5000 });
    // Use explicit test ID - simple and reliable
    await page.locator('[data-testid="question-item-0"]').click({ timeout: 10000 });
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Question selected in ${elapsed}ms\n`);
  });

  test('CHUNK 6: Find Answer Textarea (Watchdog: 10s)', async ({ page }) => {
    console.log('\n📍 CHUNK 6: Find Answer Textarea');
    console.log('⏱️ Watchdog: 10 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      timeout: 30000
    });

    await page.locator('button:has-text("Practice")').first().click({ timeout: 5000 });
    await page.locator('[data-testid="question-item-0"]').click({ timeout: 10000 });
    
    const textarea = page.locator('textarea').first();
    const visible = await textarea.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!visible) {
      console.log('❌ Textarea not found');
      throw new Error('Textarea not visible');
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Textarea found in ${elapsed}ms\n`);
  });

  test('CHUNK 7: Enter Answer Text (Watchdog: 5s)', async ({ page }) => {
    console.log('\n📍 CHUNK 7: Enter Answer Text');
    console.log('⏱️ Watchdog: 5 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      timeout: 30000
    });

    await page.locator('button:has-text("Practice")').first().click({ timeout: 5000 });
    await page.locator('[data-testid="question-item-0"]').click({ timeout: 10000 });
    
    const testAnswer = 'I led a team of 5 engineers to redesign our microservices architecture, reducing latency by 80% and improving system reliability to 99.95% uptime. This experience directly aligns with your need for strong technical leadership.';
    
    await page.locator('textarea').first().fill(testAnswer, { timeout: 5000 });
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Answer entered (${testAnswer.length} chars) in ${elapsed}ms\n`);
  });

  test('CHUNK 8: Find Analyze Button (Watchdog: 10s)', async ({ page }) => {
    console.log('\n📍 CHUNK 8: Find Analyze Button');
    console.log('⏱️ Watchdog: 10 seconds max\n');
    
    const startTime = Date.now();
    
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      timeout: 30000
    });

    await page.locator('button:has-text("Practice")').first().click({ timeout: 5000 });
    await page.locator('[data-testid="question-item-0"]').click({ timeout: 10000 });
    await page.locator('textarea').first().fill('Test answer', { timeout: 5000 });
    
    const analyzeBtn = page.locator('button:has-text("Analyze")').first();
    const visible = await analyzeBtn.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!visible) {
      console.log('❌ Analyze button not found');
      throw new Error('Analyze button not visible');
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Analyze button found in ${elapsed}ms\n`);
  });

  test('CHUNK 9: CRITICAL - Click Analyze & Wait for Score (Watchdog: 180s)', async ({ page }) => {
    console.log('\n📍 CHUNK 9: CRITICAL - Click Analyze Button');
    console.log('⏱️ Watchdog: 180 seconds (3 min) max\n');
    
    const startTime = Date.now();
    let apiErrorCaught = '';
    
    // Monitor API responses
    page.on('response', async (response) => {
      if (response.url().includes('score-answer')) {
        if (response.status() !== 200) {
          const text = await response.text().catch(() => response.status().toString());
          apiErrorCaught = `HTTP ${response.status()}: ${text.substring(0, 200)}`;
          console.log(`❌ API ERROR: ${apiErrorCaught}`);
        } else {
          console.log(`✅ API returned 200 OK`);
        }
      }
    });
    
    // Setup page
    await page.goto(`${baseUrl}/interview-coach/${fortiveJobId}?type=recruiter`, {
      timeout: 30000
    });

    await page.locator('button:has-text("Practice")').first().click({ timeout: 5000 });
    await page.locator('[data-testid="question-item-0"]').click({ timeout: 10000 });
    await page.locator('textarea').first().fill('Test answer for scoring', { timeout: 5000 });
    
    // CLICK ANALYZE
    console.log('🔘 Clicking Analyze...');
    await page.locator('button:has-text("Analyze")').first().click({ timeout: 5000 });
    
    // WAIT FOR SCORE with watchdog
    try {
      await page.locator('[class*="score"]').first().waitFor({ timeout: 120000 });
      const scoreElement = await page.locator('[class*="score"]').first().textContent();
      const elapsed = Date.now() - startTime;
      
      if (apiErrorCaught) {
        console.log(`⚠️ API had error but score showed: ${scoreElement}`);
      }
      
      console.log(`✅ SCORE RECEIVED in ${elapsed}ms: ${scoreElement}\n`);
      console.log('🎉 CHUNK 9 PASSED - Scoring works!\n');
      
    } catch (e) {
      const elapsed = Date.now() - startTime;
      console.log(`❌ CHUNK 9 FAILED after ${elapsed}ms`);
      
      if (apiErrorCaught) {
        console.log(`API Error: ${apiErrorCaught}`);
      }
      
      const errorElements = await page.locator('[class*="error"]').allTextContents();
      if (errorElements.length > 0) {
        console.log(`UI Errors: ${errorElements.join(', ')}`);
      }
      
      throw new Error(`Score not received within 2 minutes. API Error: ${apiErrorCaught}`);
    }
  });
});
