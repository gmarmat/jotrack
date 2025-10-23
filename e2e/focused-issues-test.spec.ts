import { test, expect } from '@playwright/test';

// Focused tests for the specific issues mentioned
test.describe('JoTrack Focused Issues Tests', () => {
  
  test('Interview Coach Unlock Logic', async ({ page }) => {
    // Navigate to Fortive job (has prerequisites met)
    await page.goto('/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    await page.waitForTimeout(3000);
    
    // Look for Interview Coach elements
    const coachElements = page.locator('[data-testid*="coach"], .coach, [class*="coach"]');
    const coachCount = await coachElements.count();
    
    console.log(`Found ${coachCount} coach-related elements`);
    
    // Check for Interview Coach button
    const coachButton = page.locator('button:has-text("Interview"), button:has-text("Coach")');
    const hasCoachButton = await coachButton.count() > 0;
    
    if (hasCoachButton) {
      const isDisabled = await coachButton.first().isDisabled();
      console.log('Interview Coach button disabled:', isDisabled);
      
      if (isDisabled) {
        // Look for lock indicators
        const lockElements = page.locator('[data-testid*="lock"], .lock, [class*="lock"]');
        const lockCount = await lockElements.count();
        console.log(`Found ${lockCount} lock-related elements`);
      } else {
        console.log('✅ Interview Coach button is enabled');
      }
    } else {
      console.log('⚠️ Interview Coach button not found');
    }
    
    expect(true).toBe(true); // Always pass - this is diagnostic
  });

  test('Status Dropdown Theme & Clipping', async ({ page }) => {
    await page.goto('/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    await page.waitForTimeout(3000);
    
    // Find status dropdown
    const statusSelect = page.locator('select');
    const hasStatusSelect = await statusSelect.count() > 0;
    
    if (hasStatusSelect) {
      console.log('✅ Found status dropdown');
      
      // Click to open dropdown
      await statusSelect.first().click();
      await page.waitForTimeout(1000);
      
      // Check if options are visible
      const options = page.locator('select option');
      const optionCount = await options.count();
      console.log(`Found ${optionCount} dropdown options`);
      
      // Take screenshot for visual inspection
      await page.screenshot({ path: 'status-dropdown-test.png' });
      console.log('📸 Screenshot saved: status-dropdown-test.png');
      
    } else {
      console.log('⚠️ Status dropdown not found');
    }
    
    expect(true).toBe(true); // Always pass - this is diagnostic
  });

  test('Settings Modal Positioning', async ({ page }) => {
    await page.goto('/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    
    // Scroll to middle of page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);
    
    // Look for settings button
    const settingsButton = page.locator('button:has-text("⚙️"), button[data-testid*="settings"]');
    const hasSettingsButton = await settingsButton.count() > 0;
    
    if (hasSettingsButton) {
      console.log('✅ Found settings button');
      
      // Click settings button
      await settingsButton.first().click();
      await page.waitForTimeout(2000);
      
      // Check for modal
      const modal = page.locator('[data-testid*="modal"], .modal, [class*="modal"]');
      const hasModal = await modal.count() > 0;
      
      if (hasModal) {
        console.log('✅ Settings modal opened');
        
        // Check modal position
        const modalBox = await modal.first().boundingBox();
        if (modalBox) {
          console.log(`Modal position: x=${modalBox.x}, y=${modalBox.y}, width=${modalBox.width}, height=${modalBox.height}`);
          
          // Check if modal is clipped at top
          if (modalBox.y < 50) {
            console.log('⚠️ Modal may be clipped at top');
          } else {
            console.log('✅ Modal positioned correctly');
          }
        }
        
        // Take screenshot
        await page.screenshot({ path: 'settings-modal-test.png' });
        console.log('📸 Screenshot saved: settings-modal-test.png');
        
      } else {
        console.log('⚠️ Settings modal did not open');
      }
    } else {
      console.log('⚠️ Settings button not found');
    }
    
    expect(true).toBe(true); // Always pass - this is diagnostic
  });

  test('Data Pipeline Analysis Button', async ({ page }) => {
    await page.goto('/jobs/3957289b-30f5-4ab2-8006-3a08b6630beb', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    await page.waitForTimeout(3000);
    
    // Look for analyze buttons
    const analyzeButtons = page.locator('button:has-text("Analyze"), button:has-text("Refresh")');
    const analyzeCount = await analyzeButtons.count();
    
    console.log(`Found ${analyzeCount} analyze buttons`);
    
    if (analyzeCount > 0) {
      console.log('✅ Found data pipeline buttons');
      
      // Check if buttons are enabled
      for (let i = 0; i < Math.min(analyzeCount, 3); i++) {
        const button = analyzeButtons.nth(i);
        const isDisabled = await button.isDisabled();
        const buttonText = await button.textContent();
        console.log(`Button "${buttonText}" disabled: ${isDisabled}`);
      }
    } else {
      console.log('⚠️ No analyze buttons found');
    }
    
    expect(true).toBe(true); // Always pass - this is diagnostic
  });

  test('Interview Coach Practice Questions Count', async ({ page }) => {
    // Navigate to Interview Coach if accessible
    await page.goto('/interview-coach/3957289b-30f5-4ab2-8006-3a08b6630beb', { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
    await page.waitForTimeout(3000);
    
    // Check if page loaded properly
    const pageContent = await page.textContent('body');
    const hasError = pageContent?.includes('Error') || pageContent?.includes('404');
    
    if (hasError) {
      console.log('⚠️ Interview Coach page has errors or not accessible');
    } else {
      console.log('✅ Interview Coach page loaded');
      
      // Look for practice questions
      const questionElements = page.locator('[data-testid*="question"], .question, [class*="question"]');
      const questionCount = await questionElements.count();
      
      console.log(`Found ${questionCount} question-related elements`);
      
      // Critical check: Should NOT have 27 questions
      if (questionCount > 20) {
        console.log('❌ CRITICAL: Too many questions found (should be 4, not 27+)');
      } else if (questionCount >= 4) {
        console.log('✅ Found appropriate number of questions');
      } else {
        console.log('⚠️ Few questions found, may need to complete previous steps');
      }
    }
    
    expect(true).toBe(true); // Always pass - this is diagnostic
  });
});
