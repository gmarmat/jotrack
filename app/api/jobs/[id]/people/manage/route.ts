import { NextRequest, NextResponse } from 'next/server';
import { 
  getPeopleForJob, 
  savePersonAndLink, 
  unlinkPersonFromJob 
} from '@/db/peopleRepository';

/**
 * GET - Load all people linked to this job
 * Returns joined data from peopleProfiles + jobPeopleRefs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    
    console.log(`📋 Loading people for job ${jobId}...`);
    
    const people = await getPeopleForJob(jobId);
    
    console.log(`✅ Found ${people.length} people linked to job`);
    
    return NextResponse.json({
      success: true,
      people,
    });
  } catch (error: any) {
    console.error('❌ GET /people/manage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load people' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add new person and link to job
 * Body: { name, title, linkedinUrl, relType }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { name, title, linkedinUrl, relType } = body;
    
    if (!name || !relType) {
      return NextResponse.json(
        { error: 'Name and relType are required' },
        { status: 400 }
      );
    }
    
    if (!['recruiter', 'hiring_manager', 'peer', 'other'].includes(relType)) {
      return NextResponse.json(
        { error: 'Invalid relType. Must be: recruiter, hiring_manager, peer, or other' },
        { status: 400 }
      );
    }
    
    console.log(`💾 Saving person ${name} for job ${jobId} as ${relType}...`);
    
    const personId = await savePersonAndLink(
      jobId,
      { name, title, linkedinUrl },
      relType
    );
    
    console.log(`✅ Person saved with ID: ${personId}`);
    
    return NextResponse.json({
      success: true,
      personId,
    });
  } catch (error: any) {
    console.error('❌ POST /people/manage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save person' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Unlink person from job
 * Body: { personId }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { personId } = body;
    
    if (!personId) {
      return NextResponse.json(
        { error: 'personId is required' },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Unlinking person ${personId} from job ${jobId}...`);
    
    await unlinkPersonFromJob(jobId, personId);
    
    console.log(`✅ Person unlinked successfully`);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('❌ DELETE /people/manage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlink person' },
      { status: 500 }
    );
  }
}

