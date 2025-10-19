import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

/**
 * PUT - Update person's role/relationship type
 * Body: { personId, relType }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { personId, relType } = await request.json();
    
    if (!personId || !relType) {
      return NextResponse.json(
        { error: 'personId and relType required' },
        { status: 400 }
      );
    }

    // Validate relType
    const validRoles = ['recruiter', 'hiring_manager', 'peer', 'other'];
    if (!validRoles.includes(relType)) {
      return NextResponse.json(
        { error: 'Invalid relType. Must be: recruiter, hiring_manager, peer, or other' },
        { status: 400 }
      );
    }

    console.log(`📝 Updating role for person ${personId} to ${relType}...`);
    
    const result = sqlite.prepare(`
      UPDATE job_people_refs 
      SET rel_type = ?
      WHERE person_id = ? AND job_id = ?
    `).run(relType, personId, params.id);
    
    console.log(`✅ Role updated for person ${personId}:`, {
      changes: result.changes,
      newRole: relType
    });

    return NextResponse.json({
      success: true,
      changes: result.changes
    });
  } catch (error: any) {
    console.error('❌ PUT /people/update-role error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}
