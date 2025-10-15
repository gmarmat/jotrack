// v2.7: Local text similarity calculation (no AI needed)

/**
 * Calculate Jaccard similarity between two texts
 * Returns 0-1 where 1 = identical, 0 = completely different
 * 
 * Uses word-level comparison (not character-level)
 * Ignores formatting, punctuation, case
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  // Normalize and tokenize
  const words1 = normalizeAndTokenize(text1);
  const words2 = normalizeAndTokenize(text2);
  
  // Create sets for Jaccard similarity
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(word => set2.has(word)));
  
  // Calculate union
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity = |intersection| / |union|
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}

/**
 * Normalize text and extract meaningful words
 */
function normalizeAndTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 2) // Filter out short words (a, an, to)
    .filter(word => !STOP_WORDS.has(word)); // Filter common words
}

/**
 * Common words to ignore (stop words)
 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has',
  'was', 'were', 'been', 'are', 'can', 'will', 'would', 'could', 'should',
]);

/**
 * Determine if change is significant based on similarity score
 * 
 * Thresholds:
 * - >95%: Insignificant (typos, formatting)
 * - 80-95%: Minor (small edits)
 * - <80%: Major (substantial changes)
 */
export function assessChangeSignificance(similarity: number): {
  isSignificant: boolean;
  severity: 'none' | 'minor' | 'major';
  description: string;
} {
  if (similarity > 0.95) {
    return {
      isSignificant: false,
      severity: 'none',
      description: 'Less than 5% content changed - likely formatting or typos',
    };
  }
  
  if (similarity > 0.80) {
    return {
      isSignificant: true,
      severity: 'minor',
      description: '5-20% content changed - minor edits detected',
    };
  }
  
  return {
    isSignificant: true,
    severity: 'major',
    description: 'More than 20% content changed - substantial updates detected',
  };
}

/**
 * Compare two content hashes and their actual content for smart detection
 * 
 * This is the main entry point for change detection
 */
export async function compareVariantContent(
  variant1ContentHash: string,
  variant2ContentHash: string,
  variant1Content: any,
  variant2Content: any
): Promise<{
  hashesMatch: boolean;
  similarity: number;
  isSignificant: boolean;
  severity: 'none' | 'minor' | 'major';
  description: string;
}> {
  // Quick check: if hashes match, content is identical
  if (variant1ContentHash === variant2ContentHash) {
    return {
      hashesMatch: true,
      similarity: 1.0,
      isSignificant: false,
      severity: 'none',
      description: 'Content is identical',
    };
  }
  
  // Hashes differ, but check actual similarity
  // Convert variant JSON to text for comparison
  const text1 = extractTextFromVariant(variant1Content);
  const text2 = extractTextFromVariant(variant2Content);
  
  const similarity = calculateTextSimilarity(text1, text2);
  const assessment = assessChangeSignificance(similarity);
  
  return {
    hashesMatch: false,
    similarity,
    isSignificant: assessment.isSignificant,
    severity: assessment.severity,
    description: assessment.description,
  };
}

/**
 * Extract comparable text from variant JSON structure
 */
function extractTextFromVariant(variantContent: any): string {
  // If it's a string, return as-is
  if (typeof variantContent === 'string') {
    return variantContent;
  }
  
  // If it's an object (our variant structure), extract relevant fields
  const parts: string[] = [];
  
  if (variantContent.summary) parts.push(variantContent.summary);
  if (variantContent.skills) {
    if (Array.isArray(variantContent.skills.technical)) {
      parts.push(...variantContent.skills.technical);
    }
    if (Array.isArray(variantContent.skills.soft)) {
      parts.push(...variantContent.skills.soft);
    }
  }
  if (variantContent.experience && Array.isArray(variantContent.experience)) {
    for (const exp of variantContent.experience) {
      if (exp.role) parts.push(exp.role);
      if (exp.company) parts.push(exp.company);
      if (exp.highlights && Array.isArray(exp.highlights)) {
        parts.push(...exp.highlights);
      }
    }
  }
  
  return parts.join(' ');
}

