/**
 * Match Signals System
 * 50 signals: 20 core ATS + 30 dynamic JD-based
 */

export interface Signal {
  id: string;
  name: string;
  category: 'technical' | 'experience' | 'domain';
  weight: number;
  score: number;
  evidence: string;
  reasoning: string;
  source: 'ats' | 'dynamic';
}

/**
 * Core ATS Standard Signals (20 total)
 * Industry-standard parameters used by Applicant Tracking Systems
 */
export const ATS_STANDARD_SIGNALS: Omit<Signal, 'score' | 'evidence' | 'reasoning'>[] = [
  // Technical (7 signals)
  {
    id: 'ats-tech-stack',
    name: 'Required tech stack match',
    category: 'technical',
    weight: 0.08,
    source: 'ats',
  },
  {
    id: 'ats-programming',
    name: 'Programming language proficiency',
    category: 'technical',
    weight: 0.07,
    source: 'ats',
  },
  {
    id: 'ats-framework',
    name: 'Framework/library expertise',
    category: 'technical',
    weight: 0.06,
    source: 'ats',
  },
  {
    id: 'ats-tools',
    name: 'Tool/platform familiarity',
    category: 'technical',
    weight: 0.05,
    source: 'ats',
  },
  {
    id: 'ats-certification',
    name: 'Certification alignment',
    category: 'technical',
    weight: 0.04,
    source: 'ats',
  },
  {
    id: 'ats-vcs',
    name: 'Version control systems',
    category: 'technical',
    weight: 0.03,
    source: 'ats',
  },
  {
    id: 'ats-cicd',
    name: 'CI/CD pipeline knowledge',
    category: 'technical',
    weight: 0.03,
    source: 'ats',
  },

  // Experience (7 signals)
  {
    id: 'ats-years',
    name: 'Years of experience match',
    category: 'experience',
    weight: 0.08,
    source: 'ats',
  },
  {
    id: 'ats-industry',
    name: 'Industry experience',
    category: 'experience',
    weight: 0.07,
    source: 'ats',
  },
  {
    id: 'ats-progression',
    name: 'Role/title progression',
    category: 'experience',
    weight: 0.06,
    source: 'ats',
  },
  {
    id: 'ats-company-size',
    name: 'Company size/type match',
    category: 'experience',
    weight: 0.05,
    source: 'ats',
  },
  {
    id: 'ats-team-size',
    name: 'Team size managed',
    category: 'experience',
    weight: 0.04,
    source: 'ats',
  },
  {
    id: 'ats-project-scale',
    name: 'Project scale/complexity',
    category: 'experience',
    weight: 0.05,
    source: 'ats',
  },
  {
    id: 'ats-remote',
    name: 'Remote work experience',
    category: 'experience',
    weight: 0.03,
    source: 'ats',
  },

  // Domain (6 signals)
  {
    id: 'ats-domain',
    name: 'Domain expertise',
    category: 'domain',
    weight: 0.07,
    source: 'ats',
  },
  {
    id: 'ats-regulatory',
    name: 'Regulatory knowledge',
    category: 'domain',
    weight: 0.04,
    source: 'ats',
  },
  {
    id: 'ats-methodology',
    name: 'Methodology familiarity (Agile, etc)',
    category: 'domain',
    weight: 0.05,
    source: 'ats',
  },
  {
    id: 'ats-soft-skills',
    name: 'Soft skills match',
    category: 'domain',
    weight: 0.05,
    source: 'ats',
  },
  {
    id: 'ats-communication',
    name: 'Communication skills',
    category: 'domain',
    weight: 0.03,
    source: 'ats',
  },
  {
    id: 'ats-leadership',
    name: 'Leadership indicators',
    category: 'domain',
    weight: 0.04,
    source: 'ats',
  },
];

/**
 * Generate dynamic signals based on JD analysis
 * AI will analyze the JD and generate 30 additional signals (10 per category)
 */
export interface DynamicSignalRequest {
  jobDescription: string;
  resume: string;
  companyName?: string;
}

export interface DynamicSignalResponse {
  signals: Signal[];
  reasoning: string;
  categories: {
    technical: Signal[];
    experience: Signal[];
    domain: Signal[];
  };
}

/**
 * Merge ATS and dynamic signals
 */
export function mergeSignals(
  atsSignals: Signal[],
  dynamicSignals: Signal[]
): { all: Signal[]; byCategory: Record<string, Signal[]> } {
  const all = [...atsSignals, ...dynamicSignals];

  const byCategory = {
    technical: all.filter(s => s.category === 'technical'),
    experience: all.filter(s => s.category === 'experience'),
    domain: all.filter(s => s.category === 'domain'),
  };

  return { all, byCategory };
}

/**
 * Calculate aggregate category scores
 */
export function calculateCategoryScores(signals: Signal[]): {
  technical: number;
  experience: number;
  domain: number;
  overall: number;
} {
  const categories = {
    technical: signals.filter(s => s.category === 'technical'),
    experience: signals.filter(s => s.category === 'experience'),
    domain: signals.filter(s => s.category === 'domain'),
  };

  const technicalScore = categories.technical.reduce((sum, s) => sum + s.weight * s.score, 0);
  const experienceScore = categories.experience.reduce((sum, s) => sum + s.weight * s.score, 0);
  const domainScore = categories.domain.reduce((sum, s) => sum + s.weight * s.score, 0);

  const technicalWeight = categories.technical.reduce((sum, s) => sum + s.weight, 0);
  const experienceWeight = categories.experience.reduce((sum, s) => sum + s.weight, 0);
  const domainWeight = categories.domain.reduce((sum, s) => sum + s.weight, 0);

  const overall = technicalScore + experienceScore + domainScore;

  return {
    technical: technicalWeight > 0 ? technicalScore / technicalWeight : 0,
    experience: experienceWeight > 0 ? experienceScore / experienceWeight : 0,
    domain: domainWeight > 0 ? domainScore / domainWeight : 0,
    overall,
  };
}

/**
 * Validate signal schema
 */
export function validateSignal(signal: any): signal is Signal {
  return (
    typeof signal === 'object' &&
    typeof signal.id === 'string' &&
    typeof signal.name === 'string' &&
    ['technical', 'experience', 'domain'].includes(signal.category) &&
    typeof signal.weight === 'number' &&
    typeof signal.score === 'number' &&
    typeof signal.evidence === 'string' &&
    typeof signal.reasoning === 'string' &&
    ['ats', 'dynamic'].includes(signal.source)
  );
}

