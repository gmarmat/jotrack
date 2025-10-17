import { NextRequest, NextResponse } from 'next/server';
import { getAiSettings } from '@/lib/coach/aiProvider';

/**
 * GET /api/ai/keyvault/get
 * Load AI settings (without exposing the actual API key)
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await getAiSettings();

    return NextResponse.json({
      networkEnabled: settings.networkEnabled || false,
      provider: settings.provider || 'claude',
      // Claude settings
      claudeModel: settings.claudeModel || 'claude-3-5-sonnet-latest',
      hasClaudeKey: !!settings.claudeKey,
      // OpenAI settings
      openaiModel: settings.openaiModel || 'gpt-4o-mini',
      hasOpenaiKey: !!settings.openaiKey,
      // Tavily settings
      hasTavilyKey: !!settings.tavilyKey,
      // Legacy support
      model: settings.model || settings.claudeModel || 'claude-3-5-sonnet-20241022',
      hasApiKey: !!(settings.apiKey || settings.claudeKey || settings.openaiKey),
    });
  } catch (error) {
    console.error('Error loading AI settings:', error);
    return NextResponse.json(
      { 
        networkEnabled: false,
        provider: 'claude',
        claudeModel: 'claude-3-5-sonnet-latest',
        hasClaudeKey: false,
        openaiModel: 'gpt-4o-mini',
        hasOpenaiKey: false,
        hasTavilyKey: false,
        hasApiKey: false,
      },
      { status: 200 } // Return defaults instead of error
    );
  }
}

