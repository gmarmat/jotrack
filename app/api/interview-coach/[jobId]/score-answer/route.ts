import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { generateWeaknessFramings, enhanceFeedbackWithFraming } from '@/lib/interview/redFlagFraming';
import { analyzeCareerTrajectory } from '@/lib/interview/signalExtraction';

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
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.jobId;
    const body = await request.json();
    const { questionId, answerText, iteration = 1, testOnly = false, followUpQA } = body;
    
    if (!questionId || !answerText) {
      return NextResponse.json(
        { error: 'questionId and answerText required' },
        { status: 400 }
      );
    }
    
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
      return NextResponse.json({
        success: true,
        score: scoreData,
        impactExplanation,
        iteration,
        testOnly: true,
        metadata: {
          tokensUsed: aiResult.tokensUsed || 0,
          cost: aiResult.cost || 0
        }
      });
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
    
    return NextResponse.json({
      success: true,
      score: scoreData,
      impactExplanation,
      iteration,
      savedAt: now,
      metadata: {
        tokensUsed: aiResult.tokensUsed || 0,
        cost: aiResult.cost || 0
      }
    });
  } catch (error: any) {
    console.error('❌ Answer scoring failed:', error);
    return NextResponse.json(
      { error: `Scoring failed: ${error.message}\n\nTip: Check Settings → AI Configuration → Select preferred model and test` },
      { status: 500 }
    );
  }
}

