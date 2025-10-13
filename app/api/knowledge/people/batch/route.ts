import { NextRequest, NextResponse } from 'next/server';
import { batchUpsertPeople } from '@/db/coachRepository';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/knowledge/people/batch
 * Batch upsert people profiles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profiles } = body;

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: 'Invalid profiles array' },
        { status: 400 }
      );
    }

    const peopleData = profiles.map((p: any) => ({
      id: p.id || uuidv4(),
      name: p.name,
      title: p.title || null,
      companyId: p.companyId || null,
      linkedinUrl: p.linkedinUrl || null,
      location: p.location || null,
      tenureMonths: p.tenureMonths || null,
      techDepth: p.techDepth || null,
      summary: p.summary || null,
      updatedAt: Date.now(),
    }));

    const people = await batchUpsertPeople(peopleData);
    return NextResponse.json({ people });
  } catch (error) {
    console.error('Error batch upserting people:', error);
    return NextResponse.json(
      { error: 'Failed to batch upsert people' },
      { status: 500 }
    );
  }
}

