#!/usr/bin/env node
/**
 * Standalone PDF extraction script
 * Runs in pure Node.js context (bypasses Next.js webpack)
 * 
 * Usage: node extract-pdf-standalone.js <file-path>
 * Output: JSON to stdout
 */

const fs = require('fs');

async function extractPDF(filePath) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`
      };
    }
    
    // Read PDF file
    const buffer = fs.readFileSync(filePath);
    
    console.error(`[PDF Extractor] File loaded: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // Import pdf-parse v2.x
    const { PDFParse } = require('pdf-parse');
    
    console.error(`[PDF Extractor] Using pdf-parse v2.x (PDFParse class)`);
    
    // Extract text using pdf-parse v2.x API
    const parser = new PDFParse({ data: buffer });
    
    console.error(`[PDF Extractor] Parser created, extracting text...`);
    const result = await parser.getText();
    
    console.error(`[PDF Extractor] Text extracted, getting info...`);
    const info = await parser.getInfo();
    
    const data = {
      text: result.text,
      numpages: info?.info?.pageCount || info?.numPages || 0
    };
    
    const text = data.text.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    console.error(`[PDF Extractor] Extracted: ${text.length} chars, ${data.numpages} pages, ${wordCount} words`);
    
    return {
      success: true,
      text: text,
      metadata: {
        pageCount: data.numpages,
        wordCount: wordCount,
        extractedAt: Date.now()
      }
    };
    
  } catch (error) {
    console.error(`[PDF Extractor] Error:`, error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid PDF')) {
      return {
        success: false,
        error: 'Invalid or corrupted PDF file'
      };
    }
    
    if (error.message.includes('encrypted')) {
      return {
        success: false,
        error: 'PDF is password-protected. Please remove password and try again.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error during PDF extraction'
    };
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error(JSON.stringify({
    success: false,
    error: 'No file path provided'
  }));
  process.exit(1);
}

extractPDF(filePath)
  .then(result => {
    // Write result to stdout as JSON
    console.log(JSON.stringify(result));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error(JSON.stringify({
      success: false,
      error: `Fatal error: ${error.message}`
    }));
    process.exit(1);
  });

