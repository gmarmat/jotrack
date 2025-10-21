// v2.7: Local text extraction from DOCX and PDF files
// Runs locally (no AI), fast and free

import mammoth from 'mammoth';
import { readFileSync } from 'fs';
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
 * Extract text from PDF file using pdfjs-dist directly
 * Bypasses pdf-parse to avoid Next.js webpack issues
 */
export async function extractFromPdf(filePath: string): Promise<ExtractionResult> {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    const buffer = readFileSync(absolutePath);
    
    console.log(`📄 PDF file read: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // Import pdfjs-dist directly (Mozilla's PDF.js library)
    // This is what pdf-parse uses internally, but we bypass the problematic wrapper
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // Disable worker for Node.js environment (workers don't work in server-side)
    pdfjsLib.GlobalWorkerOptions.workerSrc = false;
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(buffer),
      useWorkerFetch: false,  // Disable worker fetch
      isEvalSupported: false,  // Disable eval
      useSystemFonts: false,   // Don't need fonts for text extraction
    });
    const pdf = await loadingTask.promise;
    
    console.log(`📖 PDF loaded: ${pdf.numPages} pages`);
    
    // Extract text from each page
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Join all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    const text = fullText.trim();
    
    console.log(`✅ PDF extracted: ${text.length} chars, ${pdf.numPages} pages`);
    
    if (!text || text.length === 0) {
      return {
        success: false,
        text: '',
        error: '🖼️ PDF parsed but contains no text. File may be image-based (scanned). Use OCR or convert to .docx',
      };
    }
    
    // Count words
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
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
    console.error('   Error details:', {
      name: error.constructor?.name,
      message: error.message,
      code: error.code,
      path: error.path
    });
    
    // Provide helpful, specific error messages
    let errorMsg = 'Failed to extract text from PDF';
    
    if (error.message?.includes('encrypted') || error.message?.includes('password')) {
      errorMsg = '🔒 PDF is password-protected. Remove password using Adobe/Preview and re-upload.';
    } else if (error.message?.includes('ENOENT') || error.message?.includes('no such file')) {
      errorMsg = '📁 PDF file not found. Try re-uploading the file.';
    } else if (error.message?.includes('defineProperty') || error.message?.includes('test/data')) {
      errorMsg = '🖼️ Cannot extract text from this PDF (likely image-based/scanned). Convert to .docx or .txt and re-upload.';
    } else if (!error.message || error.message.includes('Failed to extract')) {
      errorMsg = '⚠️ PDF extraction failed. For best results, upload as .docx or .txt format.';
    } else {
      errorMsg = `PDF error: ${error.message}. Try .docx or .txt format instead.`;
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

