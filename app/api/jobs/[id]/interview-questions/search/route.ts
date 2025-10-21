import { NextRequest, NextResponse } from 'next/server';
import { db, sqlite } from '@/db/client';
import { interviewQuestionsCache, jobs } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { searchInterviewQuestions } from '@/lib/interviewQuestions/searchQuestions';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.id;
    const { companyName, roleTitle } = await request.json();
    
    if (!companyName || !roleTitle) {
      return NextResponse.json(
        { error: 'companyName and roleTitle required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Searching interview questions for ${companyName} - ${roleTitle}...`);
    
    // V2.0: Load interviewer names from People Profiles for validation
    let interviewerNames: string[] = [];
    try {
      const peopleAnalysis = sqlite.prepare(`
        SELECT result_json FROM people_analyses WHERE job_id = ? LIMIT 1
      `).get(jobId) as any;
      
      if (peopleAnalysis && peopleAnalysis.result_json) {
        const peopleProfiles = JSON.parse(peopleAnalysis.result_json);
        if (peopleProfiles?.profiles) {
          interviewerNames = peopleProfiles.profiles.map((p: any) => p.name).filter(Boolean);
          console.log(`✅ Will validate ${interviewerNames.length} interviewers:`, interviewerNames);
        }
      }
    } catch (error) {
      console.log('⚠️ No people profiles found, skipping interviewer validation');
    }
    
    // Check cache first (90 day TTL)
    const now = Math.floor(Date.now() / 1000);
    const normalizedCompany = companyName.toLowerCase().trim();
    
    const cached = await db
      .select()
      .from(interviewQuestionsCache)
      .where(
        and(
          eq(interviewQuestionsCache.companyName, normalizedCompany),
          gt(interviewQuestionsCache.expiresAt, now)
        )
      )
      .limit(1);
    
    if (cached.length > 0) {
      console.log('✅ Using cached interview questions (company-wide cache)');
      
      // Update jobs table timestamp (even though using cache)
      await db.update(jobs)
        .set({ interviewQuestionsSearchedAt: now })
        .where(eq(jobs.id, jobId));
      
      return NextResponse.json({
        success: true,
        questions: JSON.parse(cached[0].searchedQuestions || '[]'),
        sources: JSON.parse(cached[0].searchSources || '[]'),
        searchedAt: cached[0].searchedAt,
        cached: true,
        cacheExpiresAt: cached[0].expiresAt
      });
    }
    
    // No cache - search web for questions
    console.log('🌐 No cache found, searching web with Tavily...');
    const { questions, sources, webIntelligence } = await searchInterviewQuestions(
      companyName,
      roleTitle,
      interviewerNames  // V2.0: Pass interviewer names for validation!
    );
    
    if (questions.length === 0) {
      return NextResponse.json({
        success: true,
        questions: [],
        sources: [],
        message: 'No questions found. Try a different company or role name.'
      });
    }
    
    // Cache results (90 days)
    const expiresAt = now + (90 * 24 * 60 * 60); // 90 days from now
    
    await db.insert(interviewQuestionsCache).values({
      id: uuidv4(),
      companyName: normalizedCompany,
      roleCategory: roleTitle,
      searchedQuestions: JSON.stringify(questions),
      searchSources: JSON.stringify(sources),
      searchedAt: now,
      createdAt: now,
      expiresAt
    });
    
    // Update jobs table timestamp
    await db.update(jobs)
      .set({ interviewQuestionsSearchedAt: now })
      .where(eq(jobs.id, jobId));
    
    console.log(`✅ Cached ${questions.length} questions for 90 days (company: ${normalizedCompany})`);
    
    return NextResponse.json({
      success: true,
      questions,
      sources,
      searchedAt: now,
      cached: false,
      cacheExpiresAt: expiresAt
    });
  } catch (error: any) {
    console.error('❌ Interview question search failed:', error);
    return NextResponse.json(
      { error: `Search failed: ${error.message}` },
      { status: 500 }
    );
  }
}

