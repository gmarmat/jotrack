import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePrompt, getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { searchWeb, formatSearchResultsForPrompt } from '@/lib/analysis/tavilySearch';
import { db } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * POST /api/jobs/[id]/analyze-company
 * Generates company intelligence using JD variant + web research
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = paramsSchema.parse(params);
    
    console.log(`🏢 Starting company intelligence analysis for job ${jobId}...`);
    
    // Fetch job
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Get JD variant (don't need resume for company analysis)
    const { jdVariant } = await getJobAnalysisVariants(jobId);
    
    // Extract company name from JD variant or use job.company
    const companyName = jdVariant.company || job.company;
    
    // Step 1: Real-time web search via Tavily
    const searchQuery = `${companyName} company CEO leadership funding culture latest news 2025`;
    const webSearchResults = await searchWeb(searchQuery, { 
      maxResults: 5,
      searchDepth: 'advanced' 
    });
    
    const webSearchData = webSearchResults.success 
      ? formatSearchResultsForPrompt(webSearchResults.results || [])
      : 'Web search unavailable - using AI knowledge only';
    
    console.log(`🌐 Web search: ${webSearchResults.success ? `${webSearchResults.results?.length || 0} results` : 'skipped (no Tavily key)'}`);
    
    // Step 2: Execute company intelligence prompt with web search results
    const result = await executePrompt({
      promptName: 'company',
      promptVersion: 'v1',
      variables: {
        jdVariant: JSON.stringify(jdVariant, null, 2),
        companyName,
        webSearchResults: webSearchData,
      },
      jobId,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Company intelligence complete: ${result.tokensUsed} tokens, $${result.cost?.toFixed(4)}`);
    
    // Save to jobs table for persistence (extract 'company' object from response)
    const companyData = result.data?.company || result.data;
    await db.update(jobs)
      .set({
        companyIntelligenceData: JSON.stringify(companyData),
        companyIntelligenceAnalyzedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(jobs.id, jobId));
    
    console.log(`💾 Saved company intelligence to database:`, companyData?.name || 'unknown');
    
    return NextResponse.json({
      success: true,
      analysis: result.data,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: `$${result.cost?.toFixed(4)}`,
        promptVersion: 'v1',
        analyzedAt: Date.now(),
        webSearchUsed: true,
      },
    });
  } catch (error: any) {
    console.error('❌ POST /analyze-company error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

