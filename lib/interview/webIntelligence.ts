/**
 * Web Intelligence Extraction System
 * Extracts 8 dimensions from Glassdoor/Reddit/Blind search results
 * Zero additional API calls - reuses existing web search!
 */

export interface InterviewerValidation {
  found: boolean;
  mentions: number;
  sources: {
    source: string;
    url: string;
    date?: string;
    quote: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    outcome?: 'offer' | 'rejected' | 'unknown';
  }[];
  confirmedInsights: string[];
  newWarnings: string[];
  successPatterns: string[];
  failurePatterns: string[];
}

export interface ProcessIntelligence {
  rounds?: number;
  totalTimeline?: string;
  decisionTime?: string;
  format?: string[];
}

export interface SalaryData {
  offers: string[];
  average?: string;
  negotiationSuccess?: string;
}

export interface WebIntelligence {
  questions: string[];
  interviewerValidations: Record<string, InterviewerValidation>;
  successPatterns: string[];
  failurePatterns: string[];
  warnings: string[];
  processIntel: ProcessIntelligence;
  salaryData: SalaryData;
  culturalSignals: string[];
}

/**
 * Extract interviewer mentions from web search results
 */
function extractInterviewerMentions(
  results: any[],
  interviewerName: string
): any[] {
  const mentions: any[] = [];
  
  results.forEach(result => {
    const content = result.content || result.snippet || '';
    const lowerContent = content.toLowerCase();
    const lowerName = interviewerName.toLowerCase();
    
    // Check if interviewer name is mentioned
    if (lowerContent.includes(lowerName) || 
        lowerContent.includes(interviewerName.split(' ')[0].toLowerCase())) {
      
      // Extract quote (sentence containing the name)
      const sentences = content.split(/[.!?]+/);
      const relevantSentences = sentences.filter((s: string) => 
        s.toLowerCase().includes(lowerName) ||
        s.toLowerCase().includes(interviewerName.split(' ')[0].toLowerCase())
      );
      
      if (relevantSentences.length > 0) {
        mentions.push({
          source: result.url?.includes('glassdoor') ? 'Glassdoor' :
                  result.url?.includes('reddit') ? 'Reddit' :
                  result.url?.includes('blind') ? 'Blind' : 'Web',
          url: result.url || '',
          quote: relevantSentences[0].trim(),
          content: content,
          timestamp: result.timestamp || result.date
        });
      }
    }
  });
  
  return mentions;
}

/**
 * Analyze interviewer mentions to extract insights
 */
function analyzeInterviewerMentions(mentions: any[]): {
  confirmedInsights: string[];
  newWarnings: string[];
  successPatterns: string[];
  failurePatterns: string[];
} {
  const confirmedInsights: string[] = [];
  const newWarnings: string[] = [];
  const successPatterns: string[] = [];
  const failurePatterns: string[] = [];
  
  mentions.forEach(mention => {
    const quote = mention.quote.toLowerCase();
    const content = mention.content.toLowerCase();
    
    // Detect communication style insights
    if (quote.includes('data') || quote.includes('metrics') || quote.includes('numbers')) {
      confirmedInsights.push('data-driven');
      if (quote.includes('obsessed') || quote.includes('exact') || quote.includes('specific')) {
        newWarnings.push("Requires exact metrics (not rough estimates)");
      }
    }
    
    if (quote.includes('casual') || quote.includes('friendly') || quote.includes('conversational')) {
      confirmedInsights.push('casual-style');
    }
    
    if (quote.includes('formal') || quote.includes('professional') || quote.includes('serious')) {
      confirmedInsights.push('formal-style');
    }
    
    // Extract success patterns
    if (content.includes('got offer') || content.includes('accepted') || content.includes('hired')) {
      // Look for what worked
      if (content.includes('brought') || content.includes('prepared')) {
        const match = content.match(/brought ([^.]+)/i) || content.match(/prepared ([^.]+)/i);
        if (match) {
          successPatterns.push(`Successful candidates: ${match[1]}`);
        }
      }
      if (content.includes('cheat sheet') || content.includes('portfolio')) {
        successPatterns.push("Brought prepared materials (cheat sheet or portfolio)");
      }
    }
    
    // Extract failure patterns
    if (content.includes('rejected') || content.includes('didn\'t get') || content.includes('bombed')) {
      // Look for what didn't work
      if (content.includes('vague') || content.includes('didn\'t have')) {
        newWarnings.push("Vague answers or missing details led to rejection");
      }
      if (content.includes('rough') || content.includes('about') || content.includes('approximately')) {
        newWarnings.push("Rough estimates (instead of exact numbers) didn't go well");
        failurePatterns.push("Using 'about' or 'roughly' instead of exact numbers");
      }
    }
  });
  
  return {
    confirmedInsights: [...new Set(confirmedInsights)],
    newWarnings: [...new Set(newWarnings)],
    successPatterns: [...new Set(successPatterns)],
    failurePatterns: [...new Set(failurePatterns)]
  };
}

