import { NextResponse } from 'next/server';
import { extractFileContent } from '@/lib/fileContent';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter required' }, { status: 400 });
    }

    // Ensure path is within data/attachments
    const fullPath = path.join(process.cwd(), 'data', 'attachments', filePath);
    
    const result = await extractFileContent(fullPath);

    if (!result || !result.text) {
      return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
    }

    return NextResponse.json({
      text: result.text,
    });
  } catch (error: any) {
    console.error('File extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

