/**
 * File Content Extraction - For Analysis & Processing
 * 
 * CRITICAL: This module provides RAW file content for AI analysis, comparison, and processing.
 * DO NOT mix this with preview rendering logic.
 * 
 * Architecture:
 * - Preview Layer (components/preview/*): Styled HTML for human viewing
 * - Analysis Layer (this file): Raw text/data for algorithmic processing
 * 
 * All analysis features (diff, compare, AI) should use these utilities, NOT preview components.
 */

import * as mammoth from "mammoth";
import { readFile } from "fs/promises";
import path from "path";

export type FileContent = {
  text: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    encoding?: string;
  };
  raw?: string; // Original content before any transformations
};

/**
 * Extract raw text from DOCX for analysis
 * Uses mammoth's extractRawText (not convertToHtml)
 */
export async function extractDocxText(filePath: string): Promise<FileContent> {
  try {
    const absolutePath = path.join(process.cwd(), filePath);
    const buffer = await readFile(absolutePath);
    
    // Use extractRawText for analysis (no HTML, no styling)
    const result = await mammoth.extractRawText({ buffer });
    
    const text = result.value;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    return {
      text,
      metadata: {
        wordCount,
      },
      raw: text,
    };
  } catch (error) {
    console.error("Failed to extract DOCX text:", error);
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from RTF for analysis
 * Strips RTF control codes to get plain text
 */
export async function extractRtfText(filePath: string): Promise<FileContent> {
  try {
    const absolutePath = path.join(process.cwd(), filePath);
    const buffer = await readFile(absolutePath);
    
    // Try UTF-8, fallback to windows-1252
    let text = buffer.toString('utf8');
    
    // If too many replacement chars, try windows-1252
    if ((text.match(/\uFFFD/g) || []).length > 10) {
      text = buffer.toString('latin1');
    }
    
    const raw = text;
    
    // Strip RTF control sequences for analysis
    text = text
      .replace(/\{\\\*[^}]*\}/g, '') // Remove destinations
      .replace(/\\[a-zA-Z]+-?\d* ?/g, '') // Remove control words
      .replace(/\\par\b/g, '\n')
      .replace(/\\tab\b/g, '\t')
      .replace(/[{}]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    return {
      text,
      metadata: {
        wordCount,
        encoding: buffer.toString('utf8').includes('\uFFFD') ? 'latin1' : 'utf8',
      },
      raw,
    };
  } catch (error) {
    console.error("Failed to extract RTF text:", error);
    throw new Error(`RTF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PDF for analysis
 * Note: PDF text extraction requires pdf-parse package (install when needed)
 * For now, returns placeholder. Install with: npm install pdf-parse canvas
 */
export async function extractPdfText(filePath: string): Promise<FileContent> {
  // TODO: Install pdf-parse when implementing PDF analysis features
  // For now, return placeholder to avoid breaking builds
  console.warn("PDF text extraction not yet implemented - install pdf-parse when needed");
  
  return {
    text: "[PDF text extraction pending - will be implemented when analysis features are added]",
    metadata: {
      pageCount: 0,
      wordCount: 0,
    },
    raw: "",
  };
  
  /* Future implementation (uncomment when pdf-parse is installed):
  try {
    const absolutePath = path.join(process.cwd(), filePath);
    const buffer = await readFile(absolutePath);
    
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    
    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).filter(Boolean).length,
      },
      raw: data.text,
    };
  } catch (error) {
    console.error("Failed to extract PDF text:", error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  */
}

/**
 * Extract text from plain text files
 */
export async function extractPlainText(filePath: string): Promise<FileContent> {
  try {
    const absolutePath = path.join(process.cwd(), filePath);
    const buffer = await readFile(absolutePath);
    
    // Try UTF-8 first
    let text = buffer.toString('utf8');
    let encoding = 'utf8';
    
    // If too many replacement chars, try other encodings
    if ((text.match(/\uFFFD/g) || []).length > 10) {
      text = buffer.toString('latin1');
      encoding = 'latin1';
    }
    
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    return {
      text,
      metadata: {
        wordCount,
        encoding,
      },
      raw: text,
    };
  } catch (error) {
    console.error("Failed to extract plain text:", error);
    throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Universal file content extractor
 * Routes to appropriate extractor based on file extension
 */
export async function extractFileContent(filePath: string): Promise<FileContent> {
  const ext = filePath.toLowerCase().split('.').pop() || '';
  
  switch (ext) {
    case 'docx':
      return extractDocxText(filePath);
    case 'rtf':
      return extractRtfText(filePath);
    case 'pdf':
      return extractPdfText(filePath);
    case 'txt':
    case 'md':
      return extractPlainText(filePath);
    default:
      throw new Error(`Unsupported file type for content extraction: ${ext}`);
  }
}

/**
 * Compare two files and return similarity score
 * Uses raw text, not preview HTML
 */
export async function compareFiles(
  filePath1: string,
  filePath2: string
): Promise<{
  similarity: number;
  commonWords: string[];
  uniqueToFirst: string[];
  uniqueToSecond: string[];
}> {
  const content1 = await extractFileContent(filePath1);
  const content2 = await extractFileContent(filePath2);
  
  // Simple word-based comparison
  const words1 = new Set(
    content1.text.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  const words2 = new Set(
    content2.text.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  
  const common = Array.from(words1).filter(w => words2.has(w));
  const unique1 = Array.from(words1).filter(w => !words2.has(w));
  const unique2 = Array.from(words2).filter(w => !words1.has(w));
  
  const similarity = common.length / Math.max(words1.size, words2.size, 1);
  
  return {
    similarity,
    commonWords: common.slice(0, 20),
    uniqueToFirst: unique1.slice(0, 20),
    uniqueToSecond: unique2.slice(0, 20),
  };
}

/**
 * Extract keywords from file content
 * For resume analysis, skill extraction, etc.
 */
export async function extractKeywords(
  filePath: string,
  minWordLength: number = 4
): Promise<string[]> {
  const content = await extractFileContent(filePath);
  
  // Simple keyword extraction (can be enhanced with NLP later)
  const words = content.text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length >= minWordLength)
    .filter(w => /^[a-z]+$/.test(w)); // Only alphabetic
  
  // Count frequency
  const freq = new Map<string, number>();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  
  // Return top keywords by frequency
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word]) => word);
}

