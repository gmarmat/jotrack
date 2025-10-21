import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { interviewQuestionsCache, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { type Source } from '@/app/components/ai/SourcesModal';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/jobs/[id]/interviewer-evidence
 * Retrieves interviewer validation evidence from Interview Coach search cache
 * Returns evidence mapped to Source format for display in SourcesModal
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.id;
    
    // Get job to find company name
    const job = await db.query.jobs.findFirst({
      where: (j, { eq }) => eq(j.id, jobId),
    });
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    const companyName = job.company.toLowerCase().trim();
    
    // Load web intelligence from interview questions cache
    const cached = await db
      .select()
      .from(interviewQuestionsCache)
      .where(eq(interviewQuestionsCache.companyName, companyName))
      .limit(1);
    
    if (cached.length === 0 || !cached[0].webIntelligenceJson) {
      return NextResponse.json({
        success: true,
        evidence: {},
        message: 'No interviewer evidence found. Run Interview Coach to collect evidence from Glassdoor, Reddit, and Blind.'
      });
    }
    
    // Parse web intelligence
    const webIntelligence = JSON.parse(cached[0].webIntelligenceJson);
    const interviewerValidations = webIntelligence.interviewerValidations || {};
    
    // Map interviewer validations to Evidence format
    const evidence: Record<string, Source[]> = {};
    
    Object.entries(interviewerValidations).forEach(([name, validation]: [string, any]) => {
      if (validation.sources && validation.sources.length > 0) {
        evidence[name] = validation.sources.map((s: any) => {
          // Map platform names
          let platform: 'linkedin' | 'glassdoor' | 'reddit' | 'blind' | 'other' = 'other';
          const sourceLower = (s.source || '').toLowerCase();
          
          if (sourceLower.includes('glassdoor')) platform = 'glassdoor';
          else if (sourceLower.includes('reddit')) platform = 'reddit';
          else if (sourceLower.includes('blind')) platform = 'blind';
          else if (sourceLower.includes('linkedin')) platform = 'linkedin';
          
          return {
            platform,
            quote: s.quote || '',
            fullQuote: s.quote || '', // We already have the full quote
            url: s.url || '',
            dateAccessed: s.date || cached[0].searchedAt?.toString(),
            confidence: 'medium' as const, // From web search
            provider: 'tavily' as const, // From Tavily search
            author: s.author,
            context: `Found in ${s.source} while searching for interview questions`
          } as Source;
        });
      }
    });
    
    console.log(`✅ Retrieved interviewer evidence for ${Object.keys(evidence).length} people`);
    
    return NextResponse.json({
      success: true,
      evidence,
      searchedAt: cached[0].searchedAt,
      validatedCount: Object.keys(evidence).length
    });
  } catch (error: any) {
    console.error('❌ Failed to load interviewer evidence:', error);
    return NextResponse.json(
      { error: `Failed to load evidence: ${error.message}` },
      { status: 500 }
    );
  }
}

