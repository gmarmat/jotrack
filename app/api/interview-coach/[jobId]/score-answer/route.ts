import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { generateWeaknessFramings, enhanceFeedbackWithFraming } from '@/lib/interview/redFlagFraming';
import { analyzeCareerTrajectory } from '@/lib/interview/signalExtraction';
import { 
  scoreAnswer, 
  type ScoringContext, 
  summarizeImprovements 
} from '@/src/interview-coach/scoring';
import { 
  JobIdParamSchema, 
  ScoreAnswerRequestSchema, 
  ScoreAnswerResponseSchema,
  validateRequest, 
  validateResponse, 
  mapErrorToResponse,
  normalizeCategory
} from '@/src/interview-coach/http/schema';
import { logCoachEvent, logCoachError, extractCoachMetrics } from '@/src/interview-coach/telemetry';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

/**
 * Generate human-readable explanation for score changes
 */
function generateScoringExplanation(data: {
  oldScore: number;
  newScore: number;
  delta: number;
  feedback?: any;
}): string {
  const { oldScore, newScore, delta, feedback } = data;
  
  let explanation = '';
  
  if (delta === 0) {
    explanation = 'Score unchanged. Your answers confirmed your initial narrative.';
  } else if (delta > 0) {
    explanation = `+${delta}pts! Discovery answers strengthened your narrative with more context.`;
  } else {
    explanation = `${delta}pts. Discovery revealed gaps (scope/quantification). Refine your example.`;
  }
  
  return explanation;
}


