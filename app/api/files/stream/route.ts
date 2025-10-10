import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { safeResolve } from '@/lib/paths';
import { getMimeType } from '@/lib/mime';

export const dynamic = 'force-dynamic';

/**
 * Stream files with Range support for video/pdf previews
 * Security: validates path stays within data/attachments
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const relativePath = searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    // Security: Define base directory for attachments
    const baseDir = path.join(process.cwd(), 'data', 'attachments');

    // Security: Validate path stays within base directory
    const { safe, resolved } = safeResolve(baseDir, relativePath);

    if (!safe) {
      console.warn(`[security] Path traversal attempt blocked: ${relativePath}`);
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Check if file exists
    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(resolved);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const fileSize = stats.size;
    const filename = path.basename(resolved);
    const mimeType = getMimeType(filename);

    // Parse Range header for partial content support
    const rangeHeader = req.headers.get('range');

    if (rangeHeader) {
      // Parse range: "bytes=start-end"
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse('Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(resolved, { start, end });

      return new NextResponse(fileStream as any, {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `inline; filename="${filename}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Full file request (no Range header)
    const fileStream = fs.createReadStream(resolved);

    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[file-stream] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

