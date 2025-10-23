import { extractText } from '../lib/extraction/textExtractor.js';

const filePath = process.argv[2] || 'data/attachments/4bbb347a-7861-489d-bb6d-ab05ee1e939e/Tara_Murali_Resume_Sep__25.pdf';

console.log(`Testing extractText function on: ${filePath}`);

extractText(filePath)
  .then(result => {
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log(`   Text length: ${result.text.length}`);
      console.log(`   Word count: ${result.metadata?.wordCount}`);
      console.log(`   Page count: ${result.metadata?.pageCount}`);
      console.log(`\n   First 200 chars:\n   ${result.text.substring(0, 200)}...`);
    } else {
      console.log('❌ FAILED!');
      console.log(`   Error: ${result.error}`);
    }
  })
  .catch(err => {
    console.error('❌ EXCEPTION:', err);
  });

