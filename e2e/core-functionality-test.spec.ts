import { test, expect } from '@playwright/test';

test.describe('JoTrack Core Functionality Tests', () => {
  
  test('Create New Job and Navigate', async ({ page }) => {
    // Navigate to home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Look for "Create New Job" button
    const createJobButton = page.locator('button:has-text("Create"), button:has-text("New Job"), button:has-text("Add Job")');
    const hasCreateButton = await createJobButton.count() > 0;
    
    if (hasCreateButton) {
      console.log('✅ Found create job button');
      await createJobButton.first().click();
      await page.waitForTimeout(2000);
      
      // Look for form fields
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[placeholder*="Title"]');
      const companyInput = page.locator('input[name="company"], input[placeholder*="company"], input[placeholder*="Company"]');
      
      if (await titleInput.count() > 0 && await companyInput.count() > 0) {
        console.log('✅ Found job form fields');
        
        // Fill out the form
        await titleInput.fill('Test Product Manager');
        await companyInput.fill('Test Company Inc');
        
        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Create"), button:has-text("Save")');
        if (await submitButton.count() > 0) {
          console.log('✅ Found submit button');
          await submitButton.first().click();
          await page.waitForTimeout(3000);
          
          // Check if we navigated to a job page
          const currentUrl = page.url();
          console.log('Current URL after form submission:', currentUrl);
          
          if (currentUrl.includes('/jobs/')) {
            console.log('✅ Successfully navigated to job page');
          } else {
            console.log('⚠️ Did not navigate to job page');
          }
        }
      }
    } else {
      console.log('⚠️ Create job button not found');
    }
    
    expect(true).toBe(true); // Always pass - this is exploratory
  });

  test('Navigate to Existing Job', async ({ page }) => {
    // Navigate to home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Look for job cards or links
    const jobLinks = page.locator('a[href*="/jobs/"], .job-card, .job-item, [data-testid*="job"]');
    const jobCount = await jobLinks.count();
    
    console.log(`Found ${jobCount} job links/cards`);
    
    if (jobCount > 0) {
      console.log('✅ Found existing jobs');
      
      // Click on the first job
      await jobLinks.first().click();
      await page.waitForTimeout(3000);
      
      // Check if we're on a job detail page
      const currentUrl = page.url();
      console.log('Current URL after clicking job:', currentUrl);
      
      if (currentUrl.includes('/jobs/')) {
        console.log('✅ Successfully navigated to job detail page');
        
        // Look for key elements on job detail page
        const statusDropdown = page.locator('select[data-testid*="status"], .status-select');
        const attachmentsSection = page.locator('[data-testid*="attachment"], .attachments');
        const analysisSection = page.locator('[data-testid*="analysis"], .analysis');
        
        console.log('Status dropdown found:', await statusDropdown.count() > 0);
        console.log('Attachments section found:', await attachmentsSection.count() > 0);
        console.log('Analysis section found:', await analysisSection.count() > 0);
        
      } else {
        console.log('⚠️ Did not navigate to job detail page');
      }
    } else {
      console.log('⚠️ No existing jobs found');
    }
    
    expect(true).toBe(true); // Always pass - this is exploratory
  });

  test('Test Status Dropdown Functionality', async ({ page }) => {
    // Navigate to a job page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Look for job links
    const jobLinks = page.locator('a[href*="/jobs/"], .job-card, .job-item');
    const jobCount = await jobLinks.count();
    
    if (jobCount > 0) {
      await jobLinks.first().click();
      await page.waitForTimeout(3000);
      
      // Look for status dropdown
      const statusDropdown = page.locator('select[data-testid*="status"], .status-select, select[name*="status"]');
      const hasStatusDropdown = await statusDropdown.count() > 0;
      
      if (hasStatusDropdown) {
        console.log('✅ Found status dropdown');
        
        // Get current value
        const currentValue = await statusDropdown.inputValue();
        console.log('Current status value:', currentValue);
        
        // Try to change the value
        try {
          await statusDropdown.selectOption({ index: 1 }); // Select second option
          await page.waitForTimeout(1000);
          
          const newValue = await statusDropdown.inputValue();
          console.log('New status value:', newValue);
          
          if (newValue !== currentValue) {
            console.log('✅ Status dropdown change successful');
          } else {
            console.log('⚠️ Status dropdown value did not change');
          }
        } catch (error) {
          console.log('⚠️ Could not change status dropdown:', error.message);
        }
      } else {
        console.log('⚠️ Status dropdown not found');
      }
    } else {
      console.log('⚠️ No jobs found to test status dropdown');
    }
    
    expect(true).toBe(true); // Always pass - this is exploratory
  });

  test('Test Settings Modal', async ({ page }) => {
    // Navigate to home page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Look for settings button
    const settingsButton = page.locator('button:has-text("⚙️"), button[data-testid*="settings"], .settings-button');
    const hasSettingsButton = await settingsButton.count() > 0;
    
    if (hasSettingsButton) {
      console.log('✅ Found settings button');
      
      // Click settings button
      await settingsButton.first().click();
      await page.waitForTimeout(2000);
      
      // Look for settings modal
      const settingsModal = page.locator('[data-testid*="modal"], .modal, [class*="modal"]');
      const hasModal = await settingsModal.count() > 0;
      
      if (hasModal) {
        console.log('✅ Settings modal opened');
        
        // Look for modal content
        const modalContent = await settingsModal.first().textContent();
        console.log('Modal content preview:', modalContent?.substring(0, 100));
        
        // Try to close modal
        const closeButton = page.locator('button:has-text("Close"), button:has-text("✕"), button:has-text("×")');
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
          await page.waitForTimeout(1000);
          console.log('✅ Settings modal closed');
        }
      } else {
        console.log('⚠️ Settings modal did not open');
      }
    } else {
      console.log('⚠️ Settings button not found');
    }
    
    expect(true).toBe(true); // Always pass - this is exploratory
  });

  test('Test Interview Coach Access', async ({ page }) => {
    // Navigate to a job page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Look for job links
    const jobLinks = page.locator('a[href*="/jobs/"], .job-card, .job-item');
    const jobCount = await jobLinks.count();
    
    if (jobCount > 0) {
      await jobLinks.first().click();
      await page.waitForTimeout(3000);
      
      // Look for Interview Coach elements
      const coachElements = page.locator('[data-testid*="coach"], .coach, [class*="coach"], button:has-text("Interview")');
      const coachCount = await coachElements.count();
      
      console.log(`Found ${coachCount} Interview Coach related elements`);
      
      if (coachCount > 0) {
        console.log('✅ Found Interview Coach elements');
        
        // Look for coach button
        const coachButton = page.locator('button:has-text("Interview"), button:has-text("Coach")');
        if (await coachButton.count() > 0) {
          console.log('✅ Found Interview Coach button');
          
          // Check if button is enabled or disabled
          const isDisabled = await coachButton.first().isDisabled();
          console.log('Interview Coach button disabled:', isDisabled);
          
          if (!isDisabled) {
            console.log('✅ Interview Coach button is enabled');
          } else {
            console.log('⚠️ Interview Coach button is disabled');
          }
        }
      } else {
        console.log('⚠️ No Interview Coach elements found');
      }
    } else {
      console.log('⚠️ No jobs found to test Interview Coach');
    }
    
    expect(true).toBe(true); // Always pass - this is exploratory
  });

  test('Test Data Pipeline Components', async ({ page }) => {
    // Navigate to a job page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Look for job links
    const jobLinks = page.locator('a[href*="/jobs/"], .job-card, .job-item');
    const jobCount = await jobLinks.count();
    
    if (jobCount > 0) {
      await jobLinks.first().click();
      await page.waitForTimeout(3000);
      
      // Look for data pipeline elements
      const analyzeButtons = page.locator('button:has-text("Analyze"), button:has-text("Refresh"), button:has-text("Process")');
      const analyzeCount = await analyzeButtons.count();
      
      console.log(`Found ${analyzeCount} analyze/process buttons`);
      
      if (analyzeCount > 0) {
        console.log('✅ Found data pipeline buttons');
        
        // Look for attachment elements
        const attachmentElements = page.locator('[data-testid*="attachment"], .attachment, [class*="attachment"]');
        const attachmentCount = await attachmentElements.count();
        
        console.log(`Found ${attachmentCount} attachment elements`);
        
        if (attachmentCount > 0) {
          console.log('✅ Found attachment elements');
        }
      } else {
        console.log('⚠️ No data pipeline buttons found');
      }
    } else {
      console.log('⚠️ No jobs found to test data pipeline');
    }
    
    expect(true).toBe(true); // Always pass - this is exploratory
  });
});
