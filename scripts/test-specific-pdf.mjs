import { readFileSync } from 'fs';
import { PDFParse } from 'pdf-parse';

const pdfPath = './data/attachments/4bbb347a-7861-489d-bb6d-ab05ee1e939e/Tara_Murali_Resume_Sep__25.pdf';

console.log('🔍 Testing PDF extraction on Tara Murali resume\n');
console.log(`File: ${pdfPath}\n`);

try {
  const buffer = readFileSync(pdfPath);
  console.log(`✓ File read: ${(buffer.length / 1024).toFixed(1)} KB\n`);
  
  console.log('📦 Using PDFParse class (v2.x API)\n');
  
  console.log('⏳ Creating parser instance...\n');
  const parser = new PDFParse({ data: buffer });
  
  console.log('⏳ Extracting text...\n');
  const result = await parser.getText();
  
  console.log('⏳ Getting info...\n');
  const info = await parser.getInfo();
  
  const data = {
    text: result.text,
    numpages: info?.info?.pageCount || info?.numPages || 0
  };
  
  console.log('✅ SUCCESS!\n');
  console.log(`Pages: ${data.numpages}`);
  console.log(`Text length: ${data.text.length} chars`);
  console.log(`Word count: ~${data.text.split(/\s+/).length} words`);
  console.log(`\nFirst 300 chars:\n${data.text.substring(0, 300)}\n`);
  
} catch (error) {
  console.error('❌ FAILED:', error.message);
  console.error('\nError details:');
  console.error('  Type:', error.constructor.name);
  console.error('  Code:', error.code);
  console.error('  Path:', error.path);
  console.error('\nStack:', error.stack?.substring(0, 500));
}

