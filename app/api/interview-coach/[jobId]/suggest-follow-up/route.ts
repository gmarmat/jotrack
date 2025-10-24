import { NextRequest, NextResponse } from 'next/server';
import { scoreAnswer, ScoringContext } from '@/src/interview-coach/scoring/index';
import { buildFollowUpPrompts } from '@/src/interview-coach/discovery/prompts';
import { DimensionType } from '@/src/interview-coach/scoring/schema';
import { 
  JobIdParamSchema, 
  SuggestFollowUpRequestSchema, 
  SuggestFollowUpResponseSchema,
  validateRequest, 
  validateResponse, 
  mapErrorToResponse 
} from '@/src/interview-coach/http/schema';
import { logCoachEvent, logCoachError, extractCoachMetrics } from '@/src/interview-coach/telemetry';
import { generateDeltaRationales } from '@/src/interview-coach/discovery/feedback';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

/**
 * POST /api/interview-coach/[jobId]/suggest-follow-up
 * 
 * Generates targeted follow-up prompts based on lowest scoring dimensions
 * and available signal gaps. No LLM calls - pure deterministic logic.
 * 
 * Accepts the same JSON payload as score-answer (V2 fields)
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

    // Validate request body against schema
    const bodyValidation = validateRequest(SuggestFollowUpRequestSchema, body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { 
          error: bodyValidation.error.message,
          code: bodyValidation.error.code,
          issues: bodyValidation.error.issues,
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }
    
    // V2: New body structure with enhanced fields
    const { 
      answer, 
      persona, 
      jdCore, 
      companyValues, 
      userProfile, 
      matchMatrix, 
      evidenceQuality,
      previous: requestPrevious
    } = bodyValidation.data;
    
    console.log(`🎯 Generating follow-up prompts for job ${jobId}...`);
    
    // V2: Build previous from coach state if missing
    let previous = requestPrevious;
    if (!previous) {
      try {
        const coachStateRow = sqlite.prepare(`
          SELECT interview_coach_json FROM coach_state WHERE job_id = ? LIMIT 1
        `).get(jobId) as any;
        
        if (coachStateRow?.interview_coach_json) {
          const interviewCoachData = JSON.parse(coachStateRow.interview_coach_json);
          const answers = interviewCoachData.answers || {};
          
          // Find the most recent score for this question
          const questionId = bodyValidation.data.questionId || 'unknown';
          const questionData = answers[questionId];
          
          if (questionData?.scores && Array.isArray(questionData.scores) && questionData.scores.length > 0) {
            const lastScore = questionData.scores[questionData.scores.length - 1];
            previous = {
              overall: lastScore.overall || 0,
              subscores: lastScore.subscores || {}
            };
            console.log('✅ Built previous from coach state:', previous);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load previous from coach state:', error);
      }
    }
    
    // Build ScoringContext for V2 scoring
    const scoringContext: ScoringContext = {
      answer,
      persona: persona as 'recruiter' | 'hm' | 'peer',
      jdCore,
      companyValues,
      userProfile,
      matchMatrix,
      styleProfileId: null
    };
    
    // Get V2 scoring result (deterministic)
    const scoring = scoreAnswer(scoringContext);
    
    // Generate follow-up prompts based on lowest dimensions and gaps
    const prompts = buildFollowUpPrompts(scoringContext, {
      subscores: scoring.subscores,
      flags: scoring.flags
    });
    
    // Extract targeted dimensions (sorted by priority)
    const targetedDimensions = prompts
      .flatMap(p => p.targets)
      .filter((dim, index, arr) => arr.indexOf(dim) === index) // Remove duplicates
      .slice(0, 2); // Top 2 dimensions
    
    // Generate reasons for the suggestions
    const reasons: string[] = [];
    if (targetedDimensions.length > 0) {
      reasons.push('low subscores detected');
    }
    
    // Check for signal gaps
    const gaps: string[] = [];
    if (!jdCore?.length) gaps.push('missing JD');
    if (!companyValues?.length) gaps.push('missing company values');
    if (!userProfile) gaps.push('missing user profile');
    if (!matchMatrix?.communityTopics) gaps.push('missing community context');
    
    if (gaps.length > 0) {
      reasons.push(`signal gaps: ${gaps.join(', ')}`);
    }
    
    console.log('✅ Generated follow-up prompts:', {
      promptCount: prompts.length,
      targetedDimensions,
      reasons: reasons.length
    });
    
    // V2: Calculate delta and rationale
    let delta = null;
    if (previous && scoring) {
      const points = scoring.overall - (previous.overall || 0);
      
      // Generate delta rationales
      let deltaReasons: string[] = [];
      if (previous.subscores && scoring.subscores) {
        try {
          deltaReasons = generateDeltaRationales(
            previous.subscores,
            scoring.subscores,
            scoring.flags || []
          );
        } catch (error) {
          console.warn('⚠️ Delta rationale generation failed:', error);
          deltaReasons = [];
        }
      }
      
      // Find the two lowest dimensions for rationale
      const dimensionScores = Object.entries(scoring.subscores || {})
        .sort(([,a], [,b]) => (a as number) - (b as number))
        .slice(0, 2)
        .map(([dim]) => dim);
      
      const reason = deltaReasons.length > 0 
        ? deltaReasons.join('; ') 
        : `${points > 0 ? '+' : ''}${points} points (${dimensionScores.join(', ')})`;
      
      delta = {
        points,
        reason,
        dims: dimensionScores
      };
    }
    
    // V2: Always return enhanced format
    const response = {
      success: true,
      version: 'v2',
      prompts,
      targetedDimensions,
      delta
    };
    
    // Validate response schema during development/testing
    const isValidResponse = validateResponse(SuggestFollowUpResponseSchema, response);
    if (!isValidResponse) {
      console.warn('⚠️ Response validation failed - returning response anyway');
    }
    
    // Log telemetry event
    const metrics = extractCoachMetrics(response);
    logCoachEvent({
      route: 'suggest-follow-up',
      persona: persona || 'unknown',
      durationMs: 0, // Duration would need to be measured from start
      ...metrics,
      metadata: { answer, persona }
    });
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Follow-up prompt generation failed:', error);
    
    // Log error telemetry
    logCoachError('suggest-follow-up', persona || 'unknown', error, { 
      answer, 
      persona
    });
    
    // Map error to standardized format
    const errorResponse = mapErrorToResponse(error);
    
    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}