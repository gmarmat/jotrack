import { NextRequest, NextResponse } from 'next/server';
import { db, sqlite } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

/**
 * POST /api/coach/[jobId]/generate-talk-tracks
 * Generates personalized STAR-format talk tracks for interview questions
 * Uses user's writing style profile for authentic voice
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.jobId;
    const body = await request.json();
    const { question, persona } = body; // persona: 'recruiter', 'hiring-manager', 'peer'
    
    if (!question || !persona) {
      return NextResponse.json(
        { error: 'question and persona required' },
        { status: 400 }
      );
    }
    
    console.log(`💬 Generating talk track for ${persona}: "${question.substring(0, 60)}..."`);
    
    // Get job details
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get coach state (writing style profile + discovery)
    const coachStateRow = sqlite.prepare(`
      SELECT data_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId);
    
    if (!coachStateRow) {
      return NextResponse.json(
        { error: 'No coach session found. Complete discovery wizard first.' },
        { status: 400 }
      );
    }
    
    const coachState = JSON.parse(coachStateRow.data_json);
    const writingStyleProfile = coachState.writingStyleProfile;
    
    if (!writingStyleProfile) {
      return NextResponse.json(
        { error: 'Writing style not evaluated. Run evaluation first.' },
        { status: 400 }
      );
    }
    
    // Get resume and JD from bundle
    let resumeContent = '';
    let jobDescription = '';
    
    try {
      const { resumeVariant, jdVariant } = await getJobAnalysisVariants(jobId);
      resumeContent = resumeVariant.aiOptimized || resumeVariant.raw || '';
      jobDescription = jdVariant.aiOptimized || jdVariant.raw || '';
    } catch (error) {
      console.warn('Missing documents:', error);
    }
    
    // Extract resume summary (first 1500 chars for context)
    const resumeSummary = resumeContent.substring(0, 1500);
    
    // Load interviewer profile for persona-specific talk tracks
    let recruiterProfile = null;
    try {
      const peopleAnalysis = sqlite.prepare(`
        SELECT result_json FROM people_analyses WHERE job_id = ? LIMIT 1
      `).get(jobId) as any;
      
      if (peopleAnalysis && peopleAnalysis.result_json) {
        const peopleProfiles = JSON.parse(peopleAnalysis.result_json);
        
        // Find matching profile by persona
        if (peopleProfiles?.profiles) {
          if (persona === 'recruiter') {
            recruiterProfile = peopleProfiles.profiles.find((p: any) => 
              p.role === 'Recruiter' || p.role === 'recruiter'
            );
          } else if (persona === 'hiring-manager') {
            recruiterProfile = peopleProfiles.profiles.find((p: any) => 
              p.role === 'Hiring Manager' || p.role === 'hiring_manager'
            );
          } else if (persona === 'peer') {
            recruiterProfile = peopleProfiles.profiles.find((p: any) => 
              p.role === 'Peer/Panel Interviewer' || p.role === 'peer'
            );
          }
          
          if (recruiterProfile) {
            console.log(`✅ Using interviewer profile: ${recruiterProfile.name} (${recruiterProfile.role})`);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ No interviewer profile found (will use generic talk track):', error);
      // Continue without interviewer profile - not a blocker
    }
    
    // Build persona-specific context
    let capability = '';
    let promptInputs: any = {
      companyName: job.company,
      roleTitle: job.title,
      interviewQuestion: question,
      resumeSummary,
      writingStyleProfile: JSON.stringify(writingStyleProfile, null, 2),
      recruiterProfile: recruiterProfile || null  // Pass interviewer profile if available
    };
    
    if (persona === 'recruiter') {
      capability = 'talk-track-recruiter';
      promptInputs.jdKeyPoints = extractKeyPoints(jobDescription, 500);
    } else if (persona === 'hiring-manager') {
      capability = 'talk-track-hiring-manager';
      promptInputs.jobDescription = jobDescription.substring(0, 2000);
      promptInputs.teamContext = coachState.teamInsights || 'Not available';
    } else if (persona === 'peer') {
      capability = 'talk-track-peer';
      promptInputs.technicalSkills = extractTechnicalSkills(jobDescription);
    } else {
      return NextResponse.json(
        { error: 'Invalid persona. Must be: recruiter, hiring-manager, or peer' },
        { status: 400 }
      );
    }
    
    console.log(`🎭 Calling ${capability} with writing style profile...`);
    
    // Generate talk track
    const aiResult = await callAiProvider(capability, promptInputs, false, 'v1');
    
    // Parse result
    let talkTrack;
    if (typeof aiResult.result === 'string') {
      const cleaned = aiResult.result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      talkTrack = JSON.parse(cleaned);
    } else {
      talkTrack = aiResult.result;
    }
    
    console.log('✅ Talk track generated:', {
      persona,
      wordCount: talkTrack.longForm?.wordCount || 0,
      keyPoints: talkTrack.cheatSheet?.keyPoints?.length || 0
    });
    
    // Save to coach_state (append to talkTracks array)
    const now = Math.floor(Date.now() / 1000);
    const existingTalkTracks = coachState.talkTracks || [];
    
    const updatedTalkTracks = [
      ...existingTalkTracks,
      {
        ...talkTrack,
        generatedAt: now,
        questionId: crypto.createHash('md5').update(question).digest('hex').substring(0, 8)
      }
    ];
    
    const updatedState = {
      ...coachState,
      talkTracks: updatedTalkTracks,
      lastTalkTrackGeneratedAt: now
    };
    
    sqlite.prepare(`
      UPDATE coach_state 
      SET data_json = ?, updated_at = ?
      WHERE job_id = ?
    `).run(JSON.stringify(updatedState), now, jobId);
    
    console.log(`💾 Saved talk track to coach_state (total: ${updatedTalkTracks.length})`);
    
    return NextResponse.json({
      success: true,
      talkTrack,
      generatedAt: now,
      metadata: {
        tokensUsed: aiResult.tokensUsed || 0,
        cost: aiResult.cost || 0,
        persona,
        questionLength: question.length
      }
    });
  } catch (error: any) {
    console.error('❌ Talk track generation failed:', error);
    return NextResponse.json(
      { error: `Generation failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Extract key points from JD (for recruiter context)
 */
function extractKeyPoints(jdText: string, maxChars: number): string {
  const lines = jdText.split('\n').filter(line => line.trim().length > 0);
  let result = '';
  
  for (const line of lines) {
    if (result.length + line.length > maxChars) break;
    if (line.includes('•') || line.includes('-') || /^\d+\./.test(line)) {
      result += line + '\n';
    }
  }
  
  return result || jdText.substring(0, maxChars);
}

/**
 * Extract technical skills from JD
 */
function extractTechnicalSkills(jdText: string): string {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
    'AWS', 'Kubernetes', 'Docker', 'PostgreSQL', 'MongoDB', 'Redis',
    'GraphQL', 'REST API', 'Microservices', 'CI/CD'
  ];
  
  const found: string[] = [];
  const lowerJd = jdText.toLowerCase();
  
  for (const skill of commonSkills) {
    if (lowerJd.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }
  
  return found.length > 0 
    ? found.join(', ')
    : 'General software engineering and problem-solving';
}

