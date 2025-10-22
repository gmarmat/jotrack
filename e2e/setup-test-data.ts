import { Page } from '@playwright/test';

/**
 * Sets up test data for E2E tests
 * This script ensures we have the necessary data in the database
 */
export async function setupTestData(page: Page): Promise<void> {
  console.log('🔧 Setting up test data...');
  
  try {
    // Check if we have existing jobs
    const response = await page.request.get('/api/jobs/search?limit=5');
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.jobs && data.jobs.length > 0) {
        console.log(`✅ Found ${data.jobs.length} existing jobs`);
        return;
      }
    }
    
    // If no jobs exist, create some test data
    console.log('📝 Creating test jobs...');
    
    const testJobs = [
      {
        jobTitle: 'Senior Software Engineer',
        companyName: 'TechCorp',
        status: 'ON_RADAR',
        location: 'San Francisco, CA',
        description: 'We are looking for a senior software engineer to join our team.'
      },
      {
        jobTitle: 'Product Manager',
        companyName: 'StartupXYZ',
        status: 'APPLIED',
        location: 'New York, NY',
        description: 'Lead product development for our innovative platform.'
      },
      {
        jobTitle: 'Data Scientist',
        companyName: 'DataCorp',
        status: 'PHONE_SCREEN',
        location: 'Seattle, WA',
        description: 'Build machine learning models for our data platform.'
      }
    ];
    
    for (const jobData of testJobs) {
      try {
        const createResponse = await page.request.post('/api/jobs', {
          data: jobData
        });
        
        if (createResponse.ok()) {
          const result = await createResponse.json();
          console.log(`✅ Created test job: ${result.job.jobTitle} at ${result.job.companyName}`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to create test job: ${error}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error setting up test data: ${error}`);
  }
}

/**
 * Cleans up test data after tests
 */
export async function cleanupTestData(page: Page): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Get all jobs
    const response = await page.request.get('/api/jobs/search?limit=100');
    
    if (response.ok()) {
      const data = await response.json();
      
      if (data.jobs && data.jobs.length > 0) {
        // Delete test jobs (those with "E2E-TEMP" in the title)
        for (const job of data.jobs) {
          if (job.jobTitle && job.jobTitle.includes('E2E-TEMP')) {
            try {
              await page.request.delete(`/api/jobs/${job.id}`);
              console.log(`🗑️ Deleted test job: ${job.jobTitle}`);
            } catch (error) {
              console.log(`⚠️ Failed to delete test job ${job.id}: ${error}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Error cleaning up test data: ${error}`);
  }
}
