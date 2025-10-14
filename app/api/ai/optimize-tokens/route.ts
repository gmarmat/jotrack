import { NextRequest, NextResponse } from 'next/server';
import { callAiProvider } from '@/lib/coach/aiProvider';
import { checkRateLimit, getResetTime, getIdentifier } from '@/lib/coach/rateLimiter';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/optimize-tokens
 * Creates a token-optimized summary of long content
 */
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Rate limiting
    const identifier = getIdentifier(req);
    if (checkRateLimit(identifier)) {
      const resetTime = getResetTime(identifier);
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You've made too many AI requests. Please try again in ${resetTime} seconds.`,
          resetTime 
        },
        { status: 429 }
      );
    }

    // Simple optimization prompt
    const prompt = `You are an expert at condensing text while preserving all critical information.

TASK: Reduce the following text to approximately 30-40% of its original length while:
1. Keeping ALL key facts, numbers, skills, requirements, and dates
2. Removing redundant phrases and filler words
3. Using bullet points for clarity
4. Maintaining technical accuracy

Original text:
"""
${text}
"""

Return ONLY the optimized version, no explanations.`;

    const result = await callAiProvider(
      'analyze', // Using analyze capability
      {
        jobDescription: prompt,
        resume: '', // Not needed for this task
      },
      false, // Always use real AI for optimization
      'v1'
    );

    // Extract optimized text from result
    let optimized = '';
    if (typeof result === 'string') {
      optimized = result;
    } else if (result && typeof result === 'object') {
      // Try to extract text from various possible structures
      optimized = (result as any).optimized || (result as any).summary || JSON.stringify(result);
    }

    return NextResponse.json({
      optimized: optimized.trim(),
      originalLength: text.length,
      optimizedLength: optimized.length,
      savings: text.length - optimized.length,
      savingsPercent: Math.round(((text.length - optimized.length) / text.length) * 100),
    });
  } catch (error: any) {
    console.error('Token optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize content' },
      { status: 500 }
    );
  }
}

