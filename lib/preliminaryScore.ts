/**
 * Calculate preliminary match score before AI analysis
 * Uses simple keyword matching and text similarity
 */

interface PreliminaryScoreResult {
  score: number; // 0-100
  matchedKeywords: string[];
  totalKeywords: number;
  highlights: string[];
  gaps: string[];
}

/**
 * Extract keywords from job description
 */
function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'we', 'you', 'they', 'our', 'your', 'their', 'it', 'its'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\+\#]/g, ' ') // Keep + and # for tech terms (C++, C#)
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));

  // Extract multi-word tech terms
  const techTerms: string[] = [];
  const patterns = [
    /(\w+\s+(?:developer|engineer|manager|designer|analyst|scientist|architect))/gi,
    /(\w+\s+(?:experience|skills|knowledge))/gi,
    /(react|angular|vue|node|python|java|javascript|typescript|aws|azure|gcp)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = text.toLowerCase().match(pattern);
    if (matches) {
      techTerms.push(...matches);
    }
  });

  return Array.from(new Set([...words, ...techTerms]));
}

/**
 * Calculate preliminary match score
 */
export function calculatePreliminaryScore(
  jobDescription: string,
  resume: string
): PreliminaryScoreResult {
  if (!jobDescription || !resume) {
    return {
      score: 0,
      matchedKeywords: [],
      totalKeywords: 0,
      highlights: [],
      gaps: [],
    };
  }

  const jdKeywords = extractKeywords(jobDescription);
  const resumeText = resume.toLowerCase();

  // Find matched keywords
  const matched = jdKeywords.filter(keyword => 
    resumeText.includes(keyword.toLowerCase())
  );

  const unmatched = jdKeywords.filter(keyword => 
    !resumeText.includes(keyword.toLowerCase())
  );

  // Calculate score (matched / total * 100)
  const score = jdKeywords.length > 0 
    ? Math.round((matched.length / jdKeywords.length) * 100) 
    : 0;

  // Generate highlights (top matched keywords)
  const highlights = matched.slice(0, 5).map(k => 
    `Found: "${k}"`
  );

  // Generate gaps (top unmatched keywords)
  const gaps = unmatched.slice(0, 5).map(k => 
    `Missing: "${k}"`
  );

  return {
    score,
    matchedKeywords: matched,
    totalKeywords: jdKeywords.length,
    highlights,
    gaps,
  };
}

/**
 * Check if content has changed enough to warrant re-calculation
 */
export function hasContentChanged(
  oldJd: string,
  newJd: string,
  oldResume: string,
  newResume: string,
  threshold: number = 0.05 // 5% change
): boolean {
  const jdChange = Math.abs(oldJd.length - newJd.length) / (oldJd.length || 1);
  const resumeChange = Math.abs(oldResume.length - newResume.length) / (oldResume.length || 1);

  return jdChange > threshold || resumeChange > threshold;
}

