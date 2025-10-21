import { readFileSync } from 'fs';
import { PDFParse } from 'pdf-parse';

const filePath = './data/attachments/4bbb347a-7861-489d-bb6d-ab05ee1e939e/Tara_Murali_Resume_Sep__25.pdf';

try {
  console.log('📦 Testing pdf-parse v2.x with PDFParse class...\n');
  
  const buffer = readFileSync(filePath);
  console.log(`✓ File read: ${(buffer.length / 1024).toFixed(1)} KB\n`);
  
  // Try creating parser
  console.log('Creating PDFParse instance...');
  const parser = new PDFParse({ data: buffer });
  console.log('✓ Parser created\n');
  
  // Try getText()
  console.log('Calling getText()...');
  const result = await parser.getText();
  console.log('✓ getText() complete\n');
  
  console.log(`Text length: ${result.text.length} chars`);
  console.log(`First 200 chars:\n${result.text.substring(0, 200)}\n`);
  
  // Try getInfo()
  console.log('Calling getInfo()...');
  const info = await parser.getInfo();
  console.log('✓ getInfo() complete');
  console.log(`Pages: ${info?.info?.pageCount || info?.numPages || '?'}\n`);
  
  // Cleanup
  if (parser.destroy) {
    await parser.destroy();
    console.log('✓ Parser destroyed');
  }
  
  console.log('\n✅ SUCCESS! pdf-parse v2.x works fine.');
} catch (error) {
  console.error('\n❌ FAILED:', error.message);
  console.error('Stack:', error.stack);
}

