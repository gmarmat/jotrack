import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { matchSkills, calculateSkillMatchPercentage, calculateCategoryScores } from '@/lib/analysis/skillMatcher';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * POST /api/jobs/[id]/match-skills-local
 * Match skills locally using FTS5 and regex (NO AI CALL!)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`🔍 Starting LOCAL skill matching for job ${jobId}...`);
    const startTime = Date.now();
    
    // Get JD and Resume variants (no AI call here, just reading from DB)
    const { jdVariant, resumeVariant } = await getJobAnalysisVariants(jobId);
    
    const jdText = jdVariant.raw || jdVariant.aiOptimized || '';
    const resumeText = resumeVariant.raw || resumeVariant.aiOptimized || '';
    
    if (!jdText || !resumeText) {
      return NextResponse.json(
        { error: 'Missing JD or Resume text' },
        { status: 400 }
      );
    }
    
    // === LOCAL SKILL MATCHING (NO AI!) ===
    const skills = matchSkills(jdText, resumeText);
    const matchPercentage = calculateSkillMatchPercentage(skills);
    const categoryScores = calculateCategoryScores(jdText, resumeText);
    
    const elapsedTime = Date.now() - startTime;
    console.log(`✅ LOCAL skill matching complete in ${elapsedTime}ms (0 tokens, $0.00)`);
    
    // Save to jobs table for persistence
    const dataToSave = {
      skills: skills.slice(0, 50), // Top 50 skills
      matchPercentage,
      categoryScores,
      method: 'local_fts5', // Mark as local processing
    };
    
    const now = Math.floor(Date.now() / 1000);
    
    // Save to a new field or reuse matchScoreData
    await db.update(jobs)
      .set({
        // Store in matchScoreData for now (can create dedicated field later)
        matchScoreData: JSON.stringify(dataToSave),
        matchScoreAnalyzedAt: now,
      })
      .where(eq(jobs.id, jobId));
    
    console.log(`💾 Saved skill match results (${skills.length} skills found)`);
    
    return NextResponse.json({
      success: true,
      skills: skills.slice(0, 50), // Return top 50 for UI
      matchPercentage,
      categoryScores,
      metadata: {
        method: 'local_fts5',
        tokensUsed: 0, // NO AI CALL!
        cost: '$0.00', // FREE!
        elapsedTime: `${elapsedTime}ms`,
        analyzedAt: Date.now(),
        totalSkills: skills.length,
        matchedSkills: skills.filter(s => s.resumeCount > 0).length,
      },
    });
  } catch (error: any) {
    console.error('❌ POST /match-skills-local error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

