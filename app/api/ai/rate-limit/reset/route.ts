import { NextRequest, NextResponse } from 'next/server';
import { resetRateLimit, getIdentifier } from '@/lib/coach/rateLimiter';

export const dynamic = 'force-dynamic';

/**
 * Reset rate limiter for debugging/testing
 * In production, you might want to add authentication here
 */
export async function POST(request: NextRequest) {
  try {
    const identifier = getIdentifier(request);
    resetRateLimit(identifier);
    
    return NextResponse.json({
      success: true,
      message: 'Rate limit reset successfully',
      identifier,
    });
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to reset rate limit' },
      { status: 500 }
    );
  }
}
