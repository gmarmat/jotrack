import { NextRequest, NextResponse } from 'next/server';
import { execFile } from "child_process";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

function run(cmd: string, args: string[]) {
  return new Promise<void>((res, rej) => execFile(cmd, args, (e) => e ? rej(e) : res()));
}

export async function GET(req: NextRequest) {
  if (process.env.JOTRACK_ENABLE_CONVERTER !== "1") {
    return NextResponse.json({ error: "converter disabled" }, { status: 501 });
  }

  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json({ error: "missing path" }, { status: 400 });
    }

    const tmp = await mkdtemp(join(tmpdir(), "jotrack-"));
    try {
      // headless convert to PDF next to tmp; soffice must be on PATH
      await run("soffice", ["--headless", "--nologo", "--nolockcheck", "--convert-to", "pdf", "--outdir", tmp, path]);
      const out = join(tmp, path.split("/").pop()!.replace(/\.[^.]+$/, "") + ".pdf");

      // Return path for streaming
      return NextResponse.json({ pdfPath: out });
    } finally {
      // Schedule cleanup
      setTimeout(() => rm(tmp, { recursive: true, force: true }).catch(() => {}), 60_000);
    }
  } catch (error: any) {
    console.error('PDF conversion error:', error);
    return NextResponse.json(
      { error: `convert fail: ${error?.message ?? error}` },
      { status: 500 }
    );
  }
}

