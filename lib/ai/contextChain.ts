/**
 * Hierarchical Context Passing for AI Analyses
 * 
 * Flow: Company → People → Match Score → Skills
 * Each analysis receives optimized summaries of previous analyses
 */

interface AnalysisContext {
  company?: string;
  people?: string;
  match?: string;
}

/**
 * Summarize text for use as context in subsequent analyses
 * @param text Full analysis text
 * @param maxTokens Maximum tokens (rough estimate: 1 token ≈ 4 chars)
 * @returns Summarized text
 */
export function summarizeForContext(text: string, maxTokens: number = 100): string {
  if (!text) return '';
  
  const maxChars = maxTokens * 4; // Rough approximation
  
  if (text.length <= maxChars) {
    return text;
  }
  
  // Extract key sentences (first and important ones)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Priority keywords that indicate important sentences
  const keywordPriority = [
    'recommend', 'important', 'key', 'critical', 'must', 'should',
    'culture', 'fit', 'gap', 'strength', 'weakness', 'focus'
  ];
  
  // Score sentences by keyword presence
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const score = keywordPriority.reduce((acc, keyword) => 
      acc + (lowerSentence.includes(keyword) ? 1 : 0), 0
    );
    return { sentence: sentence.trim(), score };
  });
  
  // Sort by score (highest first) and take top sentences
  scoredSentences.sort((a, b) => b.score - a.score);
  
  let summary = '';
  for (const { sentence } of scoredSentences) {
    if ((summary + sentence).length > maxChars) break;
    summary += sentence + ' ';
  }
  
  // If still empty, just take first N chars
  if (!summary) {
    summary = text.substring(0, maxChars) + '...';
  }
  
  return summary.trim();
}

/**
 * Build context string from previous analyses
 * @param context Previous analysis results
 * @returns Formatted context string
 */
export function buildContextString(context: AnalysisContext): string {
  const parts: string[] = [];
  
  if (context.company) {
    parts.push(`Company Context: ${context.company}`);
  }
  
  if (context.people) {
    parts.push(`People Context: ${context.people}`);
  }
  
  if (context.match) {
    parts.push(`Match Analysis: ${context.match}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Extract key insights from company analysis
 */
export function extractCompanyInsights(companyData: any): string {
  if (!companyData) return '';
  
  const insights: string[] = [];
  
  if (companyData.tldr) {
    insights.push(`Company Overview: ${companyData.tldr}`);
  }
  
  if (companyData.culture) {
    insights.push(`Culture: ${companyData.culture}`);
  }
  
  if (companyData.keyFacts && companyData.keyFacts.length > 0) {
    insights.push(`Key Facts: ${companyData.keyFacts.slice(0, 3).join('; ')}`);
  }
  
  const text = insights.join('. ');
  return summarizeForContext(text, 80);
}

/**
 * Extract key insights from people analysis
 */
export function extractPeopleInsights(peopleData: any): string {
  if (!peopleData || !Array.isArray(peopleData)) return '';
  
  const insights: string[] = [];
  
  for (const person of peopleData.slice(0, 3)) { // Top 3 people
    if (person.name && person.role) {
      insights.push(`${person.name} (${person.role}): ${person.summary || 'key stakeholder'}`);
    }
  }
  
  const text = insights.join('. ');
  return summarizeForContext(text, 80);
}

/**
 * Extract key insights from match analysis
 */
export function extractMatchInsights(matchData: any): string {
  if (!matchData) return '';
  
  const insights: string[] = [];
  
  if (matchData.score !== undefined) {
    insights.push(`Match Score: ${Math.round(matchData.score * 100)}%`);
  }
  
  if (matchData.highlights && matchData.highlights.length > 0) {
    insights.push(`Strengths: ${matchData.highlights.slice(0, 2).join(', ')}`);
  }
  
  if (matchData.gaps && matchData.gaps.length > 0) {
    insights.push(`Gaps: ${matchData.gaps.slice(0, 2).join(', ')}`);
  }
  
  const text = insights.join('. ');
  return summarizeForContext(text, 80);
}

/**
 * Create full context for next analysis
 * @param previous All previous analysis results
 * @returns Context object ready for next analysis
 */
export function createAnalysisContext(previous: {
  company?: any;
  people?: any;
  match?: any;
}): AnalysisContext {
  return {
    company: previous.company ? extractCompanyInsights(previous.company) : undefined,
    people: previous.people ? extractPeopleInsights(previous.people) : undefined,
    match: previous.match ? extractMatchInsights(previous.match) : undefined,
  };
}

