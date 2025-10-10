import { NextRequest } from "next/server";
import { extractFileContent, compareFiles, extractKeywords } from "@/lib/fileContent";

/**
 * Example Analysis API
 * 
 * Demonstrates CORRECT usage of analysis layer (not preview layer)
 * 
 * DO:
 * - Use lib/fileContent.ts for raw content extraction
 * - Process text without HTML/styling
 * - Return analysis results based on raw content
 * 
 * DON'T:
 * - Import from app/components/preview/*
 * - Use convertToHtml for analysis
 * - Process styled/formatted content
 */

export async function POST(req: NextRequest) {
  try {
    const { action, filePath, filePath2 } = await req.json();

    switch (action) {
      case "extract": {
        // Extract raw content for analysis
        const content = await extractFileContent(filePath);
        
        return Response.json({
          ok: true,
          text: content.text,
          wordCount: content.metadata?.wordCount,
          pageCount: content.metadata?.pageCount,
          note: "Raw text extracted - no HTML/styling",
        });
      }

      case "compare": {
        // Compare two files (e.g., resume v1 vs v2)
        if (!filePath2) {
          return Response.json({ error: "filePath2 required for compare" }, { status: 400 });
        }
        
        const comparison = await compareFiles(filePath, filePath2);
        
        return Response.json({
          ok: true,
          similarity: comparison.similarity,
          commonWords: comparison.commonWords,
          uniqueToFirst: comparison.uniqueToFirst,
          uniqueToSecond: comparison.uniqueToSecond,
          note: "Comparison based on raw text, not preview HTML",
        });
      }

      case "keywords": {
        // Extract keywords for skill matching
        const keywords = await extractKeywords(filePath);
        
        return Response.json({
          ok: true,
          keywords: keywords.slice(0, 20),
          note: "Keywords extracted from raw text",
        });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Analysis API error:", error);
    return Response.json(
      { 
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/* Example usage from frontend:

// CORRECT - Extract for analysis
const response = await fetch('/api/analyze/example', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'extract',
    filePath: 'data/attachments/job-id/resume.docx'
  })
});
const { text, wordCount } = await response.json();
// text is raw, ready for AI processing


// WRONG - Don't use preview components for analysis
import DocxViewer from '@/app/components/preview/DocxViewer';
// This gives you styled HTML, not raw content!

*/

