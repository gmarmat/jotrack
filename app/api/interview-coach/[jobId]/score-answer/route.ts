import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
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
    const { questionId, answerText, iteration = 1, testOnly = false } = body;
    
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
    
    // Score answer with AI
    const aiResult = await callAiProvider('answer-scoring', {
      answerText,
      question: questionId, // Pass question text for context
      jdContext,
      writingStyleProfile: writingStyle ? JSON.stringify(writingStyle) : '{}',
      interviewerProfile: interviewerProfile || null  // Pass interviewer profile if available
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
    
    console.log('✅ Answer scored:', {
      overall: scoreData.overall,
      category: scoreData.scoreCategory,
      followUps: scoreData.followUpQuestions?.length || 0,
      testOnly
    });
    
    // If testOnly mode, return score without saving
    if (testOnly) {
      return NextResponse.json({
        success: true,
        score: scoreData,
        iteration,
        testOnly: true,
        metadata: {
          tokensUsed: aiResult.tokensUsed || 0,
          cost: aiResult.cost || 0
        }
      });
    }
    
    // Save to coach_state.interview_coach_json (APPEND, don't replace!)
    const now = Math.floor(Date.now() / 1000);
    
    // Get current interview coach data
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
      { error: `Scoring failed: ${error.message}` },
      { status: 500 }
    );
  }
}

