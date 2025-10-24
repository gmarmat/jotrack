import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import { synthesizeCoreStories, SynthesisInput, AnswerItem, Persona } from '@/src/interview-coach/stories/synth';
import { 
  JobIdParamSchema, 
  ExtractCoreStoriesRequestSchema, 
  ExtractCoreStoriesResponseSchema,
  validateRequest, 
  validateResponse, 
  mapErrorToResponse 
} from '@/src/interview-coach/http/schema';
import { logCoachEvent, logCoachError, extractCoachMetrics } from '@/src/interview-coach/telemetry';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

/**
 * POST /api/interview-coach/[jobId]/extract-core-stories
 * V2: Deterministic core story synthesis from user answers and themes
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Validate job ID parameter
    const jobIdValidation = validateRequest(JobIdParamSchema, context.params);
    if (!jobIdValidation.success) {
      return NextResponse.json(
        { 
          error: jobIdValidation.error.message,
          code: jobIdValidation.error.code,
          issues: jobIdValidation.error.issues,
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }
    const jobId = jobIdValidation.data.jobId;

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          issues: ['Request body must be valid JSON'],
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }
    
    // Check for V2 feature flag
    const useV2 = process.env.INTERVIEW_V2 === '1';
    
    if (!useV2) {
      // Legacy behavior - return minimal shape
      return NextResponse.json({
        stories: [
          "Strategic Leadership Initiative",
          "Technical Problem Solving",
          "Team Collaboration Success"
        ]
      });
    }
    
    // Parse request body with safe defaults
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const themes = Array.isArray(body.themes) ? body.themes : [];
    const persona = body.persona || 'hiring-manager';

    // If no answers provided, try to get from database
    if (answers.length === 0) {
      try {
        const coachStateRow = sqlite.prepare(`
          SELECT interview_coach_json FROM coach_state 
          WHERE job_id = ? AND interview_coach_json IS NOT NULL
          ORDER BY created_at DESC LIMIT 1
        `).get(jobId);

        if (coachStateRow?.interview_coach_json) {
          const coachData = JSON.parse(coachStateRow.interview_coach_json);
          const mainAnswers = Object.values(coachData.answers || {});
          
          for (const answerData of mainAnswers) {
            if (answerData.answerText) {
              answers.push({
                questionId: 'main-answer',
                text: answerData.answerText
              });
            }
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Could not load answers from database:', dbError);
      }
    }

    // If still no answers, return helpful message
    if (answers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No answers found yet. Please provide some answers first.',
        version: 'v2',
        coverage: { star: 0, specificity: 0, outcome: 0, role: 0, company: 0 },
        personas: { recruiter: [], 'hiring-manager': [], peer: [] }
      });
    }
    
    // Set defaults for optional parameters
    const maxStories = body.maxStories || 4;
    const minStories = body.minStories || 2;
    
    console.log(`🎯 Synthesizing core stories for ${persona} persona...`);
    console.log(`📊 Input: ${answers.length} answers, ${themes.length} themes`);
    
    // Build synthesis input
    const synthesisInput: SynthesisInput = {
      answers: answers as AnswerItem[],
      themes: themes as string[],
      persona: persona as Persona,
      maxStories: maxStories || 4,
      minStories: minStories || 3
    };
    
    // Synthesize core stories (deterministic, no LLM)
    const result = synthesizeCoreStories(synthesisInput);
    
    console.log('✅ Core stories synthesized:', {
      storiesCount: result.coreStories.length,
      coveragePercentage: Math.round((Object.keys(result.coverageMap).filter(theme => 
        result.coverageMap[theme].length > 0
      ).length / themes.length) * 100)
    });
    
    // Save to coach_state.interview_coach_json
    const now = Math.floor(Date.now() / 1000);
    
    // Get existing coach state
    const coachStateRow = sqlite.prepare(`
      SELECT interview_coach_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId);
    
    let interviewCoachData: any = {};
    if (coachStateRow?.interview_coach_json) {
      try {
        interviewCoachData = JSON.parse(coachStateRow.interview_coach_json);
      } catch (error) {
        console.warn('Failed to parse existing coach data, starting fresh');
      }
    }
    
    // Update with new core stories
    interviewCoachData.coreStories = result.coreStories;
    interviewCoachData.coverageMap = result.coverageMap;
    interviewCoachData.storyRationale = result.rationale;
    interviewCoachData.coreStoriesExtractedAt = now;
    interviewCoachData.synthesisVersion = result.version;
    
    // Update progress
    interviewCoachData.progress = interviewCoachData.progress || {};
    interviewCoachData.progress.coreStoriesExtracted = true;
    interviewCoachData.progress.coreStoriesCount = result.coreStories.length;
    
    // Save to database
    sqlite.prepare(`
      UPDATE coach_state 
      SET interview_coach_json = ?, updated_at = ?
      WHERE job_id = ?
    `).run(JSON.stringify(interviewCoachData), now, jobId);
    
    console.log(`💾 Saved ${result.coreStories.length} core stories to database`);
    
    // Return V2 response format
    const response = {
      success: true,
      coreStories: result.coreStories,
      coverageMap: result.coverageMap,
      rationale: result.rationale,
      version: 'v2',
      coverage: {
        star: result.coverageMap.star?.length || 0,
        specificity: result.coverageMap.specificity?.length || 0,
        outcome: result.coverageMap.outcome?.length || 0,
        role: result.coverageMap.role?.length || 0,
        company: result.coverageMap.company?.length || 0
      },
      personas: {
        recruiter: result.coreStories.map(s => s.recruiter || s.long),
        'hiring-manager': result.coreStories.map(s => s.hm || s.long),
        peer: result.coreStories.map(s => s.peer || s.long)
      },
      extractedAt: now,
      metadata: {
        answersAnalyzed: answers.length,
        themesCovered: Object.keys(result.coverageMap).filter(theme => 
          result.coverageMap[theme].length > 0
        ).length,
        totalThemes: themes.length,
        synthesisMethod: 'deterministic'
      }
    };
    
    // Validate response schema during development/testing
    const isValidResponse = validateResponse(ExtractCoreStoriesResponseSchema, response);
    if (!isValidResponse) {
      console.warn('⚠️ Response validation failed - returning response anyway');
    }
    
    // Log telemetry event
    const metrics = extractCoachMetrics(response);
    logCoachEvent({
      route: 'extract-core-stories',
      persona: persona || 'unknown',
      durationMs: 0, // Duration would need to be measured from start
      ...metrics,
      metadata: { persona, answersCount: answers.length, themesCount: themes.length }
    });
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Core stories synthesis failed:', error);
    
    // Log error telemetry
    logCoachError('extract-core-stories', persona || 'unknown', error, { 
      persona, 
      answersCount: answers?.length || 0, 
      themesCount: themes?.length || 0 
    });
    
    // Map error to standardized format
    const errorResponse = mapErrorToResponse(error);
    
    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}

