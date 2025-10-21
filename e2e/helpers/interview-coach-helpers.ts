import { Page } from '@playwright/test';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data/jotrack.db');

/**
 * Setup a complete test job with all prerequisites for Interview Coach testing
 * Returns the jobId for use in tests
 */
export async function setupTestJobWithPrerequisites(): Promise<string> {
  const db = new Database(DB_PATH);
  const jobId = `test-ic-${Date.now()}`;
  const now = Math.floor(Date.now() / 1000);
  
  try {
    console.log(`📦 Setting up test job: ${jobId}`);
    
    // 1. Create test job with APPLIED status
    db.prepare(`
      INSERT INTO jobs (
        id, company, title, status, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      jobId,
      'TestCorp Inc.',
      'Senior Backend Engineer',
      'APPLIED',
      'Test job for Interview Coach E2E testing',
      now,
      now
    );
    
    console.log('✅ Job created');
    
    // 2. Create Application Coach state with writing style
    const appCoachData = {
      writingStyleProfile: {
        tone: 'professional-technical',
        complexity: 'high',
        sentenceStructure: 'varied',
        vocabulary: 'technical',
        strengths: ['specific', 'quantified', 'action-oriented'],
        improvements: ['add more context']
      },
      discoveryResponses: [
        {
          question: 'Tell me about yourself',
          answer: 'I am a senior backend engineer with 8 years of experience in distributed systems.'
        }
      ],
      discoveryComplete: true,
      profileAnalyzed: true
    };
    
    db.prepare(`
      INSERT INTO coach_state (job_id, data_json, interview_coach_json, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(
      jobId,
      JSON.stringify(appCoachData),
      '{}',
      now
    );
    
    console.log('✅ Coach state created');
    
    // 3. Create mock analysis bundle (Resume + JD)
    const mockResume = `
JOHN DOE
Senior Backend Engineer
john@example.com | (555) 123-4567

EXPERIENCE
Tech Lead, Microservices Platform | BigTech Corp | 2020-Present
- Led team of 6 engineers to migrate monolith to microservices architecture
- Reduced deployment time from 4 hours to 30 minutes (87% improvement)
- Cut infrastructure costs by $200K annually through better resource utilization
- Technologies: Docker, Kubernetes, Go, PostgreSQL

Senior Software Engineer | StartupCo | 2017-2020
- Built real-time analytics dashboard serving 10K daily active users
- Improved API response time from 2000ms to 200ms (90% improvement)
- Mentored 2 junior engineers who grew into mid-level roles
- Technologies: Python, React, Redis, WebSocket
    `.trim();
    
    const mockJD = `
Senior Backend Engineer - TestCorp Inc.

ABOUT THE ROLE
We're looking for a Senior Backend Engineer to join our Infrastructure team. 
You'll architect and build scalable systems handling millions of requests per day.

REQUIREMENTS
- 5+ years backend development experience
- Strong system design skills
- Experience with microservices, Docker, Kubernetes
- Proficiency in Go, Python, or Java
- Database optimization experience (PostgreSQL, Redis)
- Strong communication and mentoring skills

RESPONSIBILITIES
- Design and implement scalable backend services
- Lead technical initiatives and mentor junior engineers
- Optimize system performance and reliability
- Collaborate with product and frontend teams

BENEFITS
- Competitive salary ($150K-$200K)
- Equity package
- Remote-friendly culture
    `.trim();
    
    db.prepare(`
      INSERT INTO job_analysis_bundles (
        job_id, fingerprint, resume_raw, resume_ai_optimized, jd_raw, jd_ai_optimized, 
        tokens_used, cost_usd, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      jobId,
      'test-fingerprint',
      mockResume,
      mockResume, // For test purposes, optimized = raw
      mockJD,
      mockJD,
      0,
      0,
      now,
      now
    );
    
    console.log('✅ Analysis bundle created');
    
    // 4. Seed interview questions
    const questions = [
      {
        question: 'Tell me about your experience with system design and architecture.',
        category: 'Technical',
        difficulty: 'Hard',
        tip: 'Use STAR format. Focus on a specific project with measurable impact.'
      },
      {
        question: 'Describe a time when you led a team through a challenging project.',
        category: 'Leadership',
        difficulty: 'Medium',
        tip: 'Highlight your leadership style and how you handled conflict.'
      },
      {
        question: 'What was the most technically challenging problem you solved?',
        category: 'Technical',
        difficulty: 'Hard',
        tip: 'Explain the problem, your approach, and the outcome with metrics.'
      },
      {
        question: 'How do you handle tight deadlines and competing priorities?',
        category: 'Behavioral',
        difficulty: 'Medium',
        tip: 'Show your prioritization process and communication skills.'
      },
      {
        question: 'Tell me about a time you mentored or helped a junior engineer grow.',
        category: 'Leadership',
        difficulty: 'Easy',
        tip: 'Focus on specific actions you took and the measurable growth.'
      },
      {
        question: 'Explain a complex technical concept to a non-technical audience.',
        category: 'Communication',
        difficulty: 'Medium',
        tip: 'Use analogies and avoid jargon.'
      },
      {
        question: 'Describe a situation where you had to make a trade-off in system design.',
        category: 'Technical',
        difficulty: 'Hard',
        tip: 'Explain the options, criteria, and why you chose one over the other.'
      },
      {
        question: 'How do you ensure code quality and maintainability in a fast-paced environment?',
        category: 'Technical',
        difficulty: 'Medium',
        tip: 'Talk about code reviews, testing, and technical debt management.'
      },
      {
        question: 'Tell me about a time you disagreed with a technical decision.',
        category: 'Behavioral',
        difficulty: 'Medium',
        tip: 'Show your ability to disagree respectfully and find common ground.'
      },
      {
        question: 'What excites you about this role at TestCorp?',
        category: 'Motivation',
        difficulty: 'Easy' as 'Easy',
        tip: 'Show you have researched the company and connect it to your career goals.'
      }
    ];
    
    const recruiterQuestions = questions.slice(0, 4);
    const hmQuestions = questions.slice(3, 7);
    const peerQuestions = questions.slice(6, 10);
    
    db.prepare(`
      INSERT INTO job_interview_questions (
        id, job_id, recruiter_questions, hiring_manager_questions, peer_questions,
        generated_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `iq-${jobId}`,
      jobId,
      JSON.stringify(recruiterQuestions),
      JSON.stringify(hmQuestions),
      JSON.stringify(peerQuestions),
      now,
      now
    );
    
    console.log('✅ Interview questions seeded');
    
    // Verify seeding
    const verifyQuestions = db.prepare(`
      SELECT * FROM job_interview_questions WHERE job_id = ?
    `).get(jobId) as any;
    
    if (verifyQuestions) {
      console.log('📊 Verified questions in DB:', {
        recruiter: JSON.parse(verifyQuestions.recruiter_questions || '[]').length,
        hm: JSON.parse(verifyQuestions.hiring_manager_questions || '[]').length,
        peer: JSON.parse(verifyQuestions.peer_questions || '[]').length
      });
    }
    
    // 5. Create searched questions cache (web search simulation)
    const searchedQuestions = questions.slice(0, 5).map(q => ({
      ...q,
      source: 'glassdoor',
      url: 'https://glassdoor.com/interview/testcorp'
    }));
    
    db.prepare(`
      INSERT INTO interview_questions_cache (
        id, company_name, role_category, searched_questions, search_sources,
        searched_at, created_at, expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `iqc-${jobId}`,
      'TestCorp Inc.',
      'Backend Engineer',
      JSON.stringify(searchedQuestions),
      JSON.stringify(['https://glassdoor.com', 'https://levels.fyi']),
      now,
      now,
      now + (90 * 86400) // 90 days TTL
    );
    
    console.log('✅ Interview questions cache created');
    
    console.log(`🎉 Test job setup complete: ${jobId}`);
    
    return jobId;
    
  } catch (error) {
    console.error('❌ Failed to setup test job:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Cleanup test job and all related data
 */
export async function cleanupTestJob(jobId: string): Promise<void> {
  const db = new Database(DB_PATH);
  
  try {
    console.log(`🧹 Cleaning up test job: ${jobId}`);
    
    // Delete in correct order (respecting foreign keys)
    db.prepare('DELETE FROM interview_questions_cache WHERE company_name LIKE ?').run('TestCorp%');
    db.prepare('DELETE FROM job_interview_questions WHERE job_id = ?').run(jobId);
    db.prepare('DELETE FROM job_analysis_bundles WHERE job_id = ?').run(jobId);
    db.prepare('DELETE FROM coach_state WHERE job_id = ?').run(jobId);
    db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
    
    console.log('✅ Cleanup complete');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Helper: Select multiple questions in Interview Coach
 */
export async function selectQuestions(page: Page, count: number) {
  const checkboxes = page.locator('[data-testid="question-checkbox"]');
  
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).click();
  }
  
  // Wait for auto-save
  await page.waitForTimeout(2500);
}

/**
 * Helper: Draft and score an answer
 */
export async function draftAndScoreAnswer(page: Page, answerText: string) {
  await page.locator('[data-testid="answer-textarea"]').fill(answerText);
  await page.locator('button:has-text("Score This Answer")').click();
  
  // Wait for AI scoring (can take 5-8 seconds)
  await page.waitForTimeout(10000);
}

/**
 * Helper: Draft a high-quality answer that should score ≥ 75
 */
export async function draftHighQualityAnswer(page: Page) {
  const goodAnswer = `
At BigTech Corp, I led the migration of our monolithic application to microservices architecture.

Situation: Our monolith was causing 4-hour deployments and preventing us from scaling beyond 10K concurrent users. The business needed to move faster and handle 50K users.

Task: As tech lead, I was responsible for architecting the microservices platform and leading a team of 6 engineers through the migration over 4 months.

Action: I designed the service boundaries using domain-driven design principles, breaking the monolith into 8 microservices. We used Docker for containerization and Kubernetes for orchestration. The biggest challenge was maintaining zero downtime during migration. I solved this by implementing feature flags for gradual rollout and blue-green deployments. I also conducted weekly architecture reviews and mentored 2 junior engineers on distributed systems patterns.

Result: We reduced deployment time from 4 hours to 30 minutes (87% improvement), cut infrastructure costs by $200K annually through better resource utilization, and successfully scaled to 50K concurrent users. Our team's velocity increased 3x - we shipped features weekly instead of monthly. Two junior engineers on my team were promoted to mid-level roles.
  `.trim();
  
  await draftAndScoreAnswer(page, goodAnswer);
}

/**
 * Helper: Complete 3 talk tracks (full flow)
 */
export async function completeThreeTalkTracks(page: Page) {
  // Select 3 questions
  await selectQuestions(page, 3);
  
  // Go to Practice tab
  await page.locator('button:has-text("Practice & Score")').click();
  
  // Complete 3 questions
  for (let i = 0; i < 3; i++) {
    // Select question
    await page.locator('[data-testid="question-item"]').nth(i).click();
    
    // Draft high-quality answer
    await draftHighQualityAnswer(page);
    
    // Generate talk track
    await page.locator('button:has-text("Generate STAR Talk Track")').click();
    await page.waitForTimeout(8000);
    
    // Go back to question list
    if (i < 2) {
      await page.locator('button:has-text("Next Question")').click();
    }
  }
}

/**
 * Helper: Complete full flow to core stories
 */
export async function completeFlowToCoreStories(page: Page) {
  await completeThreeTalkTracks(page);
  
  // Navigate to Core Stories tab
  await page.locator('button:has-text("Core Stories")').click();
  
  // Extract core stories
  await page.locator('button:has-text("Extract Core Stories")').click();
  await page.waitForTimeout(15000); // AI extraction can take 8-12 seconds
}

