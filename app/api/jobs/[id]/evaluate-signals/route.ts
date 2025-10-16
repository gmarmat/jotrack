import { NextRequest, NextResponse } from 'next/server';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { ATS_STANDARD_SIGNALS } from '@/lib/matchSignals';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    
    console.log(`🎯 Starting signal evaluation for job ${jobId}...`);
    
    // Get resume and JD variants
    const { resumeVariant, jdVariant } = await getJobAnalysisVariants(jobId);
    
    if (!resumeVariant || !jdVariant) {
      return NextResponse.json(
        { error: 'No JD or Resume variants found. Click "Refresh Data" first.' },
        { status: 400 }
      );
    }
    
    // TODO: Replace this with real AI call to evaluate signals
    // For now, generate mock evaluations from ATS signals
    const evaluations = ATS_STANDARD_SIGNALS.slice(0, 30).map((signal, idx) => {
      const score = 0.6 + (Math.random() * 0.3); // 60-90%
      
      return {
        signalId: signal.id,
        signalName: signal.name,
        signalCategory: signal.category,
        signalType: 'ats',
        jdScore: score + (Math.random() * 0.1),
        resumeScore: score,
        overallScore: score,
        jdEvidence: `Job description emphasizes ${signal.name.toLowerCase()}.`,
        resumeEvidence: `Resume demonstrates ${signal.name.toLowerCase()} through experience.`,
        aiReasoning: `Strong alignment for ${signal.name}.`,
        trend: idx % 3 === 0 ? 'up' : idx % 3 === 1 ? 'stable' : 'down',
        change: idx % 3 === 0 ? 0.05 : idx % 3 === 1 ? 0 : -0.03,
      };
    });
    
    console.log(`✅ Generated ${evaluations.length} signal evaluations (mock data)`);
    
    return NextResponse.json({
      success: true,
      jobId,
      evaluations,
      metadata: {
        signalCount: evaluations.length,
        note: 'Mock data - AI integration coming soon',
        analyzedAt: Date.now(),
      },
      message: `Evaluated ${evaluations.length} signals`
    });

  } catch (error: any) {
    console.error('❌ Signal evaluation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate signals' },
      { status: 500 }
    );
  }
}

// GET endpoint removed - use POST to trigger analysis

