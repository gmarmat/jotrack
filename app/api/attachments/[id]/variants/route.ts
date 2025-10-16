import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { artifactVariants } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachmentId = params.id;
    
    // Fetch all active variants for this attachment
    const variants = await db
      .select()
      .from(artifactVariants)
      .where(
        and(
          eq(artifactVariants.sourceId, attachmentId),
          eq(artifactVariants.isActive, true)
        )
      )
      .orderBy(artifactVariants.createdAt);
    
    // Transform to client format
    const formatted = variants.map(v => ({
      variantType: v.variantType,
      content: typeof v.content === 'string' ? JSON.parse(v.content) : v.content,
      tokenCount: v.tokenCount,
      createdAt: v.createdAt,
      contentHash: v.contentHash,
    }));
    
    return NextResponse.json({
      success: true,
      variants: formatted,
    });
  } catch (error: any) {
    console.error('Failed to fetch variants:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

