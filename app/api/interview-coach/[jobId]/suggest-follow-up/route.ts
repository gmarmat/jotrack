import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import { callAiProvider } from '@/lib/coach/aiProvider';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

// Helper: Generate smart placeholder based on question type
function generatePlaceholder(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('metric') || q.includes('result') || q.includes('improve')) {
    return "e.g., 'Reduced deployment time by 60%, cut bug rate by 40%, increased velocity by 25%'";
  }
  
  if (q.includes('who') || q.includes('stakeholder') || q.includes('involve')) {
    return "e.g., 'Product Manager Sarah Chen, UX Designer Mike Park, and 3 platform engineers'";
  }
  
  if (q.includes('obstacle') || q.includes('challenge') || q.includes('difficult')) {
    return "e.g., 'Tight deadline (2 weeks), legacy codebase, team unfamiliar with microservices'";
  }
  
  if (q.includes('timeline') || q.includes('when') || q.includes('how long')) {
    return "e.g., 'Kicked off Q3 2024, MVP in 6 weeks, full rollout by Q4'";
  }
  
  if (q.includes('technical') || q.includes('technology') || q.includes('how did')) {
    return "e.g., 'Migrated to microservices using Docker, Kubernetes, deployed on AWS Lambda'";
  }
  
  return "e.g., 'Be specific with names, numbers, and concrete details (20-50 words)'";
}

/**
 * POST /api/interview-coach/[jobId]/suggest-follow-up
 * Generates AI suggestion + immediate impact test in ONE call (token optimized)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.jobId;
    const body = await request.json();
    const { questionId, followUpQuestion, followUpIndex } = body;
    
    if (!questionId || !followUpQuestion) {
      return NextResponse.json(
        { success: false, error: 'Missing questionId or followUpQuestion' },
        { status: 400 }
      );
    }

    console.log(`🔍 Generating AI suggestion for follow-up: "${followUpQuestion}"`);

    // Load existing answer context
    const coachState = sqlite.prepare(`
      SELECT interview_coach_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId) as any;

    if (!coachState) {
      return NextResponse.json(
        { success: false, error: 'No interview coach state found' },
        { status: 404 }
      );
    }

    const interviewCoachData = JSON.parse(coachState.interview_coach_json || '{}');
    const questionData = interviewCoachData.answers?.[questionId];

    if (!questionData) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const originalAnswer = questionData.mainStory || '';
    const currentScore = questionData.scores?.[questionData.scores.length - 1]?.overall || 0;

    // Step 1: Generate realistic answer suggestion
    const aiResult = await callAiProvider(
      'suggest-follow-up',
      {
        originalAnswer,
        followUpQuestion,
        jdContext: '' // Can add JD context if needed
      },
      false,
      'v1'
    );

    // Parse AI response
    let suggestedAnswer = '';
    if (typeof aiResult.content === 'string') {
      // Strip markdown code blocks if present
      suggestedAnswer = aiResult.content
        .replace(/^```(?:json|text)?\s*/gm, '')
        .replace(/```\s*$/gm, '')
        .trim();
    } else {
      suggestedAnswer = 'Unable to generate suggestion';
    }

    // Step 2: Immediately test impact (lightweight)
    // Build hypothetical combined answer
    const hypotheticalAnswer = `${originalAnswer}\n\n${followUpQuestion}\n${suggestedAnswer}`;
    
    let impact = 0;
    let newScore = currentScore;
    let explanation = 'AI generated answer';
    
    try {
      // Quick impact test using existing scoring capability
      const impactResult = await callAiProvider(
        'answer-scoring',
        {
          answerText: hypotheticalAnswer,
          question: questionId,
          jdContext: '',
          writingStyleProfile: '{}'
        },
        false,
        'v1'
      );

      // Parse impact
      if (impactResult.content) {
        let scoreData;
        if (typeof impactResult.content === 'string') {
          const cleaned = impactResult.content
            .replace(/^```(?:json|text)?\s*/gm, '')
            .replace(/```\s*$/gm, '')
            .trim();
          scoreData = JSON.parse(cleaned);
        } else {
          scoreData = impactResult.content;
        }
        
        newScore = scoreData.score || scoreData.overall || currentScore;
        impact = newScore - currentScore;
        explanation = scoreData.feedback?.[0] || scoreData.reasoning || 'Adds valuable detail';
      }
    } catch (error) {
      console.warn('⚠️ Impact test failed, continuing with answer only:', error);
      // Continue without impact - not critical for UX
    }

    console.log(`✅ Generated AI suggestion + impact: ${impact > 0 ? '+' : ''}${impact}`);

    return NextResponse.json({
      success: true,
      answer: suggestedAnswer,
      impact,
      newScore,
      explanation,
      placeholder: generatePlaceholder(followUpQuestion),
      metadata: {
        tokensUsed: (aiResult.tokensUsed || 0),
        cost: (aiResult.cost || 0)
      }
    });

  } catch (error: any) {
    console.error('❌ Error generating AI suggestion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
