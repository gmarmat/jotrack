/**
 * Standardized AI Output Schemas
 * All AI analysis outputs must conform to these schemas
 */

export interface Source {
  url: string;
  title: string;
  type: 'financial_report' | 'news' | 'glassdoor' | 'linkedin' | 'other';
  dateAccessed: string;
  relevance?: string;
}

// Match Score Output Schema
export interface MatchScoreOutput {
  overallScore: number; // 0-1
  categoryScores: {
    technical: number; // 0-1
    experience: number; // 0-1
    domain: number; // 0-1
  };
  signals: Array<{
    id: string;
    name: string;
    category: 'technical' | 'experience' | 'domain';
    weight: number;
    score: number;
    evidence: string;
    reasoning: string;
    source: 'ats' | 'dynamic';
  }>;
  highlights: string[];
  gaps: string[];
  recommendations: string[];
  sources: Source[];
}

// Company Intelligence Output Schema
export interface CompanyIntelligenceOutput {
  name: string;
  tldr: string;
  founded?: number;
  employees?: string;
  funding?: string;
  revenue?: string;
  description: string;
  financials: {
    revenue?: string;
    spendTrend: Array<{
      year: number;
      category: string;
      amount: string;
    }>;
  };
  principles: string[];
  culture: {
    glassdoorComments: string[];
    keywords: string[];
    values: string[];
  };
  news: Array<{
    title: string;
    date: string;
    summary: string;
    url?: string;
  }>;
  leadership: Array<{
    name: string;
    role: string;
    background?: string;
  }>;
  competitors: string[];
  sources: Source[];
}

// People Profiles Output Schema
export interface PeopleProfilesOutput {
  profiles: Array<{
    name: string;
    role: string;
    linkedInUrl?: string | null;
    background: string[];
    expertise: string[];
    communicationStyle?: string;
    whatThisMeans: string;
  }>;
  overallInsights: {
    teamDynamics: string;
    culturalFit: string;
    preparationTips: string[];
  };
  sources: Source[];
}

// Company Ecosystem Output Schema
export interface CompanyEcosystemOutput {
  companies: Array<{
    name: string;
    relevanceScore: number; // 0-100
    fitScore: number; // 0-100
    similarityScore: number; // 0-100
    reason: string;
    category: 'direct' | 'adjacent';
  }>;
  sources: Source[];
}

// Skills Match Output Schema
export interface SkillsMatchOutput {
  skills: Array<{
    term: string;
    jdCount: number;
    resumeCount: number;
    fullProfileCount: number;
    importance: number; // 0-1 (for word cloud sizing)
    matchStatus: 'have' | 'partial' | 'missing';
  }>;
  categoryScores: Array<{
    name: string;
    jdRequired: number; // 0-100
    resumeCoverage: number; // 0-100
    profileBonus: number; // 0-100
    totalScore: number; // 0-100
  }>;
  sources: Source[];
}

/**
 * Validate output against schema
 * This should be used in API routes before returning data to UI
 */
export function validateMatchScore(data: any): data is MatchScoreOutput {
  return (
    typeof data === 'object' &&
    typeof data.overallScore === 'number' &&
    typeof data.categoryScores === 'object' &&
    Array.isArray(data.signals) &&
    Array.isArray(data.highlights) &&
    Array.isArray(data.gaps) &&
    Array.isArray(data.recommendations) &&
    Array.isArray(data.sources)
  );
}

export function validateCompanyIntelligence(data: any): data is CompanyIntelligenceOutput {
  return (
    typeof data === 'object' &&
    typeof data.name === 'string' &&
    typeof data.tldr === 'string' &&
    typeof data.description === 'string' &&
    typeof data.financials === 'object' &&
    Array.isArray(data.principles) &&
    typeof data.culture === 'object' &&
    Array.isArray(data.news) &&
    Array.isArray(data.leadership) &&
    Array.isArray(data.competitors) &&
    Array.isArray(data.sources)
  );
}

export function validatePeopleProfiles(data: any): data is PeopleProfilesOutput {
  return (
    typeof data === 'object' &&
    Array.isArray(data.profiles) &&
    typeof data.overallInsights === 'object' &&
    Array.isArray(data.sources)
  );
}

export function validateCompanyEcosystem(data: any): data is CompanyEcosystemOutput {
  return (
    typeof data === 'object' &&
    Array.isArray(data.companies) &&
    Array.isArray(data.sources)
  );
}

export function validateSkillsMatch(data: any): data is SkillsMatchOutput {
  return (
    typeof data === 'object' &&
    Array.isArray(data.skills) &&
    Array.isArray(data.categoryScores) &&
    Array.isArray(data.sources)
  );
}

/**
 * Generic validation with detailed error messages
 */
export function validateSchema<T>(
  data: any,
  validator: (data: any) => data is T,
  schemaName: string
): { valid: boolean; data?: T; error?: string } {
  if (validator(data)) {
    return { valid: true, data };
  }
  return {
    valid: false,
    error: `Data does not conform to ${schemaName} schema`,
  };
}

