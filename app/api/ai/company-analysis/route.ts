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
      companyName, 
      companyUrls = [], 
      additionalContext = '',
      dryRun = false 
    } = body;

    // Validation
    if (!jobDescription || !companyName) {
      return NextResponse.json(
        { error: 'jobDescription and companyName are required' },
        { status: 400 }
      );
    }

    // Dry-run mode (local fixture)
    if (dryRun) {
      return NextResponse.json({
        company: {
          name: companyName,
          founded: 2018,
          employees: '250+',
          funding: 'Series B ($75M)',
          revenue: '$50M ARR',
          description: 'Enterprise SaaS platform helping modern teams collaborate. Specializes in real-time document editing and project management.',
          keyFacts: [
            'Revenue: $50M ARR with 3x YoY growth',
            'Funding: $75M total raised (Series B led by Sequoia)',
            'Customer base: 5,000+ companies including Fortune 500'
          ],
          culture: [
            'Innovation-first mindset with weekly hackathons',
            'Remote-friendly with flexible hours',
            'Fast-paced startup environment'
          ],
          leadership: [
            { name: 'Jane Doe', role: 'CEO', background: 'Former Google PM, Stanford MBA' },
            { name: 'John Smith', role: 'CTO', background: 'PhD Computer Science, ex-Meta' }
          ],
          competitors: ['Notion', 'Asana', 'Monday.com']
        },
        ecosystem: [
          { name: 'Notion', category: 'direct', relevanceScore: 95, reason: 'Direct competitor in collaborative workspace market' },
          { name: 'Asana', category: 'direct', relevanceScore: 88, reason: 'Project management focus, overlapping features' },
          { name: 'Monday.com', category: 'direct', relevanceScore: 85, reason: 'Similar product offering and target market' },
          { name: 'Slack', category: 'adjacent', relevanceScore: 72, reason: 'Complementary product, similar target market' },
          { name: 'Figma', category: 'adjacent', relevanceScore: 65, reason: 'Real-time collaboration tech, different product category' },
          { name: 'Miro', category: 'adjacent', relevanceScore: 68, reason: 'Collaborative workspace, visual focus' }
        ],
        sources: [],
        provider: 'local',
        timestamp: Date.now()
      });
    }

    // Real AI mode
    try {
      // Call AI provider
      const aiResult = await callAiProvider(
        'company-analysis',
        {
          jobDescription,
          companyName,
          companyUrls: companyUrls.join(', '),
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
      console.error('Company analysis error:', error);
      
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
    console.error('Company analysis request error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

