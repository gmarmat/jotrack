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
    
    // Search 3: Company principles (official frameworks like FBS, TPS, etc.)
    const principlesSearch = await searchWeb(`${companyName} business system operating principles framework`, { 
      maxResults: 3,
      searchDepth: 'advanced' 
    });
    
    // Search 4: Official culture/values
    const officialCultureSearch = await searchWeb(`${companyName} company culture values mission site:${companyName.toLowerCase().replace(/\s+/g, '')}`, { 
      maxResults: 2,
      searchDepth: 'basic' 
    });
    
    // Search 5: Employee sentiment (positive)
    const positiveReviewsSearch = await searchWeb(`${companyName} employee reviews pros benefits glassdoor reddit 2024`, { 
      maxResults: 5,
      searchDepth: 'advanced' 
    });
    
    // Search 6: Employee sentiment (negative)
    const negativeReviewsSearch = await searchWeb(`${companyName} employee reviews cons complaints glassdoor reddit blind 2024`, { 
      maxResults: 5,
      searchDepth: 'advanced' 
    });
    
    // Combine all search results with source weighting
    const allResults = [
      ...(websiteSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'primary', sourceType: 'company_website' })),
      ...(leadershipSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'high', sourceType: 'recent_news' })),
      ...(principlesSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'primary', sourceType: 'principles' })),
      ...(officialCultureSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'high', sourceType: 'official_culture' })),
      ...(positiveReviewsSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'high', sourceType: 'employee_reviews_positive' })),
      ...(negativeReviewsSearch.results || []).map((r: any) => ({ ...r, sourceWeight: 'high', sourceType: 'employee_reviews_negative' })),
    ];
    
    const webSearchData = allResults.length > 0
      ? formatSearchResultsForPrompt(allResults)
      : 'Web search unavailable - using AI knowledge only';
    
    console.log(`🌐 Web search: ${allResults.length} results from ${[
      websiteSearch.success && 'website',
      leadershipSearch.success && 'leadership',
      principlesSearch.success && 'principles',
      officialCultureSearch.success && 'official culture',
      positiveReviewsSearch.success && 'positive reviews',
      negativeReviewsSearch.success && 'negative reviews'
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
    
    // Map web search results to Source objects (real URLs, not example.com!)
    const sources = allResults.slice(0, 15).map((r: any) => ({
      url: r.url || 'https://unknown',
      title: r.title || r.content?.substring(0, 60) || 'Untitled',
      type: r.sourceType === 'company_website' ? 'official' :
            r.sourceType === 'recent_news' ? 'news' :
            r.sourceType === 'employee_reviews_positive' || r.sourceType === 'employee_reviews_negative' ? 'community' :
            'other' as any,
      dateAccessed: new Date().toISOString(),
      snippet: r.content?.substring(0, 200),
    }));
    
    console.log(`🔗 Extracted ${sources.length} real source URLs from web search`);
    
    // Save to jobs table for persistence (extract 'company' object from response)
    const companyData = result.data?.company || result.data;
    
    // Include sources in saved data for UI display
    const dataToSave = {
      ...companyData,
      sources, // Add real sources
    };
    
    await db.update(jobs)
      .set({
        companyIntelligenceData: JSON.stringify(dataToSave),
        companyIntelligenceAnalyzedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(jobs.id, jobId));
    
    console.log(`💾 Saved company intelligence to database with ${sources.length} sources`);
    
    return NextResponse.json({
      success: true,
      analysis: {
        ...result.data,
        sources, // Include in response
      },
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: `$${result.cost?.toFixed(4)}`,
        promptVersion: 'v1',
        analyzedAt: Date.now(),
        webSearchUsed: true,
        sourcesCount: sources.length,
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

