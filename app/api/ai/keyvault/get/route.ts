import { NextRequest, NextResponse } from 'next/server';
import { loadAiSettings } from '@/lib/coach/aiProvider';

/**
 * GET /api/ai/keyvault/get
 * Load AI settings (without exposing the actual API key)
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await loadAiSettings();

    return NextResponse.json({
      networkEnabled: settings.networkEnabled || false,
      provider: settings.provider || 'openai',
      model: settings.model || 'gpt-4o-mini',
      hasApiKey: !!settings.apiKey, // Only indicate if key exists, don't expose it
    });
  } catch (error) {
    console.error('Error loading AI settings:', error);
    return NextResponse.json(
      { 
        networkEnabled: false,
        provider: 'openai',
        model: 'gpt-4o-mini',
        hasApiKey: false
      },
      { status: 200 } // Return defaults instead of error
    );
  }
}

