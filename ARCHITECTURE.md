# JoTrack Architecture

## File Handling - Dual Layer Pattern

### Critical Separation: Preview vs Analysis

JoTrack maintains a strict separation between file presentation and file processing:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER UPLOADS FILE                         │
│                  (stored in data/attachments/)               │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ PREVIEW      │          │ ANALYSIS     │
│ LAYER        │          │ LAYER        │
└──────────────┘          └──────────────┘
```

### Preview Layer (Human Viewing)

**Purpose:** Beautiful, readable presentation for users  
**Location:** `app/components/preview/*`, `app/components/AttachmentViewerModal.tsx`  
**Characteristics:**
- Styled HTML output (typography, colors, spacing)
- Sanitized for security (DOMPurify)
- Simplified content (RTF control codes stripped)
- Responsive design
- Zoom/pan controls
- May lose some metadata/formatting

**Files:**
- `app/components/preview/PdfViewer.tsx` - Native browser PDF embed
- `app/components/preview/DocxViewer.tsx` - Mammoth HTML conversion
- `app/components/AttachmentViewerModal.tsx` - Modal with prose styling

**DO NOT USE FOR:**
- ❌ AI analysis
- ❌ Content comparison
- ❌ Keyword extraction
- ❌ Resume parsing
- ❌ Any algorithmic processing

### Analysis Layer (Machine Processing)

**Purpose:** Accurate, raw content extraction for algorithms  
**Location:** `lib/fileContent.ts`  
**Characteristics:**
- Raw text extraction (no HTML)
- Preserves all content
- Uses `mammoth.extractRawText()` (not `convertToHtml()`)
- No styling/formatting
- Returns plain text + metadata
- Deterministic output

**Functions:**
- `extractDocxText()` - Raw text from DOCX
- `extractRtfText()` - Stripped RTF text
- `extractPdfText()` - Text from PDF (pdf-parse)
- `extractPlainText()` - Plain text files
- `extractFileContent()` - Universal extractor
- `compareFiles()` - Content comparison
- `extractKeywords()` - Keyword extraction

**ALWAYS USE FOR:**
- ✅ AI analysis (resume scoring, JD matching)
- ✅ Content comparison/diff
- ✅ Keyword/skill extraction
- ✅ Resume parsing
- ✅ Text search/indexing
- ✅ Any feature that processes content

## Example Usage

### ❌ WRONG - Using Preview for Analysis
```typescript
// DON'T DO THIS
import DocxViewer from "@/app/components/preview/DocxViewer";

async function analyzeResume(path: string) {
  // This gets styled HTML, not raw content!
  const html = await convertToHtml(path); 
  const analysis = aiAnalyze(html); // WRONG - analyzing HTML with CSS classes
}
```

### ✅ CORRECT - Using Analysis Layer
```typescript
// DO THIS
import { extractFileContent } from "@/lib/fileContent";

async function analyzeResume(path: string) {
  // Gets raw text, perfect for analysis
  const { text, metadata } = await extractFileContent(path);
  const analysis = aiAnalyze(text); // CORRECT - raw content
}
```

## API Pattern for Analysis Features

```typescript
// app/api/analyze/resume/route.ts
import { extractFileContent } from "@/lib/fileContent";

export async function POST(req: Request) {
  const { filePath } = await req.json();
  
  // Extract raw content (not preview HTML)
  const content = await extractFileContent(filePath);
  
  // Perform analysis on raw text
  const analysis = {
    keywords: extractKeywords(content.text),
    score: calculateScore(content.text),
    // ... more analysis
  };
  
  return Response.json(analysis);
}
```

## Testing Requirements

All analysis features MUST have tests that verify:
1. Raw content extraction (not HTML)
2. No CSS/styling in extracted text
3. Preservation of important metadata
4. Comparison between raw vs preview output

## Dependencies

### Preview Layer
- `mammoth/mammoth.browser` (client-side, HTML output)
- `DOMPurify` (sanitization)
- `marked` (markdown to HTML)
- Tailwind prose classes

### Analysis Layer
- `mammoth` (server-side, raw text extraction)
- `pdf-parse` (server-side PDF text extraction)
- Node.js `fs` module
- No styling dependencies

## Migration Guide

When adding new analysis features:

1. ✅ Create API route in `app/api/analyze/*`
2. ✅ Import from `lib/fileContent.ts` (not preview components)
3. ✅ Use `extractFileContent()` or specific extractors
4. ✅ Process `content.text` (raw string)
5. ✅ Add unit tests verifying raw extraction
6. ✅ Document in this file

## Future Features

### Planned Analysis Features (use Analysis Layer)
- Resume vs JD matching
- Resume diff/comparison between versions
- Keyword/skill extraction
- AI-powered feedback
- Content similarity scoring
- Duplicate detection

### Planned Preview Features (use Preview Layer)
- Side-by-side diff visualization
- Syntax highlighting
- Interactive annotations
- Print layouts

---

**Last Updated:** 2025-10-10  
**Version:** 0.5-M6  
**Enforcement:** Mandatory for all analysis features

