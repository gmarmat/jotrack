#!/usr/bin/env tsx
import { db, sqlite } from './client';
import { jobs, statusHistory, rolesCatalog, skillsTaxonomy, learningCatalog } from './schema';
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

    // Seed Coach Mode: Roles Catalog
    console.log('🌱 Seeding roles catalog...');
    const roles = [
      {
        id: 'role-pm-mid',
        title: 'Product Manager',
        seniority: 'mid',
        archetype: 'IC',
        keySkills: JSON.stringify(['Product Strategy', 'Roadmapping', 'Stakeholder Management', 'Analytics', 'User Research']),
        updatedAt: now,
      },
      {
        id: 'role-pm-senior',
        title: 'Senior Product Manager',
        seniority: 'senior',
        archetype: 'IC',
        keySkills: JSON.stringify(['Product Strategy', 'Roadmapping', 'Team Leadership', 'Metrics', 'Go-to-Market']),
        updatedAt: now,
      },
      {
        id: 'role-swe-entry',
        title: 'Software Engineer',
        seniority: 'entry',
        archetype: 'IC',
        keySkills: JSON.stringify(['Programming', 'Algorithms', 'Testing', 'Version Control', 'Collaboration']),
        updatedAt: now,
      },
      {
        id: 'role-swe-mid',
        title: 'Software Engineer',
        seniority: 'mid',
        archetype: 'IC',
        keySkills: JSON.stringify(['System Design', 'Architecture', 'Code Review', 'Mentoring', 'API Design']),
        updatedAt: now,
      },
      {
        id: 'role-swe-senior',
        title: 'Senior Software Engineer',
        seniority: 'senior',
        archetype: 'IC',
        keySkills: JSON.stringify(['Architecture', 'Technical Leadership', 'Cross-team Collaboration', 'Performance Optimization', 'Production Support']),
        updatedAt: now,
      },
      {
        id: 'role-swe-staff',
        title: 'Staff Software Engineer',
        seniority: 'staff',
        archetype: 'IC',
        keySkills: JSON.stringify(['Strategic Architecture', 'Technical Vision', 'Org-wide Impact', 'Technical Strategy', 'Mentorship']),
        updatedAt: now,
      },
      {
        id: 'role-ds-mid',
        title: 'Data Scientist',
        seniority: 'mid',
        archetype: 'IC',
        keySkills: JSON.stringify(['Statistics', 'Machine Learning', 'Python', 'SQL', 'Data Visualization', 'A/B Testing']),
        updatedAt: now,
      },
      {
        id: 'role-ds-senior',
        title: 'Senior Data Scientist',
        seniority: 'senior',
        archetype: 'IC',
        keySkills: JSON.stringify(['ML Systems', 'Experiment Design', 'Business Impact', 'Team Leadership', 'Model Deployment']),
        updatedAt: now,
      },
      {
        id: 'role-designer-mid',
        title: 'Product Designer',
        seniority: 'mid',
        archetype: 'IC',
        keySkills: JSON.stringify(['UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Figma', 'User Testing']),
        updatedAt: now,
      },
      {
        id: 'role-designer-senior',
        title: 'Senior Product Designer',
        seniority: 'senior',
        archetype: 'IC',
        keySkills: JSON.stringify(['Design Strategy', 'Design Systems', 'Cross-functional Leadership', 'Design Critique', 'Accessibility']),
        updatedAt: now,
      },
    ];

    for (const role of roles) {
      await db.insert(rolesCatalog).values(role);
    }
    console.log(`✅ Created ${roles.length} role entries`);

    // Seed Skills Taxonomy
    console.log('🌱 Seeding skills taxonomy...');
    const skills = [
      { id: 'skill-react', label: 'React', category: 'technical', aliases: JSON.stringify(['ReactJS', 'React.js']) },
      { id: 'skill-typescript', label: 'TypeScript', category: 'technical', aliases: JSON.stringify(['TS']) },
      { id: 'skill-nodejs', label: 'Node.js', category: 'technical', aliases: JSON.stringify(['NodeJS', 'Node']) },
      { id: 'skill-python', label: 'Python', category: 'technical', aliases: JSON.stringify(['Python3']) },
      { id: 'skill-sql', label: 'SQL', category: 'technical', aliases: JSON.stringify(['PostgreSQL', 'MySQL', 'SQLite']) },
      { id: 'skill-aws', label: 'AWS', category: 'technical', aliases: JSON.stringify(['Amazon Web Services', 'EC2', 'S3']) },
      { id: 'skill-docker', label: 'Docker', category: 'technical', aliases: JSON.stringify(['Containers']) },
      { id: 'skill-kubernetes', label: 'Kubernetes', category: 'technical', aliases: JSON.stringify(['K8s']) },
      { id: 'skill-ml', label: 'Machine Learning', category: 'technical', aliases: JSON.stringify(['ML', 'AI']) },
      { id: 'skill-data-viz', label: 'Data Visualization', category: 'technical', aliases: JSON.stringify(['Tableau', 'D3.js']) },
      { id: 'skill-communication', label: 'Communication', category: 'soft', aliases: JSON.stringify(['Verbal Communication', 'Written Communication']) },
      { id: 'skill-leadership', label: 'Leadership', category: 'soft', aliases: JSON.stringify(['Team Leadership']) },
      { id: 'skill-problem-solving', label: 'Problem Solving', category: 'soft', aliases: JSON.stringify(['Critical Thinking']) },
      { id: 'skill-agile', label: 'Agile', category: 'domain', aliases: JSON.stringify(['Scrum', 'Kanban']) },
      { id: 'skill-product-strategy', label: 'Product Strategy', category: 'domain', aliases: JSON.stringify(['Product Planning']) },
    ];

    for (const skill of skills) {
      await db.insert(skillsTaxonomy).values(skill);
    }
    console.log(`✅ Created ${skills.length} skill entries`);

    // Seed Learning Catalog
    console.log('🌱 Seeding learning catalog...');
    const learningResources = [
      {
        id: 'learn-react-basics',
        provider: 'YouTube',
        title: 'React Tutorial for Beginners',
        url: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
        durationHours: 2,
        skillIds: JSON.stringify(['skill-react']),
        level: 'beginner',
        updatedAt: now,
      },
      {
        id: 'learn-typescript',
        provider: 'TypeScript Docs',
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
        durationHours: 4,
        skillIds: JSON.stringify(['skill-typescript']),
        level: 'beginner',
        updatedAt: now,
      },
      {
        id: 'learn-system-design',
        provider: 'YouTube',
        title: 'System Design Interview Course',
        url: 'https://www.youtube.com/watch?v=q0KGYwNbf-0',
        durationHours: 6,
        skillIds: JSON.stringify(['skill-nodejs', 'skill-aws']),
        level: 'intermediate',
        updatedAt: now,
      },
      {
        id: 'learn-python-ml',
        provider: 'Coursera',
        title: 'Machine Learning with Python',
        url: 'https://www.coursera.org/learn/machine-learning-with-python',
        durationHours: 20,
        skillIds: JSON.stringify(['skill-python', 'skill-ml']),
        level: 'intermediate',
        updatedAt: now,
      },
      {
        id: 'learn-docker',
        provider: 'Docker Docs',
        title: 'Get Started with Docker',
        url: 'https://docs.docker.com/get-started/',
        durationHours: 3,
        skillIds: JSON.stringify(['skill-docker']),
        level: 'beginner',
        updatedAt: now,
      },
    ];

    for (const resource of learningResources) {
      await db.insert(learningCatalog).values(resource);
    }
    console.log(`✅ Created ${learningResources.length} learning resource entries`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

seed();

