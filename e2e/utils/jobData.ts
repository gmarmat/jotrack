import { Page, expect } from '@playwright/test';

export interface JobData {
  id: string;
  title: string;
  companyName: string;
  status: string;
  hasResume: boolean;
  hasJd: boolean;
  hasCoverLetter: boolean;
  attachments: AttachmentData[];
}

export interface AttachmentData {
  id: string;
  fileName: string;
  mimeType: string;
  isActive: boolean;
  filePath: string;
  variants: VariantData[];
}

export interface VariantData {
  variantType: string;
  content: any;
  tokenCount: number;
  createdAt: string;
}

export interface TestContext {
  jobs: JobData[];
  selectedJob: JobData | null;
  testJobId: string | null;
}

/**
 * Discovers existing jobs with attachments from the database
 * Falls back to fixtures if no data exists
 */
export async function getReusableJobData(page: Page): Promise<JobData[]> {
  console.log('🔍 Discovering existing jobs with attachments...');
  
  try {
    // Query for jobs with resume and JD attachments
    const response = await page.request.get('/api/jobs/search?limit=10&has=["resume","jd"]');
    
    if (!response.ok()) {
      throw new Error(`Failed to fetch jobs: ${response.status()}`);
    }
    
    const data = await response.json();
    
    if (!data.jobs || data.jobs.length === 0) {
      console.log('⚠️ No existing jobs found, will use fixtures');
      return [];
    }
    
    console.log(`✅ Found ${data.jobs.length} existing jobs`);
    
    // Enrich job data with attachment details
    const enrichedJobs: JobData[] = [];
    
    for (const job of data.jobs.slice(0, 3)) { // Limit to first 3 jobs
      try {
        const attachmentsResponse = await page.request.get(`/api/jobs/${job.id}/attachments`);
        
        if (attachmentsResponse.ok()) {
          const attachmentsData = await attachmentsResponse.json();
          const attachments = attachmentsData.attachments || [];
          
          const jobData: JobData = {
            id: job.id,
            title: job.jobTitle || job.title,
            companyName: job.companyName || job.company,
            status: job.status || 'ON_RADAR',
            hasResume: attachments.some((att: any) => att.attachmentType === 'resume' && att.isActive),
            hasJd: attachments.some((att: any) => att.attachmentType === 'jd' && att.isActive),
            hasCoverLetter: attachments.some((att: any) => att.attachmentType === 'cover_letter' && att.isActive),
            attachments: attachments.map((att: any) => ({
              id: att.id,
              fileName: att.fileName,
              mimeType: att.mimeType,
              isActive: att.isActive,
              filePath: att.filePath,
              variants: att.variants || []
            }))
          };
          
          enrichedJobs.push(jobData);
          console.log(`📋 Job ${jobData.id}: ${jobData.title} at ${jobData.companyName} (Resume: ${jobData.hasResume}, JD: ${jobData.hasJd})`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch attachments for job ${job.id}: ${error}`);
      }
    }
    
    return enrichedJobs;
    
  } catch (error) {
    console.log(`❌ Error discovering job data: ${error}`);
    return [];
  }
}

/**
 * Gets attachment variants for a specific job
 */
export async function getJobAttachmentVariants(page: Page, jobId: string): Promise<Record<string, AttachmentData[]>> {
  try {
    const response = await page.request.get(`/api/jobs/${jobId}/attachments`);
    
    if (!response.ok()) {
      throw new Error(`Failed to fetch attachments for job ${jobId}`);
    }
    
    const data = await response.json();
    const attachments = data.attachments || [];
    
    // Group by attachment type
    const grouped: Record<string, AttachmentData[]> = {
      resume: [],
      jd: [],
      cover_letter: []
    };
    
    for (const attachment of attachments) {
      if (attachment.isActive) {
        const attachmentData: AttachmentData = {
          id: attachment.id,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          isActive: attachment.isActive,
          filePath: attachment.filePath,
          variants: attachment.variants || []
        };
        
        grouped[attachment.attachmentType] = grouped[attachment.attachmentType] || [];
        grouped[attachment.attachmentType].push(attachmentData);
      }
    }
    
    return grouped;
    
  } catch (error) {
    console.log(`❌ Error fetching attachment variants for job ${jobId}: ${error}`);
    return { resume: [], jd: [], cover_letter: [] };
  }
}

/**
 * Creates a temporary test job for testing purposes
 * Returns the job ID for cleanup
 */
export async function createTestJob(page: Page, suffix: string = 'E2E-TEMP'): Promise<string> {
  console.log(`🧪 Creating temporary test job with suffix: ${suffix}`);
  
  try {
    const testJobData = {
      jobTitle: `Test Job ${suffix}`,
      companyName: `Test Company ${suffix}`,
      status: 'ON_RADAR',
      location: 'Test Location',
      description: 'Test job description for E2E testing'
    };
    
    const response = await page.request.post('/api/jobs', {
      data: testJobData
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to create test job: ${response.status()}`);
    }
    
    const data = await response.json();
    console.log(`✅ Created test job: ${data.job.id}`);
    
    return data.job.id;
    
  } catch (error) {
    console.log(`❌ Error creating test job: ${error}`);
    throw error;
  }
}

/**
 * Cleans up a temporary test job
 */
export async function cleanupTestJob(page: Page, jobId: string): Promise<void> {
  console.log(`🧹 Cleaning up test job: ${jobId}`);
  
  try {
    const response = await page.request.delete(`/api/jobs/${jobId}`);
    
    if (response.ok()) {
      console.log(`✅ Cleaned up test job: ${jobId}`);
    } else {
      console.log(`⚠️ Failed to cleanup test job ${jobId}: ${response.status()}`);
    }
    
  } catch (error) {
    console.log(`❌ Error cleaning up test job ${jobId}: ${error}`);
  }
}

/**
 * Verifies that a job has the required attachments for testing
 */
export function validateJobForTesting(job: JobData, requiredAttachments: string[] = ['resume', 'jd']): boolean {
  const hasRequired = requiredAttachments.every(type => {
    switch (type) {
      case 'resume':
        return job.hasResume;
      case 'jd':
        return job.hasJd;
      case 'cover_letter':
        return job.hasCoverLetter;
      default:
        return false;
    }
  });
  
  return hasRequired && job.attachments.length > 0;
}

/**
 * Gets the best job for testing based on match score and attachments
 */
export async function getBestTestJob(page: Page, jobs: JobData[]): Promise<JobData | null> {
  if (jobs.length === 0) {
    return null;
  }
  
  // Prefer jobs with higher match scores and complete attachments
  const scoredJobs = jobs.map(job => {
    let score = 0;
    
    // Attachment completeness
    if (job.hasResume) score += 10;
    if (job.hasJd) score += 10;
    if (job.hasCoverLetter) score += 5;
    
    // Status preference (ON_RADAR is good for testing)
    if (job.status === 'ON_RADAR') score += 5;
    if (job.status === 'APPLIED') score += 3;
    
    return { job, score };
  });
  
  // Sort by score descending
  scoredJobs.sort((a, b) => b.score - a.score);
  
  const bestJob = scoredJobs[0].job;
  console.log(`🎯 Selected best test job: ${bestJob.title} at ${bestJob.companyName} (score: ${scoredJobs[0].score})`);
  
  return bestJob;
}

/**
 * Waits for a job to be ready for testing (has required data)
 */
export async function waitForJobReady(page: Page, jobId: string, timeout: number = 30000): Promise<boolean> {
  console.log(`⏳ Waiting for job ${jobId} to be ready...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.request.get(`/api/jobs/${jobId}/analysis-data`);
      
      if (response.ok()) {
        const data = await response.json();
        
        // Check if job has basic analysis data
        if (data.matchScoreData && data.skillsMatchData) {
          console.log(`✅ Job ${jobId} is ready for testing`);
          return true;
        }
      }
      
      // Wait 1 second before checking again
      await page.waitForTimeout(1000);
      
    } catch (error) {
      console.log(`⚠️ Error checking job readiness: ${error}`);
    }
  }
  
  console.log(`⏰ Timeout waiting for job ${jobId} to be ready`);
  return false;
}
