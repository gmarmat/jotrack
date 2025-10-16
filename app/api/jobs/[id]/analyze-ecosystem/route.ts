import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePrompt, getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';
import { 
  getCachedEcosystemData, 
  saveEcosystemToCache, 
  calculateContextFingerprint 
} from '@/db/companyEcosystemCacheRepository';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * POST /api/jobs/[id]/analyze-ecosystem
 * Generates company ecosystem matrix using JD variant + company intelligence (if available)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`🌐 Starting ecosystem analysis for job ${jobId}...`);
    
    // Fetch job
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get JD variant
    const { jdVariant } = await getJobAnalysisVariants(jobId);
    
    // Extract company name and industry
    const companyName = jdVariant.company || job.company;
    const industry = jdVariant.industry || null; // TODO: Extract from JD variant
    
    // Check for force refresh flag (manual refresh button)
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Calculate context fingerprint
    const contextFingerprint = calculateContextFingerprint(
      industry,
      job.title,
      undefined // TODO: Extract seniority level
    );
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedEcosystemData(companyName, industry);
      
      if (cached) {
        console.log(`💰 Cache HIT! Saved ~$0.15 for ${companyName}`);
        
        const cacheAge = Math.floor(Date.now() / 1000) - cached.createdAt;
        const cacheAgeDays = Math.floor(cacheAge / 86400);
        const cacheAgeHours = Math.floor((cacheAge % 86400) / 3600);
        
        return NextResponse.json({
          success: true,
          analysis: JSON.parse(cached.researchData),
          metadata: {
            tokensUsed: 0, // Cache hit = 0 tokens used
            cost: '$0.0000', // FREE!
            promptVersion: 'v1',
            analyzedAt: cached.createdAt * 1000, // Convert to ms
            cached: true,
            cacheAge: `${cacheAgeDays}d ${cacheAgeHours}h`,
            cacheExpiresIn: Math.floor((cached.expiresAt - Math.floor(Date.now() / 1000)) / 86400) + ' days',
          },
        });
      }
    }
    
    console.log(`🔬 Cache MISS - Performing research for ${companyName}...`);
    
    // TODO: Fetch existing company intelligence if available
    const companyIntel = null; // Will be populated from company_intel table later
    
    // Execute ecosystem prompt (EXPENSIVE!)
    const result = await executePrompt({
      promptName: 'companyEcosystem',
      promptVersion: 'v1',
      variables: {
        jdVariant: JSON.stringify(jdVariant, null, 2),
        companyName,
        companyIntel: companyIntel ? JSON.stringify(companyIntel, null, 2) : 'null',
      },
      jobId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Ecosystem analysis complete: ${result.tokensUsed} tokens, $${result.cost?.toFixed(4)}`);
    
    // Save to cache for 7 days
    await saveEcosystemToCache({
      companyName,
      industry,
      researchData: result.data,
      contextFingerprint,
      companyCount: result.data?.companies?.length || 10,
      avgConfidence: 'medium', // TODO: Calculate from company data
      sources: result.data?.sources || [],
      tokensUsed: result.tokensUsed,
      costUsd: result.cost,
      webSearchesUsed: 0, // TODO: Track web searches
    });
    
    return NextResponse.json({
      success: true,
      analysis: result.data,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: `$${result.cost?.toFixed(4)}`,
        promptVersion: 'v1',
        analyzedAt: Date.now(),
        cached: false,
        cacheAge: 'Just now',
        cacheExpiresIn: '7 days',
      },
    });
  } catch (error: any) {
    console.error('❌ POST /analyze-ecosystem error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

