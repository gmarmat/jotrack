import { NextRequest, NextResponse } from 'next/server';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';

export const dynamic = 'force-dynamic';

/**
 * POST /api/interview-coach/[jobId]/suggest-answer
 * Generates a believable, contextual answer to help user win
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { question, currentAnswer } = await request.json();
    
    if (!question) {
      return NextResponse.json(
        { error: 'question required' },
        { status: 400 }
      );
    }
    
    console.log(`💡 Generating suggested answer for: ${question.substring(0, 50)}...`);
    
    // Get job context for believability
    const { jdVariant, resumeVariant } = await getJobAnalysisVariants(params.jobId);
    
    const suggestedAnswer = await callAiProvider('suggest-answer', {
      question,
      currentAnswer: currentAnswer || '',
      jdContext: (jdVariant.aiOptimized || jdVariant.raw || '').substring(0, 1000),
      resumeContext: (resumeVariant.aiOptimized || resumeVariant.raw || '').substring(0, 1000),
      companyName: 'the company',
      roleTitle: 'the role'
    });
    
    return NextResponse.json({
      suggestedAnswer: suggestedAnswer.result,
      note: '💡 This is an inspirational example. Adapt it to your voice - authenticity matters!'
    });
  } catch (error: any) {
    console.error('❌ Failed to suggest answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
