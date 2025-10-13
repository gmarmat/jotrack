import { NextResponse } from 'next/server';
import { getAiSettings } from '@/lib/coach/aiProvider';

/**
 * GET /api/ai/keyvault/status
 * Get AI settings status (without exposing API key)
 */
export async function GET() {
  try {
    const settings = await getAiSettings();

    return NextResponse.json({
      networkEnabled: settings.networkEnabled,
      provider: settings.provider,
      model: settings.model,
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    console.error('Error fetching AI settings status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI settings status' },
      { status: 500 }
    );
  }
}

