import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePrompt, getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { searchWeb, formatSearchResultsForPrompt } from '@/lib/analysis/tavilySearch';
import { db, sqlite } from '@/db/client';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

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
    const industry = jdVariant.industry || 'General';
    
    // === CACHING LAYER (30-day TTL) ===
    const now = Math.floor(Date.now() / 1000);
    const cacheQuery = sqlite.prepare(`
      SELECT * FROM company_intelligence_cache 
      WHERE company_name = ? 
      AND expires_at > ?
      LIMIT 1
    `).get(companyName, now);
    
    if (cacheQuery) {
      console.log(`💾 Cache HIT for ${companyName} (expires in ${Math.floor((cacheQuery.expires_at - now) / 86400)} days)`);
      
      const cachedData = JSON.parse(cacheQuery.intelligence_data);
      const cacheAge = now - cacheQuery.created_at;
      
      // Update job record
      await db.update(jobs)
        .set({
          companyIntelligenceData: cacheQuery.intelligence_data,
          companyIntelligenceAnalyzedAt: cacheQuery.created_at,
        })
        .where(eq(jobs.id, jobId));
      
      return NextResponse.json({
        success: true,
        analysis: cachedData,
        metadata: {
          cached: true,
          cacheAge,
          cachedAt: cacheQuery.created_at,
          expiresAt: cacheQuery.expires_at,
          tokensUsed: cacheQuery.tokens_used || 0,
          cost: `$${cacheQuery.cost_usd?.toFixed(4) || '0.0000'}`,
          promptVersion: 'v1',
          analyzedAt: cacheQuery.created_at * 1000,
          webSearchUsed: (cacheQuery.web_searches_used || 0) > 0,
          sourcesCount: cachedData.sources?.length || 0,
        },
      });
    }
    
    console.log(`🔍 Cache MISS for ${companyName} - performing fresh analysis...`);
    
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
    
    const analyzedAt = Math.floor(Date.now() / 1000);
    
    await db.update(jobs)
      .set({
        companyIntelligenceData: JSON.stringify(dataToSave),
        companyIntelligenceAnalyzedAt: analyzedAt,
      })
      .where(eq(jobs.id, jobId));
    
    console.log(`💾 Saved company intelligence to database with ${sources.length} sources`);
    
    // === SAVE TO CACHE (30-day TTL) ===
    const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
    const expiresAt = analyzedAt + TTL_SECONDS;
    const contextFingerprint = crypto.createHash('sha256').update(companyName).digest('hex');
    
    try {
      sqlite.prepare(`
        INSERT INTO company_intelligence_cache (
          company_name, industry, intelligence_data, expires_at,
          context_fingerprint, sources, tokens_used, cost_usd, web_searches_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(company_name) DO UPDATE SET
          intelligence_data = excluded.intelligence_data,
          expires_at = excluded.expires_at,
          context_fingerprint = excluded.context_fingerprint,
          sources = excluded.sources,
          tokens_used = excluded.tokens_used,
          cost_usd = excluded.cost_usd,
          web_searches_used = excluded.web_searches_used,
          updated_at = unixepoch()
      `).run(
        companyName,
        industry,
        JSON.stringify(dataToSave),
        expiresAt,
        contextFingerprint,
        JSON.stringify(sources),
        result.tokensUsed || 0,
        result.cost || 0,
        6 // 6 web searches performed
      );
      
      console.log(`💾 Cached company intelligence for ${companyName} (expires in 30 days)`);
    } catch (cacheError) {
      console.error('⚠️ Failed to cache company intelligence:', cacheError);
      // Don't fail the request if caching fails
    }
    
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

