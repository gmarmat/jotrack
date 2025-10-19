import { NextRequest, NextResponse } from 'next/server';
import { loadPrompt, renderTemplate } from '@/core/ai/promptLoader';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { checkRateLimit, getResetTime, getIdentifier } from '@/lib/coach/rateLimiter';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
      jobId,
      jobDescription, 
      recruiterUrl = '', 
      peerUrls = [], 
      skipLevelUrls = [],
      additionalContext = '',
      dryRun = false,
      forceRefresh = false
    } = body;

    // Validation
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'jobDescription is required' },
        { status: 400 }
      );
    }
    
    // Check if we have people in the new repository
    if (jobId) {
      try {
        const { getPeopleForJob } = await import('@/db/peopleRepository');
        const people = await getPeopleForJob(jobId);
        
        if (people.length === 0) {
          return NextResponse.json(
            { error: 'No people profiles added yet. Click "Manage People" to add interview team members.' },
            { status: 400 }
          );
        }
        
        // TODO: Use people data instead of URLs for analysis
        console.log(`📊 Found ${people.length} people for job ${jobId}`);
      } catch (err) {
        console.error('Error fetching people:', err);
        // Continue with old URL-based logic as fallback
      }
    }

    // Check cache if jobId provided and not force refresh
    if (jobId && !forceRefresh) {
      try {
        const cached = sqlite.prepare(
          'SELECT result_json, created_at FROM people_analyses WHERE job_id = ? ORDER BY created_at DESC LIMIT 1'
        ).get(jobId) as any;

        if (cached) {
          const age = Date.now() - cached.created_at;
          if (age < CACHE_TTL_MS) {
            const result = JSON.parse(cached.result_json);
            result.cached = true;
            result.cacheAge = age;
            return NextResponse.json(result);
          }
        }
      } catch (error) {
        console.error('Cache lookup error:', error);
        // Continue to fresh analysis
      }
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
      // Fetch people from repository if jobId provided
      let peopleContext = '';
      if (jobId) {
        try {
          const { getPeopleForJob } = await import('@/db/peopleRepository');
          const people = await getPeopleForJob(jobId);
          
          // Filter only optimized profiles
          const optimizedPeople = people.filter((p: any) => p.isOptimized === 1);
          
          if (optimizedPeople.length === 0) {
            return NextResponse.json(
              { error: 'No optimized profiles found. Please optimize all profiles first in "Manage People".' },
              { status: 400 }
            );
          }
          
          // Build context from OPTIMIZED data (stored in summary as JSON)
          peopleContext = optimizedPeople.map((p: any, idx: number) => {
            const extracted = p.summary ? JSON.parse(p.summary) : null;
            
            if (!extracted) {
              return `Person ${idx + 1}: ${p.name} (Optimization failed - no data)`;
            }
            
            const roleLabel = p.relType === 'recruiter' ? 'Recruiter' :
                            p.relType === 'hiring_manager' ? 'Hiring Manager' :
                            p.relType === 'peer' ? 'Peer/Panel' : 'Other';
            
            return `Person ${idx + 1} (${roleLabel}):
Name: ${extracted.name}
Current Role: ${extracted.currentTitle || 'Unknown'} at ${extracted.currentCompany || 'Unknown'}
Location: ${extracted.location || 'Not specified'}

About:
${extracted.aboutMe || 'Not provided'}

Work Experience:
${extracted.workExperiences?.map((exp: any) => 
  `- ${exp.title} at ${exp.company} (${exp.duration})
   ${exp.description || ''}`
).join('\n') || 'None listed'}

Education:
${extracted.education?.map((edu: any) => 
  `- ${edu.degree} in ${edu.fieldOfStudy || 'N/A'} from ${edu.school} (${edu.year || 'N/A'})`
).join('\n') || 'None listed'}

Skills: ${extracted.skills?.join(', ') || 'None listed'}

Following: 
- Companies: ${extracted.following?.companies?.join(', ') || 'None'}
- People: ${extracted.following?.people?.join(', ') || 'None'}

Recommendations:
${extracted.recommendations?.map((rec: any) => 
  `- From ${rec.from}: "${rec.text}"`
).join('\n') || 'None received'}
---`;
          }).join('\n\n');
          
          console.log(`📊 Using ${optimizedPeople.length} optimized profiles for AI analysis`);
        } catch (err) {
          console.error('Error fetching people for AI:', err);
        }
      }
      
      // Fall back to URL props if no people found
      if (!peopleContext) {
        peopleContext = `Recruiter: ${recruiterUrl || 'None'}
Peers: ${peerUrls.join(', ') || 'None'}
Skip Level: ${skipLevelUrls.join(', ') || 'None'}`;
      }
      
      // Call AI provider with people context
      console.log('🔍 Calling AI with people context:', {
        jobId,
        peopleContextLength: peopleContext.length,
        promptKind: 'people',
        version: 'v1'
      });
      
      const aiResult = await callAiProvider(
        'people', // Fixed: prompt files are named people.v1.md, not people-analysis.v1.md
        {
          jobDescription,
          peopleProfiles: peopleContext,
          additionalContext
        },
        false, // dryRun
        'v1' // promptVersion
      );
      
      console.log('✅ AI call successful, parsing result...');

      // Parse and validate response
      const result = typeof aiResult.result === 'string' 
        ? JSON.parse(aiResult.result) 
        : aiResult.result;

      // Add metadata
      result.provider = 'remote';
      result.timestamp = Date.now();
      result.sources = result.sources || [];

      // Save to DB cache if jobId provided
      if (jobId) {
        try {
          const now = Math.floor(Date.now() / 1000); // Unix timestamp
          
          // Save to people_analyses cache table
          sqlite.prepare(`
            INSERT OR REPLACE INTO people_analyses (job_id, result_json, created_at)
            VALUES (?, ?, ?)
          `).run(jobId, JSON.stringify(result), Date.now());
          
          // Update jobs table with analysis timestamp
          sqlite.prepare(`
            UPDATE jobs 
            SET people_profiles_analyzed_at = ?
            WHERE id = ?
          `).run(now, jobId);
          
          console.log(`✅ People analysis saved and timestamp updated for job ${jobId}`);
        } catch (error) {
          console.error('Failed to cache people analysis:', error);
          // Continue anyway - caching failure shouldn't block response
        }
      }

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('❌ People analysis error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        fullError: error
      });
      
      // Return detailed error for debugging
      return NextResponse.json(
        { 
          error: `AI analysis failed: ${error.message || 'Unknown error'}`,
          details: error.message,
          errorType: error.name,
          fallback: 'local'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ People analysis request error:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    return NextResponse.json(
      { error: `Request error: ${error.message || 'Internal server error'}` },
      { status: 500 }
    );
  }
}

