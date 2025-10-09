import { NextRequest, NextResponse } from 'next/server';
import { saveUploadZip, extractToStaging, buildRestorePlan, savePlan } from '@/lib/restore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
    }

    // Save uploaded zip
    const { savedPath } = await saveUploadZip(file as File);

    // Extract to staging
    const { stagingId, stagingPath } = await extractToStaging(savedPath);

    // Build plan
    const plan = await buildRestorePlan(stagingPath);
    const fullPlan = { ...plan, zipSavedPath: savedPath };
    await savePlan(stagingPath, fullPlan);

    // Return concise summary (do not modify live data yet)
    return NextResponse.json({
      stagingId,
      zipSavedPath: savedPath,
      stagingPath,
      dbFiles: plan.dbFiles.map(({ src, dest }) => ({ src, dest })),
      attachments: plan.attachments
        ? { srcDir: plan.attachments.srcDir, destDir: plan.attachments.destDir }
        : null,
      next: 'Stop dev server, then apply in next step (2.3c).',
    });
  } catch (err) {
    console.error('POST /api/restore error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

