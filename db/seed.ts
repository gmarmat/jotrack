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
        status: 'Phone Screen',
        notes: 'Excited about this role! Team seems great.',
        createdAt: now - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        updatedAt: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      },
      {
        id: uuidv4(),
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        status: 'Onsite',
        notes: 'Fast-paced environment, React + Node.js stack',
        createdAt: now - 14 * 24 * 60 * 60 * 1000, // 14 days ago
        updatedAt: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      },
      {
        id: uuidv4(),
        title: 'React Developer',
        company: 'Digital Agency',
        status: 'Applied',
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
      const historyEntries = [
        {
          id: uuidv4(),
          jobId: job.id,
          status: 'Applied',
          changedAt: job.createdAt,
        },
      ];
      
      // Add additional status changes for some jobs
      if (job.status === 'Phone Screen') {
        historyEntries.push({
          id: uuidv4(),
          jobId: job.id,
          status: 'Phone Screen',
          changedAt: job.updatedAt,
        });
      } else if (job.status === 'Onsite') {
        historyEntries.push({
          id: uuidv4(),
          jobId: job.id,
          status: 'Phone Screen',
          changedAt: job.createdAt + 5 * 24 * 60 * 60 * 1000,
        });
        historyEntries.push({
          id: uuidv4(),
          jobId: job.id,
          status: 'Onsite',
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

