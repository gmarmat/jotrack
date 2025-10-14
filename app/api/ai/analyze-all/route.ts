import { NextRequest, NextResponse } from 'next/server';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { checkRateLimit, getResetTime, getIdentifier } from '@/lib/coach/rateLimiter';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/analyze-all
 * Triggers all AI analyses (company, people, match score, skills)
 * Uses hierarchical context passing
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      jobId,
      jobDescription, 
      resume, 
      companyName,
      companyUrls,
      recruiterUrl,
      peerUrls,
      skipLevelUrls 
    } = body;

    if (!jobId || !jobDescription || !resume) {
      return NextResponse.json(
        { error: 'jobId, jobDescription, and resume are required' },
        { status: 400 }
      );
    }

    // Rate limiting
    const identifier = getIdentifier(req);
    if (checkRateLimit(identifier)) {
      const resetTime = getResetTime(identifier);
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Please try again in ${resetTime} seconds.`,
          resetTime 
        },
        { status: 429 }
      );
    }

    const results: any = {
      company: null,
      people: null,
      matchScore: null,
      skills: null,
    };

    try {
      // Step 1: Company Analysis
      if (companyName && companyUrls?.length > 0) {
        const companyRes = await fetch(`${req.nextUrl.origin}/api/ai/company-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            jobDescription,
            companyName,
            companyUrls,
          }),
        });

        if (companyRes.ok) {
          results.company = await companyRes.json();
        }
      }

      // Step 2: People Analysis (receives company context)
      if (recruiterUrl || (peerUrls && peerUrls.length > 0) || (skipLevelUrls && skipLevelUrls.length > 0)) {
        const peopleRes = await fetch(`${req.nextUrl.origin}/api/ai/people-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            jobDescription,
            recruiterUrl,
            peerUrls,
            skipLevelUrls,
            companyContext: results.company?.summary || null, // Pass company summary
          }),
        });

        if (peopleRes.ok) {
          results.people = await peopleRes.json();
        }
      }

      // Step 3: Match Score Analysis (receives company + people context)
      const matchRes = await fetch(`${req.nextUrl.origin}/api/ai/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobDescription,
          resume,
          companyContext: results.company?.summary || null,
          peopleContext: results.people?.summary || null,
        }),
      });

      if (matchRes.ok) {
        results.matchScore = await matchRes.json();
      }

      // Step 4: Skills Analysis (receives all previous context)
      // TODO: Implement skills-specific endpoint if needed

      return NextResponse.json({
        success: true,
        results,
        timestamp: Date.now(),
      });

    } catch (error: any) {
      console.error('Analyze all error:', error);
      return NextResponse.json(
        { error: error.message || 'One or more analyses failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Analyze all request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

