import { NextRequest, NextResponse } from 'next/server';
import { db, sqlite } from '@/db/client';
import { jobs, jobInterviewQuestions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.id;
    
    console.log(`✨ Generating AI interview questions for job ${jobId}...`);
    
    // Get job details
    const job = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    
    if (job.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    const jobData = job[0];
    const companyName = jobData.company || 'Unknown Company';
    const jobTitle = jobData.title || 'Unknown Role';
    
    // Get JD text for context
    let jobDescription = '';
    try {
      // Try to get from job record first
      jobDescription = jobData.jobDescription || '';
      
      // If not in job record, fetch from analysis-data endpoint
      if (!jobDescription) {
        const baseUrl = request.nextUrl.origin;
        const res = await fetch(`${baseUrl}/api/jobs/${jobId}/analysis-data`);
        if (res.ok) {
          const data = await res.json();
          jobDescription = data.jobDescription || '';
        }
      }
    } catch (error) {
      console.error('Failed to fetch job description:', error);
    }
    
    const jdSummary = jobDescription.substring(0, 500); // First 500 chars for recruiter
    
    // Extract technical skills from JD for peer questions
    const technicalSkills = extractTechnicalSkills(jobDescription);
    
    console.log('🎭 Generating questions for 3 personas in parallel...');
    
    // Generate questions for 3 personas in parallel
    const [recruiterResult, hiringManagerResult, peerResult] = await Promise.all([
      // Recruiter questions (10 questions)
      callAiProvider('interview-questions-recruiter', {
        companyName,
        jobTitle,
        jdSummary
      }, false, 'v1').catch(err => {
        console.error('Recruiter questions failed:', err);
        return { result: { questions: [] } };
      }),
      
      // Hiring Manager questions (15 questions)
      callAiProvider('interview-questions-hiring-manager', {
        companyName,
        jobTitle,
        jobDescription,
        resumeSummary: 'TBD - will pull from coach profile in future'
      }, false, 'v1').catch(err => {
        console.error('Hiring Manager questions failed:', err);
        return { result: { questions: [] } };
      }),
      
      // Peer questions (12 questions)
      callAiProvider('interview-questions-peer', {
        companyName,
        jobTitle,
        jobDescription,
        technicalSkills
      }, false, 'v1').catch(err => {
        console.error('Peer questions failed:', err);
        return { result: { questions: [] } };
      })
    ]);
    
    // Parse results (handle both string and object responses)
    const recruiterQuestions = parseAiResult(recruiterResult.result);
    const hiringManagerQuestions = parseAiResult(hiringManagerResult.result);
    const peerQuestions = parseAiResult(peerResult.result);
    
    console.log('✅ Generated questions:', {
      recruiter: recruiterQuestions.questions?.length || 0,
      hiringManager: hiringManagerQuestions.questions?.length || 0,
      peer: peerQuestions.questions?.length || 0
    });
    
    // Save to database
    const now = Math.floor(Date.now() / 1000);
    
    // Check if already exists
    const existing = await db
      .select()
      .from(jobInterviewQuestions)
      .where(eq(jobInterviewQuestions.jobId, jobId))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing
      await db
        .update(jobInterviewQuestions)
        .set({
          recruiterQuestions: JSON.stringify(recruiterQuestions),
          hiringManagerQuestions: JSON.stringify(hiringManagerQuestions),
          peerQuestions: JSON.stringify(peerQuestions),
          generatedAt: now
        })
        .where(eq(jobInterviewQuestions.jobId, jobId));
    } else {
      // Insert new
      await db.insert(jobInterviewQuestions).values({
        id: uuidv4(),
        jobId,
        recruiterQuestions: JSON.stringify(recruiterQuestions),
        hiringManagerQuestions: JSON.stringify(hiringManagerQuestions),
        peerQuestions: JSON.stringify(peerQuestions),
        generatedAt: now,
        createdAt: now
      });
    }
    
    // Update jobs table timestamp
    await db.update(jobs)
      .set({ interviewQuestionsGeneratedAt: now })
      .where(eq(jobs.id, jobId));
    
    console.log(`✅ AI questions saved to database for job ${jobId}`);
    
    return NextResponse.json({
      success: true,
      recruiter: recruiterQuestions,
      hiringManager: hiringManagerQuestions,
      peer: peerQuestions,
      generatedAt: now
    });
  } catch (error: any) {
    console.error('❌ AI question generation failed:', error);
    return NextResponse.json(
      { error: `Generation failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Parse AI result - handle both string and object responses
 * Also strips markdown code blocks if present
 */
function parseAiResult(result: any): any {
  if (typeof result === 'string') {
    // Strip markdown code blocks if present
    const cleaned = result
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse AI result:', error);
      return { questions: [] };
    }
  }
  
  return result || { questions: [] };
}

/**
 * Extract technical skills from job description
 * Simple keyword matching - can be enhanced later
 */
function extractTechnicalSkills(jd: string): string {
  const skills: string[] = [];
  
  // Common technical skills to look for
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'REST API', 'GraphQL', 'gRPC', 'WebSocket',
    'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
    'Machine Learning', 'Data Science', 'AI',
    'Microservices', 'Distributed Systems', 'System Design'
  ];
  
  const lowerJd = jd.toLowerCase();
  
  for (const skill of commonSkills) {
    if (lowerJd.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }
  
  // Return comma-separated or fallback
  return skills.length > 0 
    ? skills.join(', ') 
    : 'General software engineering and problem-solving';
}

