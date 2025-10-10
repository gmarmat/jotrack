import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

function stripRtf(rt: string) {
  // minimal, safe-ish extraction
  return rt
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\'[0-9a-fA-F]{2}/g, (m) => decodeURIComponent('%' + m.slice(2)))
    .replace(/\\[a-z]+-?\d* ?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path");
    if (!path) {
      return NextResponse.json({ error: "missing path" }, { status: 400 });
    }

    const rt = await readFile(path, "utf8");
    const text = stripRtf(rt).trim();
    const html = `<pre style="white-space:pre-wrap">${escapeHtml(text)}</pre>`;

    return NextResponse.json({ html });
  } catch (error) {
    console.error('RTF conversion error:', error);
    return NextResponse.json({ error: "Failed to convert RTF" }, { status: 500 });
  }
}

