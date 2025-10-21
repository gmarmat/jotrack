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
 * Extract text from PDF file using child process
 * Spawns standalone Node.js script to bypass Next.js webpack issues
 * 
 * Why: pdf-parse and pdfjs-dist break in Next.js server-side bundling
 * Solution: Run extraction in pure Node.js context via child process
 */
export async function extractFromPdf(filePath: string): Promise<ExtractionResult> {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf-standalone.js');
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    
    console.log(`📄 Spawning PDF extraction process for: ${path.basename(filePath)}`);
    
    const result = await new Promise<{success: boolean, text?: string, error?: string, metadata?: any}>((resolve, reject) => {
      const child = spawn('node', [scriptPath, absolutePath], {
        timeout: 30000,  // 30 second timeout
        maxBuffer: 10 * 1024 * 1024,  // 10MB max output
        env: { ...process.env, NODE_ENV: 'production' }  // Ensure clean environment
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        const msg = data.toString();
        // Log errors, but extraction info goes to stderr too
        if (!msg.includes('[PDF Extractor]')) {
          errorOutput += msg;
        } else {
          console.log(msg.trim());  // Pass through extraction logs
        }
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          try {
            const parsed = JSON.parse(output);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse extraction output: ${output.substring(0, 200)}`));
          }
        } else {
          reject(new Error(`Extraction process failed (code ${code}): ${errorOutput || 'Unknown error'}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`Failed to spawn extraction process: ${error.message}`));
      });
    });
    
    if (!result.success) {
      console.error(`❌ PDF extraction failed: ${result.error}`);
      return {
        success: false,
        text: '',
        error: result.error || 'PDF extraction failed'
      };
    }
    
    const text = result.text?.trim() || '';
    
    if (!text || text.length === 0) {
      return {
        success: false,
        text: '',
        error: '🖼️ PDF parsed but contains no text. File may be image-based (scanned). Try converting to .docx',
      };
    }
    
    console.log(`✅ PDF extracted successfully: ${text.length} chars, ${result.metadata?.wordCount || 0} words`);
    
    return {
      success: true,
      text,
      metadata: result.metadata || {
        wordCount: text.split(/\s+/).filter(Boolean).length,
        extractedAt: Date.now()
      }
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

