import { NextRequest, NextResponse } from 'next/server';
import { getLatestAttachment } from '@/db/repository';
import { evaluateSignalsForJob } from '@/lib/evaluateSignals';
import { getEvaluationWithTrends } from '@/db/signalRepository';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    
    // Get latest versions if not specified
    const jdAttachment = getLatestAttachment(jobId, 'jd');
    const resumeAttachment = getLatestAttachment(jobId, 'resume');

    if (!jdAttachment) {
      return NextResponse.json({ error: 'No Job Description found' }, { status: 400 });
    }

    if (!resumeAttachment) {
      return NextResponse.json({ error: 'No Resume found' }, { status: 400 });
    }

    const jdVersion = body.jdVersion || jdAttachment.version;
    const resumeVersion = body.resumeVersion || resumeAttachment.version;

    // Run the evaluation
    await evaluateSignalsForJob(jobId, jdVersion, resumeVersion);

    // Fetch results with trends
    const evaluations = getEvaluationWithTrends(jobId, resumeVersion, jdVersion);

    return NextResponse.json({
      success: true,
      jobId,
      jdVersion,
      resumeVersion,
      evaluations,
      message: `Evaluated ${evaluations.length} signals`
    });

  } catch (error: any) {
    console.error('Signal evaluation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate signals' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const { searchParams } = new URL(request.url);
    
    const resumeVersion = searchParams.get('resumeVersion') 
      ? parseInt(searchParams.get('resumeVersion')!) 
      : undefined;
    
    const jdVersion = searchParams.get('jdVersion')
      ? parseInt(searchParams.get('jdVersion')!)
      : undefined;

    let evaluations;
    
    if (resumeVersion !== undefined && jdVersion !== undefined) {
      evaluations = getEvaluationWithTrends(jobId, resumeVersion, jdVersion);
    } else {
      // Get latest attachment versions
      const jdAttachment = getLatestAttachment(jobId, 'jd');
      const resumeAttachment = getLatestAttachment(jobId, 'resume');
      
      if (jdAttachment && resumeAttachment) {
        evaluations = getEvaluationWithTrends(jobId, resumeAttachment.version, jdAttachment.version);
      } else {
        evaluations = [];
      }
    }

    return NextResponse.json({
      jobId,
      evaluations,
      count: evaluations.length
    });

  } catch (error: any) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

