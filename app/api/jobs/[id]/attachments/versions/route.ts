import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { attachments, artifactVariants, type AttachmentKind } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const kind = req.nextUrl.searchParams.get('kind') as AttachmentKind | null;

    if (!kind) {
      return NextResponse.json({ error: 'Missing kind parameter' }, { status: 400 });
    }

    const versions = await db
      .select({
        id: attachments.id,
        filename: attachments.filename,
        path: attachments.path,
        size: attachments.size,
        version: attachments.version,
        isActive: attachments.isActive,
        createdAt: attachments.createdAt,
        deletedAt: attachments.deletedAt,
        kind: attachments.kind,
      })
      .from(attachments)
      .where(
        and(
          eq(attachments.jobId, jobId),
          eq(attachments.kind, kind),
          isNull(attachments.deletedAt)
        )
      )
      .orderBy(desc(attachments.createdAt));

    // Map kind to sourceType for variant lookup
    const sourceType = kind === 'resume' ? 'resume' : 
                      kind === 'jd' ? 'job_description' : 
                      kind === 'cover_letter' ? 'cover_letter' : 'attachment';

    // Fetch variants for each version
    const versionsWithVariants = await Promise.all(
      versions.map(async (version) => {
        const variants = await db
          .select({
            variantType: artifactVariants.variantType,
            content: artifactVariants.content,
            contentHash: artifactVariants.contentHash,
            tokenCount: artifactVariants.tokenCount,
            createdAt: artifactVariants.createdAt,
          })
          .from(artifactVariants)
          .where(
            and(
              eq(artifactVariants.sourceId, version.id),
              eq(artifactVariants.sourceType, sourceType),
              eq(artifactVariants.isActive, true)
            )
          );

        // Transform variants to the expected format
        const variantMap: Record<string, any> = {};
        variants.forEach(variant => {
          const content = typeof variant.content === 'string' 
            ? JSON.parse(variant.content) 
            : variant.content;
          
          // Map variant types to expected keys
          if (variant.variantType === 'ai_optimized') {
            variantMap.normalized = {
              path: content.path || content.filePath,
              content: content.content || content.text,
              tokenCount: variant.tokenCount,
              createdAt: variant.createdAt
            };
          } else if (variant.variantType === 'raw') {
            variantMap.raw = {
              path: content.path || content.filePath,
              content: content.content || content.text,
              tokenCount: variant.tokenCount,
              createdAt: variant.createdAt
            };
          } else if (variant.variantType === 'detailed') {
            variantMap.detailed = {
              path: content.path || content.filePath,
              content: content.content || content.text,
              tokenCount: variant.tokenCount,
              createdAt: variant.createdAt
            };
          }
        });

        return {
          ...version,
          variants: variantMap
        };
      })
    );

    return NextResponse.json({ versions: versionsWithVariants });
  } catch (error) {
    console.error('GET /api/jobs/[id]/attachments/versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
