import { NextRequest, NextResponse } from 'next/server';
import { loadPrompt, PromptKind } from '@/core/ai/promptLoader';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/prompts/view?kind=analyze&version=v1
 * Returns the raw prompt content for viewing
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get('kind') as PromptKind;
    const version = searchParams.get('version') || 'v1';

    if (!kind) {
      return NextResponse.json({ error: 'Prompt kind is required' }, { status: 400 });
    }

    const validKinds: PromptKind[] = ['analyze', 'compare', 'improve', 'skillpath', 'persona', 'company', 'people', 'ecosystem', 'match-signals', 'matchScore'];
    if (!validKinds.includes(kind)) {
      return NextResponse.json({ error: 'Invalid prompt kind' }, { status: 400 });
    }

    const content = await loadPrompt(kind, version);

    return NextResponse.json({
      kind,
      version,
      content,
      note: 'Template placeholders like {{jobDescription}} will be replaced with actual data when the prompt is executed.',
    });
  } catch (error: any) {
    console.error('Error loading prompt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load prompt' },
      { status: 500 }
    );
  }
}

