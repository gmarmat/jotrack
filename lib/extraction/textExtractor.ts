// v2.7: Local text extraction from DOCX and PDF files
// Runs locally (no AI), fast and free

import mammoth from 'mammoth';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

export interface ExtractionResult {
  success: boolean;
  text: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    extractedAt: number;
  };
}

/**
 * Extract text from DOCX file
 */
export async function extractFromDocx(filePath: string): Promise<ExtractionResult> {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    const buffer = readFileSync(absolutePath);
    
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    
    // Count words
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    return {
      success: true,
      text,
      metadata: {
        wordCount,
        extractedAt: Date.now(),
      },
    };
  } catch (error: any) {
    console.error('❌ DOCX extraction failed:', error);
    return {
      success: false,
      text: '',
      error: error.message || 'Failed to extract text from DOCX',
    };
  }
}

/**
 * Extract text from PDF file using pdfjs-dist (Mozilla PDF.js)
 */
export async function extractFromPdf(filePath: string): Promise<ExtractionResult> {
  try {
    console.log(`🔍 PDF extraction starting for: ${filePath}`);
    
    // Dynamic import to avoid Next.js build issues
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    console.log(`📁 Reading file: ${absolutePath}`);
    const buffer = readFileSync(absolutePath);
    console.log(`✓ File read, size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
    });
    
    const pdf = await loadingTask.promise;
    console.log(`✓ PDF loaded: ${pdf.numPages} pages`);
    
    // Extract text from all pages
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    const text = fullText.trim();
    console.log(`✓ Extracted ${text.length} characters from ${pdf.numPages} pages`);
    
    if (!text || text.length === 0) {
      return {
        success: false,
        text: '',
        error: 'PDF parsed but no text content found. File might be image-based or encrypted.',
      };
    }
    
    // Count words
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`✅ PDF extraction complete: ${wordCount} words from ${pdf.numPages} pages`);
    
    return {
      success: true,
      text,
      metadata: {
        pageCount: pdf.numPages,
        wordCount,
        extractedAt: Date.now(),
      },
    };
    
  } catch (error: any) {
    console.error('❌ PDF extraction failed:', error);
    
    // Return more helpful error message
    let errorMsg = 'Failed to extract text from PDF';
    if (error.message?.includes('encrypted')) {
      errorMsg = 'PDF is password-protected. Please remove encryption first.';
    } else if (error.message?.includes('Invalid PDF')) {
      errorMsg = 'PDF file is corrupted or invalid. Try re-saving or converting to .docx';
    } else if (error.message) {
      errorMsg = `PDF extraction error: ${error.message}`;
    }
    
    return {
      success: false,
      text: '',
      error: errorMsg,
    };
  }
}

/**
 * Extract text from file based on extension
 */
export async function extractText(filePath: string): Promise<ExtractionResult> {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.docx':
      return extractFromDocx(filePath);
    case '.pdf':
      return extractFromPdf(filePath);
    case '.txt':
      // Plain text - just read it
      try {
        const text = readFileSync(filePath, 'utf-8').trim();
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        return {
          success: true,
          text,
          metadata: {
            wordCount,
            extractedAt: Date.now(),
          },
        };
      } catch (error: any) {
        return {
          success: false,
          text: '',
          error: error.message || 'Failed to read text file',
        };
      }
    default:
      return {
        success: false,
        text: '',
        error: `Unsupported file type: ${ext}`,
      };
  }
}

/**
 * Quick check if file type is supported for text extraction
 */
export function isTextExtractable(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.docx', '.pdf', '.txt'].includes(ext);
}

