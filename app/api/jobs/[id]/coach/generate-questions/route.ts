import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { jobs, companyInterviewQuestions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { executePrompt } from '@/lib/analysis/promptExecutor';
import { getJobAnalysisVariants } from '@/lib/analysis/promptExecutor';
import { searchWeb } from '@/lib/analysis/tavilySearch';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { interviewStage } = body; // 'recruiter', 'hiring-manager', or 'peer-panel'

    if (!interviewStage || !['recruiter', 'hiring-manager', 'peer-panel'].includes(interviewStage)) {
      return NextResponse.json(
        { error: 'Invalid interview stage. Must be: recruiter, hiring-manager, or peer-panel' },
        { status: 400 }
      );
    }

    console.log(`🎯 Generating ${interviewStage} interview questions for job ${jobId}...`);

    // Load job data
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const companyName = job.company;
    const jobTitle = job.title;

    // Check cache first (90 day TTL)
    const now = Date.now();
    const cached = await db
      .select()
      .from(companyInterviewQuestions)
      .where(eq(companyInterviewQuestions.companyName, companyName))
      .limit(1);

    if (cached.length > 0 && cached[0].expiresAt && cached[0].expiresAt > now) {
      console.log(`✅ Using cached questions for ${companyName} (${interviewStage})`);
      const questions = JSON.parse(cached[0].questions || '[]');
      const sources = JSON.parse(cached[0].sources || '[]');
      
      return NextResponse.json({
        success: true,
        questions,
        sources,
        cached: true,
        expiresAt: cached[0].expiresAt,
      });
    }

    // No cache - generate fresh
    console.log(`🔍 No cache found, generating fresh questions...`);

    // Step 1: Search online for real interview questions
    let searchResults: any[] = [];
    try {
      const searches = await Promise.all([
        searchWeb(`${companyName} interview questions ${jobTitle} glassdoor`),
        searchWeb(`${companyName} ${interviewStage} interview questions reddit`),
        searchWeb(`${companyName} technical interview blind`),
      ]);

      searchResults = searches.flatMap(r => r.results || []);
      console.log(`🔍 Found ${searchResults.length} web search results`);
    } catch (error) {
      console.warn('Web search failed, will rely on AI generation:', error);
    }

    // Step 2: Get JD and Company Intel for context
    const { jdVariant } = await getJobAnalysisVariants(jobId);
    
    let companyPrinciples = '';
    if (job.companyIntelligenceData) {
      try {
        const intel = JSON.parse(job.companyIntelligenceData);
        companyPrinciples = intel.company?.principles?.join(', ') || '';
      } catch (e) {
        console.warn('Failed to parse company intelligence:', e);
      }
    }

    // Format search results for prompt
    const searchContext = searchResults.length > 0
      ? `## Real Interview Questions (from web search):
${searchResults.slice(0, 10).map((r, i) => `${i + 1}. ${r.content?.substring(0, 200) || r.title}`).join('\n')}
`
      : '';

    // Step 3: Generate questions with AI
    const promptName = {
      'recruiter': 'coach-questions-recruiter',
      'hiring-manager': 'coach-questions-hiring-manager',
      'peer-panel': 'coach-questions-peer-panel',
    }[interviewStage];

    const result = await executePrompt({
      promptName: promptName!,
      promptVersion: 'v1',
      variables: {
        companyName,
        jobTitle,
        jobDescription: jdVariant.content,
        companyPrinciples,
        searchContext,
      },
      jobId,
      sourceType: 'jd',
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate interview questions');
    }

    const questionsData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
    const questions = questionsData.questions || [];

    console.log(`✅ Generated ${questions.length} ${interviewStage} questions`);

    // Step 4: Cache results (90 day TTL)
    const cacheId = uuidv4();
    const expiresAt = now + (90 * 24 * 60 * 60 * 1000); // 90 days

    await db.insert(companyInterviewQuestions).values({
      id: cacheId,
      companyName,
      roleCategory: jobTitle,
      interviewStage,
      questions: JSON.stringify(questions),
      sources: JSON.stringify({
        webSearch: searchResults.length,
        aiGenerated: true,
        createdAt: now,
      }),
      createdAt: now,
      expiresAt,
    });

    console.log(`💾 Cached questions for ${companyName} (expires in 90 days)`);

    return NextResponse.json({
      success: true,
      questions,
      sources: {
        webSearch: searchResults.length,
        aiGenerated: true,
      },
      cached: false,
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
      },
    });
  } catch (error: any) {
    console.error('Interview questions generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate interview questions' },
      { status: 500 }
    );
  }
}

