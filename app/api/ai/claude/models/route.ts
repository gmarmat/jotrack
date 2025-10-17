import { NextRequest, NextResponse } from 'next/server';
import { getAiSettings } from '@/lib/coach/aiProvider';

/**
 * GET /api/ai/claude/models
 * Fetch available Claude models from Anthropic API
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getAiSettings();
    const claudeKey = settings.claudeKey;
    
    if (!claudeKey) {
      return NextResponse.json(
        { error: 'No Claude API key configured. Add one in Settings first.' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Fetching available Claude models...');
    
    // Fetch models from Claude API
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Parse and enrich model data
    const models = (data.data || []).map((model: any) => {
      const id = model.id;
      const displayName = model.display_name;
      
      // Determine cost tier based on model name
      let costTier = 'unknown';
      let costPerJob = '~$0.05';
      let emoji = '📊';
      let recommendation = '';
      
      if (id.includes('opus')) {
        costTier = 'premium';
        costPerJob = '~$0.15/job';
        emoji = '💎';
        recommendation = 'Best quality';
      } else if (id.includes('sonnet')) {
        costTier = 'recommended';
        costPerJob = '~$0.03/job';
        emoji = '⭐';
        recommendation = 'Recommended - Best balance';
      } else if (id.includes('haiku')) {
        costTier = 'budget';
        costPerJob = '~$0.01/job';
        emoji = '💰';
        recommendation = 'Budget option';
      }
      
      return {
        id,
        displayName,
        createdAt: model.created_at,
        costTier,
        costPerJob,
        emoji,
        recommendation,
        label: `${displayName} (${recommendation}) - ${costPerJob} ${emoji}`,
      };
    });
    
    // Sort: Sonnet first, then Haiku, then Opus
    models.sort((a: any, b: any) => {
      const order = { recommended: 0, budget: 1, premium: 2, unknown: 3 };
      return order[a.costTier as keyof typeof order] - order[b.costTier as keyof typeof order];
    });
    
    console.log(`✅ Found ${models.length} Claude models`);
    
    return NextResponse.json({
      success: true,
      models,
      recommended: models.find((m: any) => m.costTier === 'recommended')?.id || models[0]?.id,
    });
  } catch (error: any) {
    console.error('❌ Error fetching Claude models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

