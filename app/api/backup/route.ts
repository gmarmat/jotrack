import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { createReadStream, promises as fs } from 'fs';
import { BACKUPS_DIR, createBackupZip, timestampName } from '@/lib/backup';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const name = `jotrack-backup-${timestampName()}.zip`;
    const absPath = path.join(BACKUPS_DIR, name);

    // create (and save) the ZIP on disk
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
    const { zipPath, size } = await createBackupZip(absPath);

    // stream it to the client
    const stream = createReadStream(zipPath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Length', String(size));
    headers.set('Content-Disposition', `attachment; filename="${name}"`);

    return new NextResponse(stream as any, { headers });
  } catch (err) {
    console.error('GET /api/backup error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

