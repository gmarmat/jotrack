import { NextRequest, NextResponse } from 'next/server';
import { saveAiSettings } from '@/lib/coach/aiProvider';

/**
 * POST /api/ai/keyvault/set
 * Save AI settings (encrypted)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      networkEnabled, 
      provider, 
      claudeModel,
      claudeKey,
      openaiModel,
      openaiKey,
      tavilyKey,
      // Legacy support
      model,
      apiKey,
    } = body;

    // Build settings object from new or legacy fields
    const settings: any = {
      networkEnabled: networkEnabled !== undefined ? networkEnabled : true,
      provider: provider || 'claude',
    };

    // Handle Claude keys
    if (claudeKey) {
      settings.claudeKey = claudeKey;
    }
    if (claudeModel) {
      settings.claudeModel = claudeModel;
    }

    // Handle OpenAI keys
    if (openaiKey) {
      settings.openaiKey = openaiKey;
    }
    if (openaiModel) {
      settings.openaiModel = openaiModel;
    }

    // Handle Tavily keys
    if (tavilyKey) {
      settings.tavilyKey = tavilyKey;
    }

    // Legacy support for old apiKey field
    if (apiKey && !claudeKey && !openaiKey) {
      if (provider === 'claude') {
        settings.claudeKey = apiKey;
      } else {
        settings.openaiKey = apiKey;
      }
    }
    if (model) {
      if (provider === 'claude') {
        settings.claudeModel = model;
      } else {
        settings.openaiModel = model;
      }
    }

    await saveAiSettings(settings);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}

