import { NextResponse } from 'next/server';
import { getAiProviderConfig } from '@/lib/coach/aiProvider';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/test-connection
 * Test the OpenAI API key without making a full analysis
 */
export async function POST() {
  try {
    const config = await getAiProviderConfig();
    
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: 'network_disabled',
          message: 'Network AI is disabled. Please enable it in Settings.',
        },
        { status: 400 }
      );
    }

    // Make a minimal API call to OpenAI to test the key (uses ~10 tokens)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1, // Minimal response
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: 'invalid_api_key',
            message: 'Invalid API key. Please check your API key and try again.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'api_error',
          message: `OpenAI API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // Success!
    return NextResponse.json({
      success: true,
      message: 'API key is valid and working!',
      provider: config.provider,
      model: config.model,
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'unknown',
        message: error instanceof Error ? error.message : 'Test failed',
      },
      { status: 500 }
    );
  }
}
