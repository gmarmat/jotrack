import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { db } from '@/db/client';
import { attachments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid attachment id'),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: attachmentId } = paramsSchema.parse(params);

    // Get attachment info
    const attachment = await db.query.attachments.findFirst({
      where: (a, { eq }) => eq(a.id, attachmentId),
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), attachment.path);
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(attachment.filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.md':
        contentType = 'text/markdown';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    // Set headers for inline display (not download)
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // For PDFs and images, allow inline display
    if (contentType.startsWith('image/') || contentType === 'application/pdf') {
      headers.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
    }

    return new NextResponse(fileBuffer.buffer as ArrayBuffer, { headers });
  } catch (err) {
    console.error('GET /files/preview error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
