import { searchWeb } from '@/lib/analysis/tavilySearch';
import { extractWebIntelligence, type WebIntelligence } from '@/lib/interview/webIntelligence';

export interface SearchedQuestion {
  question: string;
  source: string;
  url: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
}

/**
 * Search the web for real interview questions using Tavily
 * V2.0: Returns rich intelligence (8 dimensions), not just questions!
 * @param companyName - Company name (e.g., "Google", "Amazon")
 * @param roleTitle - Job title (e.g., "Software Engineer", "Product Manager")
 * @param interviewerNames - Optional: Names of interviewers to validate
 * @returns Object with questions, web intelligence, and source URLs
 */
export async function searchInterviewQuestions(
  companyName: string,
  roleTitle: string,
  interviewerNames: string[] = []
): Promise<{ 
  questions: SearchedQuestion[]; 
  sources: string[];
  webIntelligence: WebIntelligence;
}> {
  console.log(`🔍 Searching interview questions for ${companyName} - ${roleTitle}...`);
  
  // Build BROAD search queries (not restrictive by role)
  const queries = [
    // Company-specific searches (broader)
    `${companyName} interview questions site:glassdoor.com`,
    `${companyName} interview experience site:reddit.com`,
    `${companyName} interview site:teamblind.com`,
    `${companyName} interview questions`,
    `${companyName} interview process`,
    `${companyName} interview tips`,
    `${companyName} interview experience`,
    `${companyName} interview feedback`,
    `${companyName} interview reviews`,
    // Role-specific searches (broader)
    `${roleTitle} interview questions site:glassdoor.com`,
    `${roleTitle} interview experience site:reddit.com`,
    `${roleTitle} interview questions`,
    `${roleTitle} interview tips`,
    // Industry/domain searches
    `${companyName} tech interview`,
    `${companyName} product interview`,
    `${companyName} engineering interview`,
    // General interview questions for the role
    `${roleTitle} behavioral questions`,
    `${roleTitle} technical questions`,
    `${roleTitle} interview prep`,
  ];
  
  // Add interviewer-specific searches if names provided
  interviewerNames.forEach(name => {
    queries.push(`${name} ${companyName} interview site:glassdoor.com`);
  });
  
  try {
    // Execute all searches in parallel (more results per query)
    const searchPromises = queries.map(query => 
      searchWeb(query, {
        maxResults: 8, // Increased from 5 to 8
        searchDepth: 'advanced'
      })
    );
    
    const searchResponses = await Promise.all(searchPromises);
    
    // Combine all results
    const allResults = searchResponses
      .filter(r => r.success && r.results)
      .flatMap(r => r.results);
    
    if (allResults.length === 0) {
      console.log('⚠️ No search results found');
      return { 
        questions: [], 
        sources: [],
        webIntelligence: {
          questions: [],
          interviewerValidations: {},
          successPatterns: [],
          failurePatterns: [],
          warnings: [],
          processIntel: {},
          salaryData: { offers: [] },
          culturalSignals: []
        }
      };
    }
    
    // V2.0: Extract rich intelligence (8 dimensions!)
    const webIntelligence = extractWebIntelligence(allResults, interviewerNames);
    
    console.log(`✅ Found ${webIntelligence.questions.length} questions from ${allResults.length} sources`);
    console.log(`✅ Interviewer validations:`, Object.keys(webIntelligence.interviewerValidations));
    console.log(`✅ Success patterns:`, webIntelligence.successPatterns.length);
    console.log(`✅ Warnings:`, webIntelligence.warnings.length);
    
    // Convert to old format for backwards compatibility, preserving source URLs
    const questions: SearchedQuestion[] = webIntelligence.questions.map((q, index) => {
      // Try to find the source URL for this question
      const sourceResult = allResults.find(r => 
        r.content?.includes(q) || r.snippet?.includes(q)
      );
      
      return {
        question: q,
        source: 'Web Search',
        url: sourceResult?.url || '',
        category: categorizeQuestion(q)
      };
    });
    
    const sources = allResults.map(r => r.url).filter(Boolean);
    
    return {
      questions: questions.slice(0, 30), // Optimal cap for speed vs coverage
      sources: Array.from(new Set(sources)),
      webIntelligence  // NEW! Rich intelligence data
    };
  } catch (error) {
    console.error('❌ Interview question search failed:', error);
    throw error;
  }
}

