import { NextRequest, NextResponse } from 'next/server';
import { loadPrompt, renderTemplate } from '@/core/ai/promptLoader';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { checkRateLimit, getResetTime, getIdentifier } from '@/lib/coach/rateLimiter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getIdentifier(request);
    const allowed = checkRateLimit(identifier);
    if (!allowed) {
      const waitSeconds = getResetTime(identifier);
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Please wait ${waitSeconds}s before trying again.`,
          waitSeconds 
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { 
      jobDescription, 
      recruiterUrl = '', 
      peerUrls = [], 
      skipLevelUrls = [],
      additionalContext = '',
      dryRun = false 
    } = body;

    // Validation
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'jobDescription is required' },
        { status: 400 }
      );
    }

    // Dry-run mode (local fixture)
    if (dryRun) {
      return NextResponse.json({
        profiles: [
          {
            name: 'Jane Doe',
            role: 'Recruiter',
            linkedInUrl: recruiterUrl || null,
            background: [
              '8+ years in tech recruiting',
              'Previously at Google and Stripe',
              'Specializes in senior engineering roles'
            ],
            expertise: ['Technical recruiting', 'Engineering talent', 'Startup hiring'],
            communicationStyle: 'Professional',
            whatThisMeans: 'Jane has deep technical knowledge, so be prepared to discuss technical details and system design. Emphasize your senior-level experience and architectural decisions.'
          },
          {
            name: 'John Smith',
            role: 'Hiring Manager',
            linkedInUrl: peerUrls[0] || null,
            background: [
              'Engineering Director with 12+ years experience',
              'Previously CTO at FinTech startup',
              'Stanford CS, MIT MBA'
            ],
            expertise: ['System architecture', 'Team scaling', 'Fintech domain'],
            communicationStyle: 'Technical',
            whatThisMeans: 'John will likely focus on scalability, architecture decisions, and your experience building reliable financial systems. Prepare examples of handling high-stakes technical challenges.'
          }
        ],
        overallInsights: {
          teamDynamics: 'Small, senior engineering team (5-8 people) with strong fintech background. Emphasis on quality and reliability over speed.',
          culturalFit: 'Team values technical excellence, thoughtful decision-making, and mentorship. Good fit for candidates who prioritize code quality and system design.',
          preparationTips: [
            'Research fintech regulations and compliance challenges',
            'Prepare examples of scaling systems under regulatory constraints',
            'Ask about technical debt priorities and architectural vision',
            'Discuss mentorship approach (team seems to value knowledge sharing)',
            'Show interest in financial domain knowledge'
          ]
        },
        sources: [],
        provider: 'local',
        timestamp: Date.now()
      });
    }

    // Real AI mode
    try {
      // Call AI provider
      const aiResult = await callAiProvider(
        'people-analysis',
        {
          jobDescription,
          recruiterUrl,
          peerUrls: peerUrls.join(', '),
          skipLevelUrls: skipLevelUrls.join(', '),
          additionalContext
        },
        false, // dryRun
        'v1' // promptVersion
      );

      // Parse and validate response
      const result = typeof aiResult.result === 'string' 
        ? JSON.parse(aiResult.result) 
        : aiResult.result;

      // Add metadata
      result.provider = 'remote';
      result.timestamp = Date.now();
      result.sources = result.sources || [];

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('People analysis error:', error);
      
      // Return friendly error with fallback to local mode
      return NextResponse.json(
        { 
          error: 'AI analysis failed. Please try again or check your API configuration.',
          details: error.message,
          fallback: 'local'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('People analysis request error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