/**
 * POST /api/interview-coach/[jobId]/score-answer
 * Scores user's draft answer and generates follow-up questions
 * Preserves all iterations in coach_state.interview_coach_json
 * 
 * V2: Supports enhanced scoring with subscores, flags, confidence, and deltas
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

    // Parse request body with safe defaults
    const raw = await request.json().catch(() => ({}));
    const isV2 = process.env.INTERVIEW_V2 === '1';

    const body = {
      // legacy aliases
      questionId: raw.questionId ?? raw.question ?? 'custom',
      answer: raw.answer ?? raw.answerText ?? '',
      persona: raw.persona ?? 'hiring-manager',
      jdCore: Array.isArray(raw.jdCore) ? raw.jdCore : (raw.jdCore ? [raw.jdCore] : []),
      companyValues: Array.isArray(raw.companyValues) ? raw.companyValues : (raw.companyValues ? [raw.companyValues] : []),
      userProfile: raw.userProfile ?? {},
      matchMatrix: raw.matchMatrix ?? null,
      evidenceQuality: raw.evidenceQuality ?? null,
      previous: raw.previous ?? null,
    };

    if (!body.answer || typeof body.answer !== 'string' || !body.answer.trim()) {
      return NextResponse.json({ success: false, error: 'Missing answer' }, { status: 400 });
    }

    const persona = body.persona as 'recruiter' | 'hiring-manager' | 'peer';
    
    // Extract fields from body
    const { 
      answer, 
      jdCore, 
      companyValues, 
      userProfile, 
      matchMatrix, 
      evidenceQuality,
      previous,
      questionId, 
      answerText, 
      iteration = 1, 
      testOnly = false, 
      followUpQA 
    } = body;
    
    // Use V2 or legacy answer text
    const answerTextToUse = isV2 ? answer : answerText;
    const questionIdToUse = isV2 ? 'v2-answer' : questionId;
    
    console.log(`📊 Scoring answer for question ${questionId} (iteration ${iteration})...`);
    
    // Get writing style from coach_state.data_json (REUSE from Application Coach!)
    const coachStateRow = sqlite.prepare(`
      SELECT data_json, interview_coach_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId);
    
    let writingStyle = null;
    if (coachStateRow) {
      try {
        const appCoachData = JSON.parse(coachStateRow.data_json);
        writingStyle = appCoachData.writingStyleProfile;
      } catch (error) {
        console.warn('No writing style found:', error);
      }
    }
    
    // Get JD context from bundle (REUSE from P2 bundle system!)
    let jdContext = '';
    try {
      const { jdVariant } = await getJobAnalysisVariants(jobId);
      jdContext = (jdVariant.aiOptimized || jdVariant.raw || '').substring(0, 1000);
    } catch (error) {
      console.warn('No JD found:', error);
    }
    
    // Load interviewer profile for persona-specific scoring
    let interviewerProfile = null;
    try {
      const peopleAnalysis = sqlite.prepare(`
        SELECT result_json FROM people_analyses WHERE job_id = ? LIMIT 1
      `).get(jobId) as any;
      
      if (peopleAnalysis && peopleAnalysis.result_json) {
        const peopleProfiles = JSON.parse(peopleAnalysis.result_json);
        
        // Try to find matching interviewer profile
        // For now, we'll use the first profile as a fallback
        // In the future, we can match by question type (recruiter/HM/peer)
        if (peopleProfiles?.profiles && peopleProfiles.profiles.length > 0) {
          interviewerProfile = peopleProfiles.profiles[0];
          console.log(`✅ Using interviewer profile: ${interviewerProfile.name} (${interviewerProfile.role})`);
        }
      }
    } catch (error) {
      console.warn('⚠️ No interviewer profile found (will use generic scoring):', error);
      // Continue without interviewer profile - not a blocker
    }
    
    console.log('📝 Scoring with context:', {
      hasWritingStyle: !!writingStyle,
      hasJdContext: !!jdContext,
      hasInterviewerProfile: !!interviewerProfile,
      answerLength: answerText.length
    });
    
    // If this is a discovery question impact test, combine answers for context
    let enhancedAnswer = answerText;
    if (testOnly && followUpQA && followUpQA.question && followUpQA.answer) {
      console.log(`📝 Adding discovery context to answer for impact test...`);
      enhancedAnswer = `${answerText}\n\nAdditional context from follow-up:\nQ: ${followUpQA.question}\nA: ${followUpQA.answer}`;
      console.log(`📊 Enhanced answer length: ${enhancedAnswer.length}`);
    }
    
    // Score answer with AI
    const aiResult = await callAiProvider('answer-scoring', {
      answerText: enhancedAnswer,
      question: questionId,
      jdContext,
      writingStyleProfile: writingStyle ? JSON.stringify(writingStyle) : '{}',
      interviewerProfileName: interviewerProfile?.name || '',
      interviewerProfileRole: interviewerProfile?.role || '',
      interviewerProfileCommunicationStyle: interviewerProfile?.communicationStyle || '',
      interviewerProfileKeyPriorities: interviewerProfile?.keyPriorities || '',
      interviewerProfileRedFlags: interviewerProfile?.redFlags || ''
    }, false, 'v1');
    
    // Parse result
    let scoreData;
    if (typeof aiResult.result === 'string') {
      const cleaned = aiResult.result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      scoreData = JSON.parse(cleaned);
    } else {
      scoreData = aiResult.result;
    }
    
    // Comprehensive defensive check
    if (!scoreData) {
      console.error('❌ scoreData is null/undefined:', { aiResult });
      throw new Error('AI failed to return scoring data');
    }
    
    // Ensure feedback object exists to prevent undefined errors
    scoreData.feedback = scoreData.feedback || {};
    
    // Ensure score arrays exist
    if (!scoreData.iterations) scoreData.iterations = [];
    if (!scoreData.scores) scoreData.scores = [];
    if (!scoreData.followUpQuestions) scoreData.followUpQuestions = [];
    
    console.log('✅ Answer scored:', {
      overall: scoreData.overall,
      category: scoreData.scoreCategory,
      followUps: scoreData.followUpQuestions?.length || 0,
      testOnly,
      hasIterations: Array.isArray(scoreData.iterations),
      hasScores: Array.isArray(scoreData.scores)
    });
    
    // V2: Enhanced scoring with subscores, flags, confidence
    let v2Result = null;
    if (isV2Request && process.env.INTERVIEW_V2 === '1') {
      console.log('🚀 V2 scoring enabled - computing enhanced metrics...');
      
      // Build ScoringContext for V2 scoring
      const scoringContext: ScoringContext = {
        answer: answerTextToUse,
        persona: persona as 'recruiter' | 'hm' | 'peer',
        jdCore,
        companyValues,
        userProfile,
        matchMatrix,
        styleProfileId: null // Could be extracted from coach state if needed
      };
      
      // Get V2 scoring result
      const v2Scoring = scoreAnswer(scoringContext);
      
      // Compute confidence metrics
      const signalsCoverage = deriveSignalsCoverage(scoringContext);
      const evidenceQualityValue = evidenceQuality ?? 0.6; // Safe default
      const { confidence, reasons } = computeConfidence({
        signalsCoverage,
        evidenceQuality: evidenceQualityValue
      });
      
      // Compute deltas if previous scores provided
      let deltas = null;
      if (previous) {
        deltas = {
          overall: v2Scoring.overall - (previous.overall || 0),
          ...Object.fromEntries(
            Object.entries(v2Scoring.subscores).map(([key, value]) => [
              key, 
              value - (previous.subscores?.[key] || 0)
            ])
          )
        };
      }
      
      // Clamp all scores to valid ranges
      const clampScore = (score: number) => Math.max(0, Math.min(100, score));
      const clampConfidence = (conf: number) => Math.max(0, Math.min(1, conf));
      
      v2Result = {
        score: clampScore(v2Scoring.overall),
        subscores: Object.fromEntries(
          Object.entries(v2Scoring.subscores).map(([key, value]) => [key, clampScore(value)])
        ),
        flags: v2Scoring.flags,
        confidence: clampConfidence(confidence),
        confidenceReasons: reasons,
        deltas,
        version: "v2"
      };
      
      console.log('✅ V2 scoring complete:', {
        overall: v2Result.score,
        subscores: Object.keys(v2Result.subscores).length,
        flags: v2Result.flags.length,
        confidence: v2Result.confidence,
        hasDeltas: !!deltas
      });
    }
    
    // V2.0: Generate weakness framings for strategic guidance
    let framings: any[] = [];
    try {
      const { resumeVariant } = await getJobAnalysisVariants(jobId);
      const careerTrajectory = analyzeCareerTrajectory(resumeVariant.aiOptimized || resumeVariant.raw || '');
      
      // Load Match Score for skills gap framings
      const matchScoreRow = sqlite.prepare(`
        SELECT match_score_data FROM jobs WHERE id = ? LIMIT 1
      `).get(jobId) as any;
      
      const matchScoreData = matchScoreRow?.match_score_data 
        ? JSON.parse(matchScoreRow.match_score_data) 
        : null;
      
      // Load web warnings from interview_questions_cache
      const webIntelRow = sqlite.prepare(`
        SELECT web_intelligence_json FROM interview_questions_cache 
        WHERE company_name = (SELECT LOWER(company) FROM jobs WHERE id = ? LIMIT 1)
        LIMIT 1
      `).get(jobId) as any;
      
      const webWarnings = webIntelRow?.web_intelligence_json
        ? JSON.parse(webIntelRow.web_intelligence_json).warnings || []
        : [];
      
      // Only call if we have valid inputs
      if (resumeVariant && careerTrajectory) {
        framings = generateWeaknessFramings(
          resumeVariant.aiOptimized || resumeVariant.raw || '',
          matchScoreData,
          careerTrajectory,
          webWarnings
        );
      }
      
      // Enhance feedback with relevant framings
      if (scoreData.feedback?.summary) {
        scoreData.feedback.framings = framings.filter((f: any) => 
          scoreData.feedback.summary.toLowerCase().includes(f.weakness.toLowerCase()) ||
          f.dontSay.some((dont: string) => scoreData.feedback.summary.toLowerCase().includes(dont.toLowerCase()))
        );
      } else {
        // Initialize feedback object if it doesn't exist
        if (!scoreData.feedback) {
          scoreData.feedback = {};
        }
        scoreData.feedback.framings = scoreData.feedback.framings || [];
      }
      
      console.log(`✅ Generated ${framings.length} weakness framings, ${scoreData.feedback?.framings?.length || 0} relevant to this answer`);
    } catch (error) {
      console.warn('⚠️ Failed to generate framings (non-blocking):', error);
      // Ensure feedback exists even if framing generation fails
      if (!scoreData.feedback) {
        scoreData.feedback = {};
      }
      scoreData.feedback.framings = [];
    }
    
    // Save to coach_state.interview_coach_json (APPEND, don't replace!)
    const now = Math.floor(Date.now() / 1000);
    
    // Get current interview coach data (needed for BOTH testOnly and regular modes)
    let interviewCoachData: any = {};
    if (coachStateRow?.interview_coach_json) {
      try {
        interviewCoachData = JSON.parse(coachStateRow.interview_coach_json);
      } catch (error) {
        console.warn('Creating new interview coach data');
      }
    }
    
    // Initialize structure if needed
    interviewCoachData.answers = interviewCoachData.answers || {};
    interviewCoachData.answers[questionId] = interviewCoachData.answers[questionId] || {
      question: questionId,
      iterations: [],
      scores: [],
      followUpAnswers: [],
      status: 'draft'
    };
    
    // Calculate impact explanation for score changes (before modifying scores array)
    let impactExplanation = '';
    const previousScores = interviewCoachData.answers[questionId]?.scores;
    if (previousScores && previousScores.length > 0) {
      const previousScore = previousScores[previousScores.length - 1]; // Last existing score
      const newScore = scoreData.overall;
      const delta = newScore - previousScore.overall;
      impactExplanation = generateScoringExplanation({
        oldScore: previousScore.overall,
        newScore,
        delta,
        feedback: scoreData.feedback
      });
    }
    
    // If testOnly mode, return with impact explanation
    if (testOnly) {
      const response: any = {
        success: true,
        score: scoreData,
        impactExplanation,
        iteration,
        testOnly: true,
        metadata: {
          tokensUsed: aiResult.tokensUsed || 0,
          cost: aiResult.cost || 0
        }
      };
      
      // V2: Always ensure V2 fields are present
      const v2Fields = {
        score: scoreData.overall,
        subscores: scoreData.subscores || {},
        flags: scoreData.flags || [],
        confidence: scoreData.confidence || 0.5,
        version: 'v2'
      };
      
      // Generate improvement summary with guard
      const improvements = summarizeImprovements?.(scoreData?.subscores, scoreData?.flags) ?? { 
        summary: '', 
        cta: '', 
        targeted: [] 
      };
      
      // Normalize category
      const category = normalizeCategory?.(scoreData?.category) ?? 'needs-improvement';
      
      // Merge V2 fields with response
      Object.assign(response, v2Fields);
      Object.assign(response, {
        improvementSummary: improvements.summary,
        improvementCTA: improvements.cta,
        targetedDimensions: improvements.targeted,
        scoreCategory: category
      });
      
      // Add any additional V2 enhancements if available
      if (v2Result) {
        Object.assign(response, v2Result);
      }
      
      return NextResponse.json(response);
    }
    
    // Defensive check before push
    if (!Array.isArray(interviewCoachData.answers[questionId].iterations)) {
      interviewCoachData.answers[questionId].iterations = [];
    }
    if (!Array.isArray(interviewCoachData.answers[questionId].scores)) {
      interviewCoachData.answers[questionId].scores = [];
    }
    
    // Append iteration (preserve all history!)
    interviewCoachData.answers[questionId].iterations.push({
      text: answerText,
      timestamp: now,
      wordCount: answerText.split(/\s+/).filter(Boolean).length,
      iteration
    });
    
    // Append score (preserve all history!)
    interviewCoachData.answers[questionId].scores.push({
      ...scoreData,
      timestamp: now,
      iteration
    });
    
    // Update status based on score
    if (scoreData.overall >= 75) {
      interviewCoachData.answers[questionId].status = 'ready-for-talk-track';
    } else if (scoreData.overall >= 50) {
      interviewCoachData.answers[questionId].status = 'improving';
    } else {
      interviewCoachData.answers[questionId].status = 'needs-work';
    }
    
    // Save to database
    if (!coachStateRow) {
      // Create new coach_state if doesn't exist
      sqlite.prepare(`
        INSERT INTO coach_state (job_id, data_json, interview_coach_json, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(jobId, '{}', JSON.stringify(interviewCoachData), now);
    } else {
      // Update existing
      sqlite.prepare(`
        UPDATE coach_state 
        SET interview_coach_json = ?, updated_at = ?
        WHERE job_id = ?
      `).run(JSON.stringify(interviewCoachData), now, jobId);
    }
    
    console.log(`💾 Saved score iteration ${iteration} for question ${questionId}`);
    
    const response: any = {
      success: true,
      score: scoreData,
      impactExplanation,
      iteration,
      savedAt: now,
      metadata: {
        tokensUsed: aiResult.tokensUsed || 0,
        cost: aiResult.cost || 0
      }
    };
    
    // V2: Always ensure V2 fields are present
    const v2Fields = {
      score: scoreData.overall,
      subscores: scoreData.subscores || {},
      flags: scoreData.flags || [],
      confidence: scoreData.confidence || 0.5,
      version: 'v2'
    };
    
    // Generate improvement summary with guard
    const improvements = summarizeImprovements?.(scoreData?.subscores, scoreData?.flags) ?? { 
      summary: '', 
      cta: '', 
      targeted: [] 
    };
    
    // Normalize category
    const category = normalizeCategory?.(scoreData?.category) ?? 'needs-improvement';
    
    // Merge V2 fields with response
    Object.assign(response, v2Fields);
    Object.assign(response, {
      improvementSummary: improvements.summary,
      improvementCTA: improvements.cta,
      targetedDimensions: improvements.targeted,
      scoreCategory: category
    });
    
    // Add any additional V2 enhancements if available
    if (v2Result) {
      Object.assign(response, v2Result);
    }
    
    // Validate response schema during development/testing
    const isValidResponse = validateResponse(ScoreAnswerResponseSchema, response);
    if (!isValidResponse) {
      console.warn('⚠️ Response validation failed - returning response anyway');
    }
    
    // Log telemetry event
    const metrics = extractCoachMetrics(response);
    logCoachEvent({
      route: 'score-answer',
      persona: persona || 'unknown',
      durationMs: 0, // Duration would need to be measured from start
      ...metrics,
      metadata: { 
        answer: answer || answerText, 
        questionId: questionIdToUse, 
        iteration, 
        testOnly 
      }
    });
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Answer scoring failed:', error);
    
    // Log error telemetry
    logCoachError('score-answer', persona || 'unknown', error, { 
      questionId: questionIdToUse, 
      iteration, 
      testOnly 
    });
    
    // Map error to standardized format
    const errorResponse = mapErrorToResponse(error);
    
    // Add helpful tip for common AI errors
    if (errorResponse.code === 'AI_ERROR') {
      errorResponse.message += '\n\nTip: Check Settings → AI Configuration → Select preferred model and test';
    }
    
    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}

