import { NextRequest, NextResponse } from 'next/server';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { sqlite } from '@/db/client';

/**
 * POST - Extract structured data from pasted LinkedIn text
 * This is Step 1: Extract clean data (NO summarization)
 * Step 2 (AI analysis) happens via /api/ai/people-analysis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { personId, pastedText } = await request.json();
    
    if (!personId || !pastedText) {
      return NextResponse.json(
        { error: 'personId and pastedText required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Extracting profile data for person ${personId}...`);
    console.log(`   Pasted text length: ${pastedText.length} chars`);

    // Call AI for extraction (NO summarization, verbatim preservation)
    const aiResult = await callAiProvider('people-extract', {
      pastedText
    }, false, 'v1');

    const extracted = typeof aiResult.result === 'string' 
      ? JSON.parse(aiResult.result) 
      : aiResult.result;

    console.log('✅ Extraction complete:', {
      name: extracted.name,
      currentTitle: extracted.currentTitle,
      experiences: extracted.workExperiences?.length || 0,
      education: extracted.education?.length || 0,
      skills: extracted.skills?.length || 0,
      aboutLength: extracted.aboutMe?.length || 0
    });

    // Save to DB (summary = extracted JSON, rawText = original paste)
    const now = Math.floor(Date.now() / 1000);
    sqlite.prepare(`
      UPDATE people_profiles 
      SET summary = ?, optimized_at = ?, is_optimized = 1
      WHERE id = ?
    `).run(JSON.stringify(extracted), now, personId);

    console.log(`💾 Saved optimized profile to DB for person ${personId}`);

    return NextResponse.json({
      success: true,
      extracted,
      optimizedAt: now
    });
  } catch (error: any) {
    console.error('❌ Extraction error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: `Extraction failed: ${error.message}` },
      { status: 500 }
    );
  }
}

