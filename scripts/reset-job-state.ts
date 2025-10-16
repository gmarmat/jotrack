// Quick script to reset job to variants_fresh state for testing
import { db } from '../db/client';
import { jobs } from '../db/schema';
import { eq } from 'drizzle-orm';

const jobId = '3957289b-30f5-4ab2-8006-3a08b6630beb';

async function resetJobState() {
  console.log('Resetting job state to variants_fresh...');
  
  await db
    .update(jobs)
    .set({
      analysisState: 'variants_fresh',
      analysisFingerprint: null,
      lastFullAnalysisAt: null,
      updatedAt: Date.now(),
    })
    .where(eq(jobs.id, jobId));
  
  console.log('✅ Job reset to variants_fresh state');
  console.log('Refresh your browser to see the blue banner with "Analyze All" button');
  
  process.exit(0);
}

resetJobState().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

