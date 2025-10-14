import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { kind, prompt, testData, mode } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Replace template variables with test data
    let processedPrompt = prompt;
    if (testData) {
      Object.entries(testData).forEach(([key, value]) => {
        processedPrompt = processedPrompt.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value)
        );
      });
    }

    // For now, return a mock response
    // In production, this would call the actual AI API
    const mockResponse = {
      prompt: processedPrompt,
      mode,
      testData,
      timestamp: new Date().toISOString(),
      tokens: {
        prompt: processedPrompt.split(' ').length,
        estimated: processedPrompt.split(' ').length * 1.3
      },
      mockResult: {
        message: 'This is a test response. In production, this would call the actual AI API.',
        status: 'success'
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(mockResponse);
  } catch (error: any) {
    console.error('Error testing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to test prompt' },
      { status: 500 }
    );
  }
}

