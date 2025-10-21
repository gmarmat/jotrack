// v2.7: Local text extraction from DOCX and PDF files
// Runs locally (no AI), fast and free

import mammoth from 'mammoth';
import { readFileSync } from 'fs';
import path from 'path';

// Dynamic import for pdf-parse to avoid Next.js webpack issues
let pdfParse: any = null;

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
 * Extract text from PDF file
 */
export async function extractFromPdf(filePath: string): Promise<ExtractionResult> {
  let parser: any = null;
  
  try {
    console.log(`🔍 PDF extraction starting for: ${filePath}`);
    
    // Dynamically import pdf-parse to avoid Next.js webpack issues
    if (!pdfParse) {
      console.log(`📦 Importing pdf-parse module...`);
      pdfParse = await import('pdf-parse');
      console.log(`✓ pdf-parse imported, keys:`, Object.keys(pdfParse));
    }
    
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    console.log(`📁 Reading file: ${absolutePath}`);
    const buffer = readFileSync(absolutePath);
    console.log(`✓ File read, size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // pdf-parse v2.x uses PDFParse class with { data: buffer }
    const PDFParseClass = pdfParse.PDFParse || pdfParse.default?.PDFParse;
    
    if (!PDFParseClass) {
      console.error(`❌ PDFParse class not found! Module keys:`, Object.keys(pdfParse));
      throw new Error('PDFParse class not found in pdf-parse module');
    }
    
    console.log(`✓ PDFParse class found, creating parser...`);
    
    // Create instance with buffer data
    parser = new PDFParseClass({ data: buffer });
    console.log(`✓ Parser created, extracting text...`);
    
    // Extract text using getText() method
    const result = await parser.getText();
    console.log(`✓ getText() completed, result type:`, typeof result);
    const text = result.text.trim();
    console.log(`✓ Text extracted, length: ${text.length} chars`);
    
    // Get page count
    const info = await parser.getInfo();
    const pageCount = info?.info?.pageCount || info?.numPages || 1;
    
    if (!text || text.length === 0) {
      return {
        success: false,
        text: '',
        error: 'PDF parsed but no text content found. File might be image-based or encrypted.',
      };
    }
    
    // Count words
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    return {
      success: true,
      text,
      metadata: {
        pageCount,
        wordCount,
        extractedAt: Date.now(),
      },
    };
  } catch (error: any) {
    console.error('❌ PDF extraction failed:', error);
    
    // Return more helpful error message
    let errorMsg = 'Failed to extract text from PDF';
    if (error.message?.includes('defineProperty')) {
      errorMsg = 'PDF parsing failed (corrupted or image-based PDF). Try converting to .docx or .txt format.';
    } else if (error.message?.includes('encrypted')) {
      errorMsg = 'PDF is password-protected. Please remove encryption first.';
    } else if (error.message) {
      errorMsg = `PDF extraction error: ${error.message}`;
    }
    
    return {
      success: false,
      text: '',
      error: errorMsg,
    };
  } finally {
    // Clean up parser resources
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
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

