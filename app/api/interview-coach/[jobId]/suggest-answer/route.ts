import { NextRequest, NextResponse } from 'next/server';
import { callAiProvider } from '@/lib/ai/aiProvider';
import { 
  JobIdParamSchema, 
  validateRequest, 
  mapErrorToResponse 
} from '@/src/interview-coach/http/schema';
import { logCoachEvent, logCoachError } from '@/src/interview-coach/telemetry';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

interface SuggestAnswerRequest {
  answer: string;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
  question: string;
  targetedDimensions: string[];
  jdCore?: string | string[];
  companyValues?: string[];
  userProfile?: any;
  matchMatrix?: any;
}

/**
 * POST /api/interview-coach/[jobId]/suggest-answer
 * 
 * Drafts an improved answer based on current answer and targeted dimensions
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
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
    let body: SuggestAnswerRequest;
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

    const { answer, persona, question, targetedDimensions, jdCore, companyValues, userProfile, matchMatrix } = body;

    // Validate required fields
    if (!answer || !persona || !question || !targetedDimensions) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          code: 'MISSING_REQUIRED_FIELDS',
          issues: ['answer, persona, question, and targetedDimensions are required'],
          timestamp: Date.now()
        },
        { status: 400 }
      );
    }

    // Generate deterministic scaffold first
    const scaffold = generateAnswerScaffold(answer, targetedDimensions, jdCore, companyValues);
    
    let draft = scaffold.draft;
    let rationale = scaffold.rationale;

    // If AI_ASSIST_ON flag is enabled, polish with AI
    const aiOn = process.env.AI_ASSIST_ON === '1';
    if (aiOn) {
      try {
        const aiResult = await callAiProvider('text-generation', {
          prompt: buildAIPrompt(question, answer, targetedDimensions, jdCore, companyValues, persona),
          maxTokens: 300,
          temperature: 0.7
        });

        if (aiResult.success && aiResult.data?.text) {
          draft = aiResult.data.text;
          rationale.push('AI-enhanced with improved structure and impact metrics');
        }
      } catch (aiError) {
        console.warn('⚠️ AI enhancement failed, using scaffold:', aiError);
        rationale.push('AI enhancement unavailable, using scaffold');
      }
    }

    const response = {
      draft,
      rationale,
      version: 'v2'
    };

    // Log telemetry event
    logCoachEvent({
      route: 'suggest-answer',
      persona,
      durationMs: 0,
      metadata: { 
        question,
        targetedDimensions,
        aiEnhanced: process.env.AI_ASSIST_ON === '1'
      }
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Answer suggestion failed:', error);

    // Log error telemetry
    logCoachError('suggest-answer', 'unknown', error, {});

    // Map error to standardized format
    const errorResponse = mapErrorToResponse(error);

    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}

/**
 * Generate deterministic scaffold without AI
 */
function generateAnswerScaffold(
  currentAnswer: string,
  targetedDimensions: string[],
  jdCore?: string | string[],
  companyValues?: string[]
): { draft: string; rationale: string[] } {
  const rationale: string[] = [];
  
  // Start with current answer
  let draft = currentAnswer;
  
  // Enhance based on targeted dimensions
  if (targetedDimensions.includes('specificity')) {
    draft += '\n\n[METRIC_PLACEHOLDER: Add specific numbers, percentages, or timeframes]';
    rationale.push('Added metric placeholder for specificity');
  }
  
  if (targetedDimensions.includes('role')) {
    draft += '\n\n[ROLE_PLACEHOLDER: Specify your personal decision and ownership]';
    rationale.push('Added role clarity placeholder');
  }
  
  if (targetedDimensions.includes('outcome')) {
    draft += '\n\n[OUTCOME_PLACEHOLDER: Add business impact and results]';
    rationale.push('Added outcome impact placeholder');
  }
  
  if (targetedDimensions.includes('clarity')) {
    draft += '\n\n[CLARITY_IMPROVEMENT: Restructure for better flow]';
    rationale.push('Added clarity improvement placeholder');
  }
  
  if (targetedDimensions.includes('structure')) {
    draft += '\n\n[STRUCTURE_IMPROVEMENT: Organize with clear sections]';
    rationale.push('Added structure improvement placeholder');
  }
  
  return { draft, rationale };
}

/**
 * Build AI prompt for answer enhancement
 */
function buildAIPrompt(
  question: string,
  currentAnswer: string,
  targetedDimensions: string[],
  jdCore?: string | string[],
  companyValues?: string[],
  persona?: string
): string {
  const jdCoreText = Array.isArray(jdCore) ? jdCore.join(' ') : jdCore || '';
  const companyValuesText = companyValues ? companyValues.join(', ') : '';
  
  return `You are an interview coach helping a candidate improve their answer. 

Question: ${question}
Current Answer: ${currentAnswer}
Targeted Improvements: ${targetedDimensions.join(', ')}
Job Requirements: ${jdCoreText}
Company Values: ${companyValuesText}
Interviewer Type: ${persona}

Improve the answer by addressing the targeted dimensions while maintaining authenticity. Focus on:
- Adding specific metrics and numbers where appropriate
- Clarifying personal role and decision-making
- Emphasizing business impact and results
- Improving clarity and structure

Return only the improved answer (200-300 words max):`;
}