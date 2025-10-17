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
    
    // Step 1: Multi-source web research with prioritization
    // Search 1: Company website (official source - highest priority)
    const websiteSearch = await searchWeb(`${companyName} official website about`, { 
      maxResults: 2,
      searchDepth: 'basic' 
    });
    
    // Search 2: Recent leadership changes (last 6 months)
    const leadershipSearch = await searchWeb(`${companyName} CEO executive leadership team 2024 2025`, { 
      maxResults: 3,
      searchDepth: 'advanced',
      includeAnswer: true,
    });
    
    // Search 3: Company principles, culture, values
    const cultureSearch = await searchWeb(`${companyName} company culture values principles operating system`, { 
      maxResults: 3,
      searchDepth: 'advanced' 
    });
    
    // Search 4: Recent news (last 30 days)
    const newsSearch = await searchWeb(`${companyName} news announcement October 2024`, { 
      maxResults: 3,
      searchDepth: 'advanced' 
    });
    
    // Combine all search results with source weighting
    const allResults = [
      ...(websiteSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'primary', sourceType: 'company_website' })),
      ...(leadershipSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'high', sourceType: 'recent_news' })),
      ...(cultureSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'high', sourceType: 'culture' })),
      ...(newsSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'medium', sourceType: 'news' })),
    ];
    
    const webSearchData = allResults.length > 0
      ? formatSearchResultsForPrompt(allResults)
      : 'Web search unavailable - using AI knowledge only';
    
    console.log(`🌐 Web search: ${allResults.length} results from ${[
      websiteSearch.success && 'website',
      leadershipSearch.success && 'leadership',
      cultureSearch.success && 'culture',
      newsSearch.success && 'news'
    ].filter(Boolean).join(', ')}`);
    
    // Step 2: Execute company intelligence prompt with weighted web search results
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

