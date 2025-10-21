import { NextRequest, NextResponse } from 'next/server';
import { db, sqlite } from '@/db/client';
import { jobs, attachments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { extractFileContent } from '@/lib/fileContent';
import { getCachedEcosystemData } from '@/db/companyEcosystemCacheRepository';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const jobId = context.params.id;

    // Get job
    const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job || job.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobData = job[0];

    // Get attachments
    const jobAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.jobId, jobId))
      .orderBy(desc(attachments.createdAt));

    // Extract JD text
    let jobDescription = '';
    const jdAttachment = jobAttachments.find(a => a.kind === 'jd' && a.isActive);
    if (jdAttachment?.path) {
      try {
        const fullPath = `data/attachments/${jdAttachment.path}`;
        const jdContent = await extractFileContent(fullPath);
        jobDescription = jdContent?.text || '';
      } catch (error) {
        console.error('Failed to extract JD:', error);
      }
    }

    // Extract Resume text
    let resume = '';
    const resumeAttachment = jobAttachments.find(a => a.kind === 'resume' && a.isActive);
    if (resumeAttachment?.path) {
      try {
        const fullPath = `data/attachments/${resumeAttachment.path}`;
        const resumeContent = await extractFileContent(fullPath);
        resume = resumeContent?.text || '';
      } catch (error) {
        console.error('Failed to extract resume:', error);
      }
    }

    // Get coach session data (for URLs and additional context)
    let coachData: any = null;
    try {
      const coachRes = await fetch(
        `${request.nextUrl.origin}/api/coach/${jobId}/save`,
        { cache: 'no-store' }
      );
      if (coachRes.ok) {
        const data = await coachRes.json();
        coachData = data.data || null;
      }
    } catch (error) {
      console.error('Failed to fetch coach session:', error);
    }

    // Load cached ecosystem data if available
    let companyEcosystem = null;
    let ecosystemMetadata = null;
    if (jobData.company) {
      console.log(`🔍 Looking for cached ecosystem for company: "${jobData.company}"`);
      try {
        const cachedEcosystem = await getCachedEcosystemData(jobData.company);
        console.log(`🔍 Cache lookup result:`, cachedEcosystem ? 'FOUND' : 'NOT FOUND');
        if (cachedEcosystem) {
          const researchData = JSON.parse(cachedEcosystem.researchData);
          companyEcosystem = researchData.companies || null;
          
          // Calculate cache age with proper minute/hour/day formatting
          const cacheAgeMs = Date.now() - (cachedEcosystem.createdAt * 1000);
          const cacheAgeMinutes = Math.floor(cacheAgeMs / (1000 * 60));
          const cacheAgeHours = Math.floor(cacheAgeMs / (1000 * 60 * 60));
          const cacheAgeDays = Math.floor(cacheAgeMs / (1000 * 60 * 60 * 24));
          
          const cacheAgeStr = cacheAgeDays > 0 
            ? `${cacheAgeDays} day${cacheAgeDays > 1 ? 's' : ''} ago`
            : cacheAgeHours > 0
              ? `${cacheAgeHours} hour${cacheAgeHours > 1 ? 's' : ''} ago`
              : cacheAgeMinutes > 0
                ? `${cacheAgeMinutes} min${cacheAgeMinutes > 1 ? 's' : ''} ago`
                : 'just now';
          
          ecosystemMetadata = {
            cached: true,
            cacheAge: cacheAgeStr,
            analyzedAt: cachedEcosystem.createdAt * 1000,
            companyCount: cachedEcosystem.companyCount,
            tokensUsed: cachedEcosystem.tokensUsed,
            costUsd: cachedEcosystem.costUsd,
          };
          
          console.log(`✅ Loaded cached ecosystem for ${jobData.company}: ${companyEcosystem?.length || 0} companies`);
        }
      } catch (error) {
        console.error('Failed to load cached ecosystem:', error);
      }
    }
    
    // Load cached company intelligence if available
    let companyIntelligence = null;
    let companyIntelMetadata = null;
    if (jobData.companyIntelligenceData) {
      try {
        companyIntelligence = JSON.parse(jobData.companyIntelligenceData);
        
        // Calculate age with proper minute/hour/day formatting
        const analyzedAt = (jobData.companyIntelligenceAnalyzedAt || 0) * 1000;
        const ageMs = Date.now() - analyzedAt;
        const ageMinutes = Math.floor(ageMs / (1000 * 60));
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        
        const ageStr = ageDays > 0 
          ? `${ageDays} day${ageDays > 1 ? 's' : ''} ago`
          : ageHours > 0
            ? `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`
            : ageMinutes > 0
              ? `${ageMinutes} min${ageMinutes > 1 ? 's' : ''} ago`
              : 'just now';
        
        companyIntelMetadata = {
          cached: true,
          cacheAge: ageStr,
          analyzedAt,
        };
        
        console.log(`✅ Loaded cached company intelligence`);
      } catch (error) {
        console.error('Failed to parse company intelligence:', error);
      }
    }
    
    // Load cached match score + skills data if available
    let matchScoreData = null;
    let matchScoreMetadata = null;
    console.log(`🔍 Checking for match score data:`, {
      hasData: !!jobData.matchScoreData,
      analyzedAt: jobData.matchScoreAnalyzedAt,
      dataLength: jobData.matchScoreData?.length || 0
    });
    
    if (jobData.matchScoreData) {
      try {
        matchScoreData = JSON.parse(jobData.matchScoreData);
        
        // Calculate age with proper minute/hour/day formatting
        const analyzedAt = (jobData.matchScoreAnalyzedAt || 0);
        const analyzedAtMs = analyzedAt > 1000000000000 ? analyzedAt : analyzedAt * 1000;
        const ageMs = Date.now() - analyzedAtMs;
        const ageMinutes = Math.floor(ageMs / (1000 * 60));
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        
        const ageStr = ageDays > 0 
          ? `${ageDays} day${ageDays > 1 ? 's' : ''} ago`
          : ageHours > 0
            ? `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`
            : ageMinutes > 0
              ? `${ageMinutes} min${ageMinutes > 1 ? 's' : ''} ago`
              : 'just now';
        
        matchScoreMetadata = {
          cached: true,
          cacheAge: ageStr,
          analyzedAt: analyzedAtMs,
        };
        
        console.log(`✅ Loaded cached match score + skills data:`, {
          matchScore: matchScoreData?.matchScore?.overallScore,
          skillsCount: matchScoreData?.skillsMatch?.technicalSkills?.length || 0,
          hasSkillsMatch: !!matchScoreData?.skillsMatch,
          cacheAge: ageStr,
          sampleSkills: matchScoreData?.skillsMatch?.technicalSkills?.slice(0, 2)
        });
      } catch (error) {
        console.error('Failed to parse match score data:', error);
      }
    }

    // Load people profiles analysis data if available
    let peopleProfiles = null;
    let peopleProfilesMetadata = null;
    if (jobData.peopleProfilesAnalyzedAt) {
      try {
        const cached = sqlite.prepare(`
          SELECT result_json, created_at 
          FROM people_analyses 
          WHERE job_id = ?
          ORDER BY created_at DESC 
          LIMIT 1
        `).get(jobId) as any;
        
        if (cached && cached.result_json) {
          peopleProfiles = JSON.parse(cached.result_json);
          
          // Calculate age
          const nowSeconds = Math.floor(Date.now() / 1000);
          const ageSeconds = nowSeconds - jobData.peopleProfilesAnalyzedAt;
          const ageHours = Math.floor(ageSeconds / 3600);
          const ageDays = Math.floor(ageHours / 24);
          
          let ageStr = '';
          if (ageDays > 0) {
            ageStr = `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
          } else if (ageHours > 0) {
            ageStr = `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
          } else {
            const ageMinutes = Math.floor(ageSeconds / 60);
            ageStr = ageMinutes > 0 ? `${ageMinutes} min ago` : 'just now';
          }
          
          peopleProfilesMetadata = {
            cached: true,
            analyzedAt: jobData.peopleProfilesAnalyzedAt,
            cacheAge: ageStr,
            profileCount: peopleProfiles?.profiles?.length || 0
          };
          
          console.log(`✅ Loaded people profiles cache for job ${jobId}:`, {
            profileCount: peopleProfilesMetadata.profileCount,
            cacheAge: ageStr
          });
        }
      } catch (error) {
        console.error('Failed to load people profiles cache:', error);
      }
    }

    // Build response
    const response = {
      jobId,
      jobTitle: jobData.title,
      companyName: jobData.company,
      jobDescription,
      resume,
      // URLs from coach session (if available)
      companyUrls: coachData?.otherCompanyUrls || [],
      recruiterUrl: coachData?.recruiterUrl || '',
      peerUrls: (coachData?.peerUrls || []).map((p: any) => typeof p === 'string' ? p : p.url),
      skipLevelUrls: coachData?.skipLevelUrls || [],
      // Additional context
      notes: jobData.notes || '',
      postingUrl: jobData.postingUrl || '',
      // Analysis results (cached)
      companyEcosystem,
      ecosystemMetadata,
      companyIntelligence,
      companyIntelMetadata,
      matchScoreData,
      matchScoreMetadata,
      peopleProfiles,
      peopleProfilesMetadata,
    };
    
    // Load interview questions (for Interview Coach)
    try {
      const interviewQuestionsCache = sqlite.prepare(`
        SELECT * FROM interview_questions_cache 
        WHERE company_name = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `).get(jobData.company) as any;
      
      const jobInterviewQuestions = sqlite.prepare(`
        SELECT * FROM job_interview_questions 
        WHERE job_id = ? 
        LIMIT 1
      `).get(jobId) as any;
      
      response.interviewQuestionsCache = interviewQuestionsCache;
      response.jobInterviewQuestions = jobInterviewQuestions;
    } catch (error) {
      console.error('Failed to load interview questions:', error);
      // Non-fatal - continue without interview questions
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Analysis data fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analysis data' },
      { status: 500 }
    );
  }
}

