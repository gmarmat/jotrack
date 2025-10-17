import { NextRequest, NextResponse } from 'next/server';
import { executePrompt } from '@/lib/analysis/promptExecutor';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { notes } = body;

    if (!notes || notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      );
    }

    console.log(`📝 Starting notes summarization for job ${jobId}...`);
    console.log(`📏 Original notes length: ${notes.length} characters`);

    // Execute notes summarization prompt
    const result = await executePrompt({
      promptName: 'notes-summary',
      promptVersion: 'v1',
      variables: {
        notes: notes.trim(),
      },
      jobId,
      sourceType: 'notes',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to summarize notes');
    }

    // Extract summary from AI response
    const aiResponse = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
    const summarizedNotes = aiResponse.summary || aiResponse.summarizedNotes || notes;
    const keyInsights = aiResponse.keyInsights || [];
    const interviewKeywords = aiResponse.interviewKeywords || [];

    console.log(`✅ Notes summarization complete: ${result.tokensUsed} tokens, $${result.cost?.toFixed(4)}`);
    console.log(`📏 Original: ${notes.length} chars → Summarized: ${summarizedNotes.length} chars (${Math.round((1 - summarizedNotes.length / notes.length) * 100)}% reduction)`);
    console.log(`🔑 Keywords extracted:`, interviewKeywords);

    return NextResponse.json({
      success: true,
      summarizedNotes,
      keyInsights,
      interviewKeywords,
      metadata: {
        originalLength: notes.length,
        summarizedLength: summarizedNotes.length,
        reductionPercent: Math.round((1 - summarizedNotes.length / notes.length) * 100),
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    });
  } catch (error: any) {
    console.error('Notes summarization failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize notes' },
      { status: 500 }
    );
  }
}

