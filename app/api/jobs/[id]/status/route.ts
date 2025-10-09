import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateJobStatus } from '@/db/repository';

const updateStatusSchema = z.object({
  status: z.enum(['Applied', 'Phone Screen', 'Onsite', 'Offer', 'Rejected']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);
    
    const job = updateJobStatus(params.id, validatedData.status);
    
    if (!job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