/**
 * Extract questions from text content
 * Looks for common question patterns (ends with ?, starts with Question:, etc.)
 */
function extractQuestions(text: string): string[] {
  const questions: string[] = [];
  
  // Pattern 1: Lines ending with ?
  const questionMarks = text.match(/[^.!?\n]{10,200}\?/g) || [];
  questions.push(...questionMarks.map(q => q.trim()));
  
  // Pattern 2: "Question: ..." or "Q: ..." or "Q#:"
  const labeledQuestions = text.match(/(?:Question|Q)\s*[:#]?\s*([^.!?\n]{10,200})/gi) || [];
  questions.push(...labeledQuestions.map(q => 
    q.replace(/(?:Question|Q)\s*[:#]?\s*/i, '').trim()
  ));
  
  // Pattern 3: Common interview question starters
  const starterPatterns = [
    /(?:Tell me about|Describe|Explain|What|Why|How|When|Where)\s+[^.!?\n]{10,200}\?/gi
  ];
  
  for (const pattern of starterPatterns) {
    const matches = text.match(pattern) || [];
    questions.push(...matches.map(q => q.trim()));
  }
  
  // Deduplicate and filter
  const unique = Array.from(new Set(questions));
  return unique.filter(q => 
    q.length >= 20 &&    // Min length
    q.length <= 300 &&   // Max length
    !q.includes('©') &&  // No copyright symbols
    !q.includes('www.') && // No URLs in question text
    !q.toLowerCase().includes('cookie') && // No cookie policy text
    !q.toLowerCase().includes('privacy') // No privacy policy text
  );
}

/**
 * Categorize question based on keywords
 */
function categorizeQuestion(question: string): string {
  const lower = question.toLowerCase();
  
  // Behavioral questions
  if (
    lower.includes('tell me about') || 
    lower.includes('describe a time') ||
    lower.includes('give me an example')
  ) {
    return 'Behavioral';
  }
  
  // Technical questions
  if (
    lower.includes('algorithm') || 
    lower.includes('code') || 
    lower.includes('implement') ||
    lower.includes('design a system') ||
    lower.includes('how would you build')
  ) {
    return 'Technical';
  }
  
  // Motivation questions
  if (
    lower.includes('why') && (
      lower.includes('interested') || 
      lower.includes('want to work') ||
      lower.includes('this role') ||
      lower.includes('this company')
    )
  ) {
    return 'Motivation';
  }
  
  // Leadership questions
  if (
    lower.includes('team') || 
    lower.includes('conflict') || 
    lower.includes('leadership') ||
    lower.includes('manage') ||
    lower.includes('disagreement')
  ) {
    return 'Leadership';
  }
  
  // Experience questions
  if (
    lower.includes('experience') || 
    lower.includes('background') ||
    lower.includes('project')
  ) {
    return 'Experience';
  }
  
  return 'General';
}

/**
 * Deduplicate questions based on similarity
 * Remove near-duplicates (e.g., "Tell me about yourself" vs "Tell me about yourself?")
 */
function deduplicateQuestions(questions: SearchedQuestion[]): SearchedQuestion[] {
  const seen = new Map<string, SearchedQuestion>();
  
  for (const question of questions) {
    // Normalize for comparison (lowercase, remove punctuation)
    const normalized = question.question
      .toLowerCase()
      .replace(/[?.!,]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Skip if we've seen this question (or very similar)
    if (!seen.has(normalized)) {
      seen.set(normalized, question);
    }
  }
  
  return Array.from(seen.values());
}

