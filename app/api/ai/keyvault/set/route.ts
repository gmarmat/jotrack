import { NextRequest, NextResponse } from 'next/server';
import { saveAiSettings } from '@/lib/coach/aiProvider';

/**
 * POST /api/ai/keyvault/set
 * Save AI settings (encrypted)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { networkEnabled, provider, model, apiKey } = body;

    if (typeof networkEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'networkEnabled must be a boolean' },
        { status: 400 }
      );
    }

    await saveAiSettings({
      networkEnabled,
      provider: provider || 'openai',
      model: model || 'gpt-4o',
      apiKey: apiKey || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}

