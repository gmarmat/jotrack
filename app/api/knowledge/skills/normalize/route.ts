import { NextRequest, NextResponse } from 'next/server';
import { normalizeSkills } from '@/db/coachRepository';

/**
 * POST /api/knowledge/skills/normalize
 * Normalizes skill labels to taxonomy IDs, creating new entries if needed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skills } = body;

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'skills must be an array' },
        { status: 400 }
      );
    }

    const normalized = await normalizeSkills(skills);
    return NextResponse.json({ skills: normalized });
  } catch (error) {
    console.error('Error normalizing skills:', error);
    return NextResponse.json(
      { error: 'Failed to normalize skills' },
      { status: 500 }
    );
  }
}

