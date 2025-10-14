import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind');

    if (!kind) {
      return NextResponse.json({ error: 'Prompt kind required' }, { status: 400 });
    }

    // Look in both prompts/ and core/ai/prompts/ directories
    const promptDirs = [
      path.join(process.cwd(), 'prompts'),
      path.join(process.cwd(), 'core', 'ai', 'prompts')
    ];

    const versions = [];

    for (const dir of promptDirs) {
      try {
        const files = await fs.readdir(dir);
        const promptFiles = files.filter(f => f.startsWith(`${kind}.`) && f.endsWith('.md'));

        for (const file of promptFiles) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          const versionMatch = file.match(/\.v(\d+)\.md$/);
          const version = versionMatch ? `v${versionMatch[1]}` : 'v1';

          versions.push({
            version,
            filePath,
            createdAt: stats.mtime.toISOString(),
            createdBy: 'System',
            isActive: version === 'v1'
          });
        }
      } catch (err) {
        // Directory doesn't exist or can't be read, skip it
        continue;
      }
    }

    // Sort by version number (descending)
    versions.sort((a, b) => {
      const aNum = parseInt(a.version.substring(1));
      const bNum = parseInt(b.version.substring(1));
      return bNum - aNum;
    });

    return NextResponse.json({ versions });
  } catch (error: any) {
    console.error('Error loading prompt versions:', error);
    return NextResponse.json(
      { error: 'Failed to load versions' },
      { status: 500 }
    );
  }
}

