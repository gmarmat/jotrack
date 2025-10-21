import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';
import { callAiProvider } from '@/lib/coach/aiProvider';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { jobId: string };
}

/**
 * POST /api/interview-coach/[jobId]/extract-core-stories
 * Extracts 2-3 core stories from all generated talk tracks
 * Maps which story to use for which question
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.jobId;
    const body = await request.json();
    const { targetStoryCount = 3 } = body;
    
    console.log(`🎯 Extracting up to ${targetStoryCount} core stories...`);
    
    // Get all talk tracks from coach_state.interview_coach_json
    const coachStateRow = sqlite.prepare(`
      SELECT interview_coach_json FROM coach_state WHERE job_id = ? LIMIT 1
    `).get(jobId);
    
    if (!coachStateRow?.interview_coach_json) {
      return NextResponse.json(
        { error: 'No interview coach data found. Generate talk tracks first.' },
        { status: 404 }
      );
    }
    
    let interviewCoachData: any = {};
    try {
      interviewCoachData = JSON.parse(coachStateRow.interview_coach_json);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid interview coach data' },
        { status: 500 }
      );
    }
    
    // Extract all talk tracks
    const talkTracks: any[] = [];
    if (interviewCoachData.answers) {
      for (const [qId, qData] of Object.entries(interviewCoachData.answers)) {
        const data = qData as any;
        if (data.talkTrack) {
          talkTracks.push({
            questionId: qId,
            question: data.question,
            talkTrack: data.talkTrack
          });
        }
      }
    }
    
    if (talkTracks.length < 3) {
      return NextResponse.json(
        { error: `Need at least 3 talk tracks to extract core stories. You have ${talkTracks.length}.` },
        { status: 400 }
      );
    }
    
    console.log(`📚 Found ${talkTracks.length} talk tracks to analyze`);
    
    // Call AI to extract core stories
    const aiResult = await callAiProvider('core-stories-extraction', {
      talkTracks: JSON.stringify(talkTracks),
      targetStoryCount
    }, false, 'v1');
    
    // Parse result
    let coreStoriesData;
    if (typeof aiResult.result === 'string') {
      const cleaned = aiResult.result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      coreStoriesData = JSON.parse(cleaned);
    } else {
      coreStoriesData = aiResult.result;
    }
    
    console.log('✅ Core stories extracted:', {
      storiesCount: coreStoriesData.coreStories?.length || 0,
      coverage: coreStoriesData.coverageAnalysis?.coveragePercentage || 0
    });
    
    // Save to coach_state.interview_coach_json
    const now = Math.floor(Date.now() / 1000);
    
    interviewCoachData.coreStories = coreStoriesData.coreStories || [];
    interviewCoachData.storyMapping = coreStoriesData.storyMapping || {};
    interviewCoachData.coverageAnalysis = coreStoriesData.coverageAnalysis || {};
    interviewCoachData.memorializationPlan = coreStoriesData.memorializationPlan || {};
    interviewCoachData.recommendedPracticeOrder = coreStoriesData.recommendedPracticeOrder || [];
    interviewCoachData.coreStoriesExtractedAt = now;
    
    // Update progress
    interviewCoachData.progress = interviewCoachData.progress || {};
    interviewCoachData.progress.coreStoriesExtracted = true;
    interviewCoachData.progress.coreStoriesCount = coreStoriesData.coreStories?.length || 0;
    
    // Save to database
    sqlite.prepare(`
      UPDATE coach_state 
      SET interview_coach_json = ?, updated_at = ?
      WHERE job_id = ?
    `).run(JSON.stringify(interviewCoachData), now, jobId);
    
    console.log(`💾 Saved ${coreStoriesData.coreStories?.length || 0} core stories`);
    
    return NextResponse.json({
      success: true,
      coreStories: coreStoriesData.coreStories,
      storyMapping: coreStoriesData.storyMapping,
      coverageAnalysis: coreStoriesData.coverageAnalysis,
      memorializationPlan: coreStoriesData.memorializationPlan,
      recommendedPracticeOrder: coreStoriesData.recommendedPracticeOrder,
      extractedAt: now,
      metadata: {
        tokensUsed: aiResult.tokensUsed || 0,
        cost: aiResult.cost || 0,
        talkTracksAnalyzed: talkTracks.length
      }
    });
  } catch (error: any) {
    console.error('❌ Core stories extraction failed:', error);
    return NextResponse.json(
      { error: `Extraction failed: ${error.message}` },
      { status: 500 }
    );
  }
}

