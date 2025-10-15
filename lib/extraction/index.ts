// v2.7: Extraction system exports

export * from './types';
export * from './extractionEngine';

// Register all extractors
import { registerExtractor } from './extractionEngine';
import { ResumeExtractor } from './extractors/resumeExtractor';
import { JDExtractor } from './extractors/jdExtractor';

// Register extractors on module load
registerExtractor('attachment', new ResumeExtractor()); // Default for resume attachments
registerExtractor('profile', new ResumeExtractor()); // Reuse for profiles
registerExtractor('company_intel', new JDExtractor()); // Use JD extractor for company docs

// Note: Actual attachment type detection should be done at call site
// based on attachment.kind field

