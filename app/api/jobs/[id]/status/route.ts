import { NextRequest, NextResponse } from 'next/server';
import { isJobStatus, type JobStatus } from '@/lib/status';
import { updateJobStatus } from '@/db/repository';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const nextStatus = String(body?.status ?? '');
    
    if (!isJobStatus(nextStatus)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    const job = updateJobStatus(params.id, nextStatus);
    
    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

