import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const PROMPTS_DIR = path.join(process.cwd(), 'core/ai/prompts');
const ALLOWED_KINDS = ['analyze', 'compare', 'improve', 'skillpath', 'persona'];

/**
 * GET /api/admin/prompts?kind=analyze&version=v1
 * Load a prompt template
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kind = searchParams.get('kind');
    const version = searchParams.get('version') || 'v1';

    if (!kind || !ALLOWED_KINDS.includes(kind)) {
      return NextResponse.json(
        { error: `Invalid kind. Must be one of: ${ALLOWED_KINDS.join(', ')}` },
        { status: 400 }
      );
    }

    const filename = `${kind}.${version}.md`;
    const filepath = path.join(PROMPTS_DIR, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return NextResponse.json({
        kind,
        version,
        content,
        filename,
      });
    } catch (error) {
      return NextResponse.json(
        { error: `Prompt not found: ${filename}` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error loading prompt:', error);
    return NextResponse.json(
      { error: 'Failed to load prompt' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prompts
 * Save a prompt template (creates new version)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kind, version, content } = body;

    if (!kind || !ALLOWED_KINDS.includes(kind)) {
      return NextResponse.json(
        { error: `Invalid kind. Must be one of: ${ALLOWED_KINDS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!version || !version.match(/^v\d+[a-z]?$/)) {
      return NextResponse.json(
        { error: 'Version must match pattern: v1, v1a, v2, etc.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    const filename = `${kind}.${version}.md`;
    const filepath = path.join(PROMPTS_DIR, filename);

    // Check if file already exists
    try {
      await fs.access(filepath);
      return NextResponse.json(
        { error: `Version ${version} already exists. Create a new version (e.g., ${incrementVersion(version)})` },
        { status: 409 }
      );
    } catch {
      // File doesn't exist, we can create it
    }

    // Write the file
    await fs.writeFile(filepath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      kind,
      version,
      filename,
      message: `Prompt saved as ${filename}`,
    });
  } catch (error) {
    console.error('Error saving prompt:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Increment version (v1 -> v1a, v1a -> v1b, v2 -> v2a)
 */
function incrementVersion(version: string): string {
  const match = version.match(/^v(\d+)([a-z]?)$/);
  if (!match) return 'v1a';

  const num = match[1];
  const letter = match[2];

  if (!letter) {
    return `v${num}a`;
  }

  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
  return `v${num}${nextLetter}`;
}

