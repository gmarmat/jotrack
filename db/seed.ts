#!/usr/bin/env tsx
import { db, sqlite } from './client';
import { jobs, statusHistory } from './schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    const now = Date.now();
    
    // Sample jobs
    const sampleJobs = [
      {
        id: uuidv4(),
        title: 'Senior Frontend Engineer',
        company: 'TechCorp',
        status: 'PHONE_SCREEN' as const,
        notes: 'Excited about this role! Team seems great.',
        createdAt: now - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        updatedAt: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      },
      {
        id: uuidv4(),
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        status: 'ONSITE' as const,
        notes: 'Fast-paced environment, React + Node.js stack',
        createdAt: now - 14 * 24 * 60 * 60 * 1000, // 14 days ago
        updatedAt: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      },
      {
        id: uuidv4(),
        title: 'React Developer',
        company: 'Digital Agency',
        status: 'APPLIED' as const,
        notes: 'Fully remote position',
        createdAt: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      },
    ];

    // Insert jobs
    for (const job of sampleJobs) {
      await db.insert(jobs).values(job);
      console.log(`✅ Created job: ${job.title} at ${job.company}`);
      
      // Add status history entries
      const historyEntries: Array<{
        id: string;
        jobId: string;
        status: 'ON_RADAR' | 'APPLIED' | 'PHONE_SCREEN' | 'ONSITE' | 'OFFER' | 'REJECTED';
        changedAt: number;
      }> = [
        {
          id: uuidv4(),
          jobId: job.id,
          status: 'APPLIED',
          changedAt: job.createdAt,
        },
      ];
      
      // Add additional status changes for some jobs
      if (job.status === 'PHONE_SCREEN') {
        historyEntries.push({
          id: uuidv4(),
          jobId: job.id,
          status: 'PHONE_SCREEN',
          changedAt: job.updatedAt,
        });
      } else if (job.status === 'ONSITE') {
        historyEntries.push({
          id: uuidv4(),
          jobId: job.id,
          status: 'PHONE_SCREEN',
          changedAt: job.createdAt + 5 * 24 * 60 * 60 * 1000,
        });
        historyEntries.push({
          id: uuidv4(),
          jobId: job.id,
          status: 'ONSITE',
          changedAt: job.updatedAt,
        });
      }
      
      for (const entry of historyEntries) {
        await db.insert(statusHistory).values(entry);
      }
    }

    console.log('✅ Seed data inserted successfully');
    console.log(`📊 Total jobs: ${sampleJobs.length}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

seed();

