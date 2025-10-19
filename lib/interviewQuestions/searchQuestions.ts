import { searchWeb } from '@/lib/ai/tavily';

export interface SearchedQuestion {
  question: string;
  source: string;
  url: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
}

/**
 * Search the web for real interview questions using Tavily
 * @param companyName - Company name (e.g., "Google", "Amazon")
 * @param roleTitle - Job title (e.g., "Software Engineer", "Product Manager")
 * @returns Object with questions array and source URLs
 */
export async function searchInterviewQuestions(
  companyName: string,
  roleTitle: string
): Promise<{ questions: SearchedQuestion[]; sources: string[] }> {
  console.log(`🔍 Searching interview questions for ${companyName} - ${roleTitle}...`);
  
  // Build search query optimized for interview question sites
  const query = `${companyName} ${roleTitle} interview questions experiences glassdoor blind`;
  
  try {
    const searchResults = await searchWeb(query, {
      maxResults: 10,
      searchDepth: 'advanced'
    });
    
    if (!searchResults || searchResults.length === 0) {
      console.log('⚠️ No search results found');
      return { questions: [], sources: [] };
    }
    
    // Extract questions from search results
    const questions: SearchedQuestion[] = [];
    const sources: string[] = [];
    
    for (const result of searchResults) {
      // Parse content for question patterns
      const content = result.content || '';
      const questionMatches = extractQuestions(content);
      
      for (const question of questionMatches) {
        questions.push({
          question,
          source: result.title || 'Unknown',
          url: result.url,
          category: categorizeQuestion(question)
        });
      }
      
      sources.push(result.url);
    }
    
    // Deduplicate questions
    const uniqueQuestions = deduplicateQuestions(questions);
    
    console.log(`✅ Found ${uniqueQuestions.length} unique questions from ${sources.length} sources`);
    
    return {
      questions: uniqueQuestions.slice(0, 30), // Cap at 30 questions
      sources: Array.from(new Set(sources))    // Deduplicate sources
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