/**
 * Extract process intelligence from web results
 */
function extractProcessIntelligence(results: any[]): ProcessIntelligence {
  let rounds: number | undefined;
  let totalTimeline: string | undefined;
  let decisionTime: string | undefined;
  const format: string[] = [];
  
  results.forEach(result => {
    const content = (result.content || result.snippet || '').toLowerCase();
    
    // Extract round count
    const roundMatch = content.match(/(\d+)\s+rounds?/i);
    if (roundMatch && !rounds) {
      rounds = parseInt(roundMatch[1]);
    }
    
    // Extract timeline
    const timelineMatch = content.match(/(\d+)\s+(weeks?|days?|months?)/i);
    if (timelineMatch && !totalTimeline) {
      totalTimeline = `${timelineMatch[1]} ${timelineMatch[2]}`;
    }
    
    // Extract interview types
    if (content.includes('phone screen') || content.includes('phone call')) {
      format.push('phone');
    }
    if (content.includes('video call') || content.includes('zoom') || content.includes('teams')) {
      format.push('video');
    }
    if (content.includes('onsite') || content.includes('in-person')) {
      format.push('onsite');
    }
    if (content.includes('panel') || content.includes('group interview')) {
      format.push('panel');
    }
  });
  
  return {
    rounds,
    totalTimeline,
    decisionTime,
    format: [...new Set(format)]
  };
}

/**
 * Extract salary data from web results
 */
function extractSalaryData(results: any[]): SalaryData {
  const offers: string[] = [];
  
  results.forEach(result => {
    const content = result.content || result.snippet || '';
    
    // Extract salary mentions ($XXK format)
    const salaryMatches = content.match(/\$(\d{2,3})[Kk]/g);
    if (salaryMatches) {
      offers.push(...salaryMatches);
    }
  });
  
  // Calculate average if enough data
  let average: string | undefined;
  if (offers.length >= 3) {
    const nums = offers.map(o => parseInt(o.replace(/[$Kk]/g, '')));
    const avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    average = `$${avg}K`;
  }
  
  return {
    offers: [...new Set(offers)],
    average
  };
}

/**
 * Main extraction function
 * Takes raw Tavily search results and extracts all intelligence
 */
