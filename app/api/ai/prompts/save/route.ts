import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { kind, content, description, version } = await request.json();

    if (!kind || !content) {
      return NextResponse.json(
        { error: 'Kind and content required' },
        { status: 400 }
      );
    }

    // Determine which directory to use
    const promptDir = path.join(process.cwd(), 'prompts');
    
    // Ensure directory exists
    try {
      await fs.mkdir(promptDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Generate new version number
    const files = await fs.readdir(promptDir).catch(() => []);
    const existingVersions = files
      .filter(f => f.startsWith(`${kind}.v`) && f.endsWith('.md'))
      .map(f => {
        const match = f.match(/\.v(\d+)\.md$/);
        return match ? parseInt(match[1]) : 0;
      });

    const nextVersion = existingVersions.length > 0 
      ? Math.max(...existingVersions) + 1 
      : 1;

    const newFileName = `${kind}.v${nextVersion}.md`;
    const filePath = path.join(promptDir, newFileName);

    // Add metadata header
    const contentWithMetadata = `# ${kind.charAt(0).toUpperCase() + kind.slice(1)} Prompt v${nextVersion}
${description ? `\n<!-- ${description} -->\n` : ''}
${content}
`;

    await fs.writeFile(filePath, contentWithMetadata, 'utf-8');

    // Also update the current version file
    const currentFileName = `${kind}.${version}.md`;
    const currentFilePath = path.join(promptDir, currentFileName);
    await fs.writeFile(currentFilePath, contentWithMetadata, 'utf-8');

    return NextResponse.json({
      success: true,
      version: `v${nextVersion}`,
      message: 'Prompt saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving prompt:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    );
  }
}

