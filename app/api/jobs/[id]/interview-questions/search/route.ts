import { NextRequest, NextResponse } from 'next/server';
import { db, sqlite } from '@/db/client';
import { interviewQuestionsCache, jobs } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { searchInterviewQuestions } from '@/lib/interviewQuestions/searchQuestions';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// Evidence DTO for interview questions
type EvidenceFields = {
  sourceUrl?: string;      // e.g., Glassdoor / Reddit link for 'search', or 'generated' for synth
  snippet?: string;        // short excerpt or "generated from JD/resume/context"
  fetchedAt: string;       // ISO timestamp
  cacheKey: string;        // `${company}:${role}:${hash(questionText)}`
};

// In-memory cache for evidence fields (TODO: replace with DB cache)
const memoryQCache = new Map<string, { items: any[]; fetchedAt: number }>();

// TTL: 21 days for company+role community questions
const CACHE_TTL_DAYS = 21;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Generate cache key for evidence fields
 */
function generateCacheKey(company: string, role: string, questionText: string): string {
  const hash = createHash('md5').update(questionText).digest('hex').substring(0, 8);
  return `${company.toLowerCase()}:${role.toLowerCase()}:${hash}`;
}

/**
 * Add evidence fields to questions
 */
function addEvidenceFields(
  questions: any[], 
  companyName: string, 
  roleTitle: string, 
  sources: string[] = [],
  isFromCache: boolean = false,
  cachedFetchedAt?: number
): any[] {
  const now = new Date().toISOString();
  const fetchedAt = isFromCache && cachedFetchedAt ? new Date(cachedFetchedAt * 1000).toISOString() : now;
  
  return questions.map((question, index) => {
    const cacheKey = generateCacheKey(companyName, roleTitle, question.question || question);
    
    // For search results, try to get source URL and snippet
    let sourceUrl: string | undefined;
    let snippet: string | undefined;
    
    if (sources.length > 0) {
      // Use first available source, or cycle through if we have more questions than sources
      sourceUrl = sources[index % sources.length];
      snippet = sourceUrl ? `Found on ${new URL(sourceUrl).hostname}` : undefined;
    }
    
    return {
      ...question,
      sourceUrl,
      snippet,
      fetchedAt,
      cacheKey
    };
  });
}

/**
 * Check if cache entry is still fresh
 */
function isCacheFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL_MS;
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
      
      // Parse web intelligence (may be null for old cache entries)
      let webIntelligence = null;
      if (cached[0].webIntelligenceJson) {
        try {
          webIntelligence = JSON.parse(cached[0].webIntelligenceJson);
        } catch (error) {
          console.warn('Failed to parse cached web intelligence:', error);
        }
      }
      
      // Parse cached questions and sources
      const cachedQuestions = JSON.parse(cached[0].searchedQuestions || '[]');
      const cachedSources = JSON.parse(cached[0].searchSources || '[]');
      
      // Add evidence fields to cached questions
      const questionsWithEvidence = addEvidenceFields(
        cachedQuestions,
        companyName,
        roleTitle,
        cachedSources,
        true, // isFromCache
        cached[0].searchedAt
      );
      
      return NextResponse.json({
        success: true,
        questions: questionsWithEvidence,
        sources: cachedSources,
        webIntelligence,  // V2.0: Include if available
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
    
    // Add evidence fields to fresh questions
    const questionsWithEvidence = addEvidenceFields(
      questions,
      companyName,
      roleTitle,
      sources,
      false // isFromCache
    );
    
    // Cache results (90 days)
    const expiresAt = now + (90 * 24 * 60 * 60); // 90 days from now
    
    await db.insert(interviewQuestionsCache).values({
      id: uuidv4(),
      companyName: normalizedCompany,
      roleCategory: roleTitle,
      searchedQuestions: JSON.stringify(questionsWithEvidence), // Store with evidence fields
      searchSources: JSON.stringify(sources),
      webIntelligenceJson: JSON.stringify(webIntelligence), // V2.0: Save rich intelligence!
      searchedAt: now,
      createdAt: now,
      expiresAt
    });
    
    // Update jobs table timestamp
    await db.update(jobs)
      .set({ interviewQuestionsSearchedAt: now })
      .where(eq(jobs.id, jobId));
    
    console.log(`✅ Cached ${questions.length} questions for 90 days (company: ${normalizedCompany})`);
    console.log(`✅ Web intelligence:`, {
      interviewerValidations: Object.keys(webIntelligence.interviewerValidations).length,
      successPatterns: webIntelligence.successPatterns.length,
      warnings: webIntelligence.warnings.length
    });
    
    return NextResponse.json({
      success: true,
      questions: questionsWithEvidence, // Return with evidence fields
      sources,
      webIntelligence,  // V2.0: Return rich intelligence!
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