export function extractWebIntelligence(
  searchResults: any[],
  interviewerNames: string[] = []
): WebIntelligence {
  // Extract questions (existing behavior)
  const questions: string[] = [];
  searchResults.forEach((result, index) => {
    const content = result.content || result.snippet || '';
    
    // Debug: Log content sample for first few results
    if (index < 2) {
      console.log(`🔍 Debug: Result ${index} content sample:`, {
        url: result.url,
        contentLength: content.length,
        contentSample: content.substring(0, 200),
        hasQuestions: content.includes('?')
      });
    }
    
    // Look for question patterns - more comprehensive
    const questionPatterns = [
      /["']([^"']+\?)/g,  // Quoted questions
      /Q:\s*([^?\n]+\?)/gi,  // Q: format
      /asked\s+["']([^"']+\?)/gi,  // "They asked..."
      /(?:Question|Q)\s*[:#]?\s*([^.!?\n]{10,200}\?)/gi,  // "Question:" format
      /(?:Tell me about|Describe|Explain|What|Why|How|When|Where)\s+[^.!?\n]{10,200}\?/gi,  // Common starters
      /([^.!?\n]{15,200}\?)/g,  // Any sentence ending with ? (reduced min length)
      // Additional patterns for better coverage
      /(?:Can you|Would you|Have you|Do you|Are you)\s+[^.!?\n]{10,200}\?/gi,  // Modal questions
      /(?:Walk me through|Tell me about|Describe a time|Give me an example)\s+[^.!?\n]{10,200}\?/gi,  // Behavioral starters
      /(?:How would you|What would you|Why would you)\s+[^.!?\n]{10,200}\?/gi,  // Hypothetical questions
    ];
    
    let foundInThisResult = 0;
    questionPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const question = match[1] || match[0];
        if (question && question.length > 8 && question.length < 300) {
          // Additional filtering to remove non-questions
          const trimmed = question.trim();
          if (!trimmed.includes('©') && 
              !trimmed.includes('www.') && 
              !trimmed.toLowerCase().includes('cookie') &&
              !trimmed.toLowerCase().includes('privacy') &&
              !trimmed.toLowerCase().includes('terms of service') &&
              !trimmed.toLowerCase().includes('click here') &&
              trimmed.includes('?')) {
            questions.push(trimmed);
            foundInThisResult++;
          }
        }
      }
    });
    
    // Debug: Log questions found in this result
    if (index < 2) {
      console.log(`🔍 Debug: Found ${foundInThisResult} questions in result ${index}`);
    }
  });
  
  // Extract interviewer validations (NEW!)
  const interviewerValidations: Record<string, InterviewerValidation> = {};
  
  interviewerNames.forEach(name => {
    const mentions = extractInterviewerMentions(searchResults, name);
    
    if (mentions.length > 0) {
      const analysis = analyzeInterviewerMentions(mentions);
      
      interviewerValidations[name] = {
        found: true,
        mentions: mentions.length,
        sources: mentions.map(m => ({
          source: m.source,
          url: m.url,
          date: m.timestamp,
          quote: m.quote,
          sentiment: m.content.includes('offer') ? 'positive' : 
                     m.content.includes('reject') ? 'negative' : 'neutral',
          outcome: m.content.includes('offer') ? 'offer' :
                   m.content.includes('reject') ? 'rejected' : 'unknown'
        })),
        confirmedInsights: analysis.confirmedInsights,
        newWarnings: analysis.newWarnings,
        successPatterns: analysis.successPatterns,
        failurePatterns: analysis.failurePatterns
      };
    }
  });
  
  // Extract global patterns (NEW!)
  const allContent = searchResults.map(r => r.content || r.snippet || '').join('\n');
  
  const successPatterns: string[] = [];
  const failurePatterns: string[] = [];
  const warnings: string[] = [];
  
  // Success patterns
  if (allContent.includes('portfolio') && allContent.includes('offer')) {
    successPatterns.push('Bringing portfolio/case studies impresses interviewers');
  }
  if (allContent.includes('metrics') && allContent.includes('hired')) {
    successPatterns.push('Leading with quantified metrics increases success rate');
  }
  
  // Failure patterns
  if (allContent.includes('vague') && allContent.includes('reject')) {
    failurePatterns.push('Vague answers without specifics often lead to rejection');
  }
  if (allContent.includes('buzzword') && allContent.includes('didn\'t')) {
    failurePatterns.push('Overusing buzzwords (synergy, leverage) viewed negatively');
    warnings.push('Avoid buzzwords - use plain language');
  }
  
  // Extract process and salary intel (NEW!)
  const processIntel = extractProcessIntelligence(searchResults);
  const salaryData = extractSalaryData(searchResults);
  
  // Cultural signals (NEW!)
  const culturalSignals: string[] = [];
  if (allContent.includes('casual') || allContent.includes('laid back')) {
    culturalSignals.push('Casual work environment');
  }
  if (allContent.includes('formal') || allContent.includes('corporate')) {
    culturalSignals.push('Formal corporate culture');
  }
  if (allContent.includes('fast-paced') || allContent.includes('startup')) {
    culturalSignals.push('Fast-paced, startup-like');
  }
  
  return {
    questions: [...new Set(questions)],
    interviewerValidations,
    successPatterns,
    failurePatterns,
    warnings,
    processIntel,
    salaryData,
    culturalSignals
  };
}

/**
 * Helper: Extract questions from search results (existing behavior)
 */
export function extractQuestionsOnly(searchResults: any[]): string[] {
  const intel = extractWebIntelligence(searchResults, []);
  return intel.questions;
}

