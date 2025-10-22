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
    const body = await request.json().catch(() => ({}));
    const persona = body.persona || 'all'; // 'recruiter', 'hiring-manager', 'peer', or 'all'
    
    console.log(`✨ Generating AI interview questions for job ${jobId} (persona: ${persona})...`);
    
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
    
    // Load Match Score + Skills Match data (V2.0 - Skills Gap Targeting!)
    let matchScore = 0;
    let skillsMatch: any[] = [];
    let strongSkills: any[] = [];
    let weakCriticalSkills: any[] = [];
    
    try {
      const matchScoreData = sqlite.prepare(`
        SELECT match_score_data FROM jobs WHERE id = ? LIMIT 1
      `).get(jobId) as any;
      
      if (matchScoreData && matchScoreData.match_score_data) {
        const parsed = JSON.parse(matchScoreData.match_score_data);
        matchScore = parsed.matchScore || 0;
        skillsMatch = parsed.skillsMatch || [];
        
        // Identify strong skills (showcase opportunities!)
        strongSkills = skillsMatch
          .filter((s: any) => s.matchStrength === 'strong')
          .sort((a: any, b: any) => 
            (b.importance === 'critical' ? 2 : b.importance === 'important' ? 1 : 0) -
            (a.importance === 'critical' ? 2 : a.importance === 'important' ? 1 : 0)
          )
          .slice(0, 5); // Top 5 strong skills
        
        // Identify weak critical skills (gaps to address!)
        weakCriticalSkills = skillsMatch
          .filter((s: any) => s.matchStrength === 'weak' && s.importance === 'critical');
        
        console.log('✅ Loaded skills data:', {
          matchScore,
          strongSkills: strongSkills.map((s: any) => s.skill),
          weakSkills: weakCriticalSkills.map((s: any) => s.skill)
        });
      }
    } catch (error) {
      console.error('⚠️ Failed to load match score (will use generic questions):', error);
      // Continue without match score - not a blocker
    }
    
    // Load People Profiles analysis for persona-specific questions
    let peopleProfiles = null;
    let recruiterProfile = null;
    let hiringManagerProfile = null;
    let peerProfile = null;
    
    try {
      const peopleAnalysis = sqlite.prepare(`
        SELECT result_json FROM people_analyses WHERE job_id = ? LIMIT 1
      `).get(jobId) as any;
      
      if (peopleAnalysis && peopleAnalysis.result_json) {
        peopleProfiles = JSON.parse(peopleAnalysis.result_json);
        
        // Extract individual profiles by role
        if (peopleProfiles?.profiles) {
          recruiterProfile = peopleProfiles.profiles.find((p: any) => 
            p.role === 'Recruiter' || p.role === 'recruiter'
          );
          hiringManagerProfile = peopleProfiles.profiles.find((p: any) => 
            p.role === 'Hiring Manager' || p.role === 'hiring_manager'
          );
          peerProfile = peopleProfiles.profiles.find((p: any) => 
            p.role === 'Peer/Panel Interviewer' || p.role === 'peer'
          );
          
          console.log('✅ Loaded people profiles:', {
            hasRecruiter: !!recruiterProfile,
            hasHiringManager: !!hiringManagerProfile,
            hasPeer: !!peerProfile
          });
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to load people profiles (will use generic questions):', error);
      // Continue without people profiles - not a blocker
    }
    
    // Determine which personas to generate based on request
    const shouldGenerateRecruiter = persona === 'all' || persona === 'recruiter';
    const shouldGenerateHiringManager = persona === 'all' || persona === 'hiring-manager';
    const shouldGeneratePeer = persona === 'all' || persona === 'peer';
    
    console.log('🎭 Generating questions for selected persona(s):', {
      recruiter: shouldGenerateRecruiter,
      hiringManager: shouldGenerateHiringManager,
      peer: shouldGeneratePeer
    });
    
    // Generate only requested personas (saves tokens!)
    const promises = [];
    
    if (shouldGenerateRecruiter) {
      promises.push(
        callAiProvider('interview-questions-recruiter', {
          companyName,
          jobTitle,
          jdSummary,
          recruiterProfile: recruiterProfile || null,  // Pass profile if available
          // V2.0: Skills Gap Targeting
          matchScore,
          strongSkills: strongSkills.map((s: any) => `${s.skill} (${s.yearsExperience || 0} years)`).join(', '),
          weakSkills: weakCriticalSkills.map((s: any) => s.skill).join(', '),
          careerLevel: 'TBD', // TODO: Extract from Tier 3
          industryTenure: 0,   // TODO: Extract from Tier 3
          stabilityScore: 100  // TODO: Extract from Tier 3
        }, false, 'v2').catch(err => { // v1 → v2!
          console.error('Recruiter questions failed:', err);
          return { result: { questions: [] } };
        })
      );
    }
    
    if (shouldGenerateHiringManager) {
      promises.push(
        callAiProvider('interview-questions-hiring-manager', {
          companyName,
          jobTitle,
          jobDescription,
          resumeSummary: 'TBD - will pull from coach profile in future',
          hiringManagerProfile: hiringManagerProfile || null,  // Pass profile if available
          // V2.0: Skills Gap Targeting
          matchScore,
          strongSkills: strongSkills.map((s: any) => `${s.skill} (${s.yearsExperience || 0} years)`).join(', '),
          weakSkills: weakCriticalSkills.map((s: any) => s.skill).join(', '),
          careerLevel: 'TBD', // TODO: Extract from Tier 3
          industryTenure: 0,   // TODO: Extract from Tier 3
          stabilityScore: 100  // TODO: Extract from Tier 3
        }, false, 'v2').catch(err => { // v1 → v2!
          console.error('Hiring Manager questions failed:', err);
          return { result: { questions: [] } };
        })
      );
    }
    
    if (shouldGeneratePeer) {
      promises.push(
        callAiProvider('interview-questions-peer', {
          companyName,
          jobTitle,
          jobDescription,
          technicalSkills,
          peerProfile: peerProfile || null,  // Pass profile if available
          // V2.0: Skills Gap Targeting
          matchScore,
          strongSkills: strongSkills.map((s: any) => `${s.skill} (${s.yearsExperience || 0} years)`).join(', '),
          weakSkills: weakCriticalSkills.map((s: any) => s.skill).join(', '),
          careerLevel: 'TBD', // TODO: Extract from Tier 3
          industryTenure: 0,   // TODO: Extract from Tier 3
          stabilityScore: 100  // TODO: Extract from Tier 3
        }, false, 'v2').catch(err => { // v1 → v2!
          console.error('Peer questions failed:', err);
          return { result: { questions: [] } };
        })
      );
    }
    
    const results = await Promise.all(promises);
    
    // Map results back to personas
    let recruiterQuestions = null;
    let hiringManagerQuestions = null;
    let peerQuestions = null;
    let resultIndex = 0;
    
    if (shouldGenerateRecruiter) {
      recruiterQuestions = parseAiResult(results[resultIndex++].result);
    }
    if (shouldGenerateHiringManager) {
      hiringManagerQuestions = parseAiResult(results[resultIndex++].result);
    }
    if (shouldGeneratePeer) {
      peerQuestions = parseAiResult(results[resultIndex++].result);
    }
    
    console.log('✅ Generated questions:', {
      recruiter: recruiterQuestions?.questions?.length || 0,
      hiringManager: hiringManagerQuestions?.questions?.length || 0,
      peer: peerQuestions?.questions?.length || 0
    });
    
    // V2.0: AI Synthesis - Generate themes and final 4 questions
    let themes = [];
    let synthesizedQuestions = [];
    
    try {
      const allQuestions = [
        ...(recruiterQuestions?.questions || []),
        ...(hiringManagerQuestions?.questions || []),
        ...(peerQuestions?.questions || [])
      ];
      
      if (allQuestions.length > 0) {
        console.log('🧠 Running AI synthesis on', allQuestions.length, 'questions...');
        
        const synthesisResult = await callAiProvider('interview-questions-synthesis', {
          companyName,
          jobTitle,
          allQuestions: JSON.stringify(allQuestions),
          persona,
          totalCount: allQuestions.length
        }, false, 'v1').catch(err => {
          console.error('Synthesis failed:', err);
          return { result: { themes: [], synthesizedQuestions: [] } };
        });
        
        const synthesis = parseAiResult(synthesisResult.result);
        themes = synthesis.themes || [];
        synthesizedQuestions = synthesis.synthesizedQuestions || [];
        
        console.log('✅ Synthesis complete:', {
          themes: themes.length,
          synthesizedQuestions: synthesizedQuestions.length
        });
      }
    } catch (error) {
      console.error('⚠️ Synthesis failed, using fallback:', error);
      // Fallback to hardcoded synthesis
      themes = [
        { theme: 'Culture Fit & Motivation', questionCount: 8, representative: 'Why this company?' },
        { theme: 'Past Experience & Skills', questionCount: 6, representative: 'Tell me about yourself' },
        { theme: 'Behavioral (STAR)', questionCount: 5, representative: 'Describe a challenging project' },
        { theme: 'Logistics & Compensation', questionCount: 2, representative: 'What are your salary expectations?' }
      ];
      synthesizedQuestions = [
        'Tell me about yourself',
        persona === 'recruiter' ? `Why ${companyName}?` : `What's your leadership style?`,
        'Describe a challenging project or stakeholder conflict',
        persona === 'recruiter' ? 'What are your salary expectations?' : 'How do you handle disagreements?'
      ];
    }
    
    // Save to database
    const now = Math.floor(Date.now() / 1000);
    
    // Check if already exists
    const existing = await db
      .select()
      .from(jobInterviewQuestions)
      .where(eq(jobInterviewQuestions.jobId, jobId))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing - only update requested personas
      const updateData: any = { generatedAt: now };
      
      if (shouldGenerateRecruiter) {
        updateData.recruiterQuestions = JSON.stringify(recruiterQuestions);
      }
      if (shouldGenerateHiringManager) {
        updateData.hiringManagerQuestions = JSON.stringify(hiringManagerQuestions);
      }
      if (shouldGeneratePeer) {
        updateData.peerQuestions = JSON.stringify(peerQuestions);
      }
      
      await db
        .update(jobInterviewQuestions)
        .set(updateData)
        .where(eq(jobInterviewQuestions.jobId, jobId));
    } else {
      // Insert new
      await db.insert(jobInterviewQuestions).values({
        id: uuidv4(),
        jobId,
        recruiterQuestions: recruiterQuestions ? JSON.stringify(recruiterQuestions) : null,
        hiringManagerQuestions: hiringManagerQuestions ? JSON.stringify(hiringManagerQuestions) : null,
        peerQuestions: peerQuestions ? JSON.stringify(peerQuestions) : null,
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
      questions: {
        recruiter: recruiterQuestions,
        hiringManager: hiringManagerQuestions,
        peer: peerQuestions
      },
      themes,
      synthesizedQuestions,
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

