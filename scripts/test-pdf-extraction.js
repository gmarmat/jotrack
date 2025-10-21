const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const pdfParseModule = require('pdf-parse');
    // pdf-parse exports the function directly in CommonJS
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    const filePath = process.argv[2] || 'data/attachments/4bbb347a-7861-489d-bb6d-ab05ee1e939e/Tara_Murali_Resume_Sep__25.pdf';
    
    console.log(`📄 Testing PDF extraction: ${path.basename(filePath)}`);
    console.log(`   pdfParse type: ${typeof pdfParse}`);
    console.log(`   pdfParse keys: ${Object.keys(pdfParseModule).join(', ')}`);
    
    const buffer = fs.readFileSync(filePath);
    console.log(`   File size: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // pdf-parse v2.x uses PDFParse class with { data: buffer }
    const parser = new pdfParseModule.PDFParse({ data: buffer });
    
    // Extract text
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    
    const data = {
      text: textResult.text,
      numpages: infoResult?.info?.pageCount || 1
    };
    
    // Clean up
    await parser.destroy();
    
    console.log(`✅ SUCCESS!`);
    console.log(`   Pages: ${data.numpages}`);
    console.log(`   Text length: ${data.text.length} characters`);
    console.log(`   Words: ${data.text.split(/\s+/).filter(w => w).length}`);
    console.log(`\n   First 200 chars:\n   ${data.text.substring(0, 200)}...`);
    
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    console.error(`   Error type: ${error.constructor.name}`);
    if (error.stack) {
      console.error(`\n   Stack trace:\n${error.stack}`);
    }
  }
}

test();

