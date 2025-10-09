import { NextRequest, NextResponse } from 'next/server';
import { getJobStatusHistory } from '@/db/repository';

export function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const history = getJobStatusHistory(params.id);
    
    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching job history:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

