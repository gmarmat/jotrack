import { NextRequest, NextResponse } from 'next/server';
import { callAiProvider, createAiError, type AiError } from '@/lib/coach/aiProvider';
import { createAiRun, getAiRuns, deleteOldAiRuns } from '@/db/coachRepository';
import { checkRateLimit, getIdentifier, getRemainingCalls, getResetTime } from '@/lib/coach/rateLimiter';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/analyze
 * Run AI analysis for a specific capability
 * Query params: ?dryRun=1 for local dry-run mode
 * v1.3: Added rate limiting and better error handling
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === '1';

    const body = await request.json();
    const { jobId, capability, inputs, sessionId, promptVersion } = body;

    if (!jobId || !capability || !inputs) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, capability, inputs' },
        { status: 400 }
      );
    }

    // v1.3: Rate limiting moved after API call to avoid counting invalid API key errors

    // Generate inputs hash for caching
    const inputsHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ capability, inputs, promptVersion }))
      .digest('hex');

    // Check if we have a cached result
    const existingRuns = await getAiRuns(jobId, capability, 50);
    const cachedRun = existingRuns.find(r => r.inputsHash === inputsHash);

    if (cachedRun) {
      return NextResponse.json({
        cached: true,
        result: JSON.parse(cachedRun.resultJson),
        runId: cachedRun.id,
      });
    }

    // Call AI provider (v1.2: uses prompt templates)
    const { result, usage } = await callAiProvider(capability, inputs, dryRun, promptVersion || 'v1');

    // Collect sources for citation
    const sources: string[] = [];
    if (inputs.jobDescription && !dryRun) sources.push('Job Description');
    if (inputs.resume && !dryRun) sources.push('Resume');
    if (inputs.linkedinUrl) sources.push(inputs.linkedinUrl);
    if (inputs.recruiterLinks) sources.push(...inputs.recruiterLinks);
    if (inputs.peerLinks) sources.push(...inputs.peerLinks);

    // Store AI run with usage tracking
    const run = await createAiRun({
      jobId,
      sessionId: sessionId || null,
      capability,
      promptVersion: promptVersion || 'v1',
      provider: dryRun ? 'local_dry_run' : 'openai',
      inputsHash,
      resultJson: JSON.stringify(result),
      metaJson: JSON.stringify({ 
        dryRun, 
        timestamp: Date.now(),
        sources: sources.slice(0, 3), // Top 3 sources
        redactionApplied: !dryRun,
        usage: usage || null, // v1.2: Track token usage
      }),
      label: null,
      isActive: true,
      isPinned: false,
    });

    // Clean up old runs (keep last 3 + pinned)
    await deleteOldAiRuns(jobId, capability, 3);

    return NextResponse.json({
      cached: false,
      result,
      runId: run.id,
      usage: usage || null, // Return usage stats to client
      provider: dryRun ? 'local' : 'remote',
    });
  } catch (error) {
    console.error('Error in AI analyze:', error);
    
    // v1.3: Handle AiError with user-friendly messages
    if (error && typeof error === 'object' && 'code' in error) {
      const aiError = error as AiError;
      return NextResponse.json(
        {
          error: aiError.code,
          message: aiError.message,
          userMessage: aiError.userMessage,
          retryable: aiError.retryable,
        },
        { status: aiError.code === 'rate_limit' ? 429 : 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to analyze',
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
      },
      { status: 500 }
    );
  }
}

/**
 * Build prompt based on capability and inputs
 */
function buildPrompt(capability: string, inputs: any): string {
  switch (capability) {
    case 'company_profile':
      return `Analyze the following company information and provide a structured profile.
      
Company Name: ${inputs.companyName || 'Unknown'}
Website: ${inputs.website || 'N/A'}
LinkedIn: ${inputs.linkedinUrl || 'N/A'}
Additional Context: ${inputs.context || 'N/A'}

Return a JSON object with the following structure:
{
  "name": "Company Name",
  "industry": "Industry",
  "subindustry": "Subindustry",
  "principles": ["Principle 1", "Principle 2", "Principle 3"],
  "hqCity": "City",
  "hqState": "State",
  "hqCountry": "Country",
  "sizeBucket": "1-10 | 11-50 | 51-200 | 201-500 | 501-1000 | 1000+",
  "summary": "Brief company summary"
}`;

    case 'recruiter_profile':
      return `Analyze the following recruiter information and provide a profile.
      
Recruiter Name: ${inputs.recruiterName || 'Unknown'}
LinkedIn: ${inputs.linkedinUrl || 'N/A'}
Additional Context: ${inputs.context || 'N/A'}

Return a JSON object with:
{
  "name": "Recruiter Name",
  "title": "Job Title",
  "techDepth": "low | medium | high",
  "summary": "Brief summary",
  "persona": "Communication style and approach"
}`;

    case 'fit_analysis':
      return `Analyze the fit between this job description and resume.
      
Job Description:
${inputs.jobDescription || 'N/A'}

Resume:
${inputs.resume || 'N/A'}

Use a 25-parameter matrix with weighted dimensions. Return JSON:
{
  "overallScore": 0-100,
  "scoreLevel": "Low | Medium | Great",
  "dimensions": [
    {
      "name": "Technical Skills",
      "weight": 0.3,
      "score": 0-100,
      "reasoning": "1-2 sentence explanation"
    }
  ],
  "keywordMatches": {
    "found": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"]
  },
  "summary": "Overall assessment"
}`;

    case 'resume_improve':
      return `Suggest improvements to the resume to better match this job description.
      
Job Description:
${inputs.jobDescription || 'N/A'}

Current Resume:
${inputs.resume || 'N/A'}

Return JSON with up to 5 specific, actionable suggestions:
{
  "suggestions": [
    {
      "section": "Section name",
      "current": "Current text",
      "suggested": "Improved text",
      "reasoning": "Why this is better"
    }
  ],
  "missingKeywords": ["keyword1", "keyword2"],
  "estimatedNewScore": 0-100
}`;

    case 'skill_path':
      return `Create a fast upskilling plan for missing skills.
      
Job Description:
${inputs.jobDescription || 'N/A'}

Current Skills:
${inputs.currentSkills?.join(', ') || 'N/A'}

Missing Skills:
${inputs.missingSkills?.join(', ') || 'N/A'}

Return JSON with 3-5 skills, each ≤6 hours:
{
  "skills": [
    {
      "skill": "Skill name",
      "priority": "high | medium | low",
      "estimatedHours": 1-6,
      "resources": []
    }
  ],
  "totalHours": 0,
  "talkTrack": "Short paragraph for recruiter call explaining your upskilling plan"
}`;

    default:
      return `Analyze the following for ${capability}:\n${JSON.stringify(inputs, null, 2)}`;
  }
}

