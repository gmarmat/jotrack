/**
 * Interview Coach Score v2 Schema
 * 
 * Defines the scoring dimensions, weight maps, penalties, and ceiling rules
 * used to evaluate interview answers across different personas.
 */

/**
 * Scoring Dimensions
 * Each dimension contributes to the overall score (0-100)
 */
export type DimensionType = 'structure' | 'specificity' | 'outcome' | 'role' | 'company' | 'persona' | 'risks' | 'clarity';

export interface Dimension {
  name: DimensionType;
  label: string;
  description: string;
  weight: number; // 0-1, will be normalized
  maxScore: number; // 0-100
}

/**
 * Persona Types - determines how answers are weighted
 */
export type PersonaType = 'recruiter' | 'hiring-manager' | 'peer';

/**
 * Persona Weight Configuration
 * Defines how each dimension is weighted for different personas
 */
export interface PersonaWeights {
  recruiter: Record<DimensionType, number>;
  'hiring-manager': Record<DimensionType, number>;
  peer: Record<DimensionType, number>;
}

/**
 * Red Flag
 * Defines penalties for negative indicators in answers
 */
export interface RedFlag {
  name: string;
  description: string;
  penalty: number; // -1 to -20 points
  keywords: string[];
}

/**
 * Ceiling Rule Hook Signature
 * Function that determines if a score should be capped based on conditions
 */
export type CeilingRuleHook = (params: {
  baseScore: number;
  dimension: DimensionType;
  persona: PersonaType;
  answerLength: number;
  redFlagCount: number;
  dimensionScores: Record<DimensionType, number>;
}) => number;

/**
 * Score v2 Configuration
 * Master configuration object with all scoring parameters
 */
export interface ScoreV2Config {
  version: '2.0';
  dimensions: Dimension[];
  personaWeights: PersonaWeights;
  redFlags: RedFlag[];
  ceilingRules: CeilingRuleHook[];
  minAnswerLength: number;
  maxPenalties: number; // Max total penalties cap
}

// ============================================================================
// DIMENSION DEFINITIONS
// ============================================================================

export const DIMENSIONS: Dimension[] = [
  {
    name: 'structure',
    label: 'Structure & Organization',
    description: 'Answer follows STAR format (Situation, Task, Action, Result)',
    weight: 0.15,
    maxScore: 100,
  },
  {
    name: 'specificity',
    label: 'Specificity & Detail',
    description: 'Answer includes concrete details, numbers, and specific examples',
    weight: 0.20,
    maxScore: 100,
  },
  {
    name: 'outcome',
    label: 'Outcomes & Impact',
    description: 'Answer clearly demonstrates results and business impact',
    weight: 0.20,
    maxScore: 100,
  },
  {
    name: 'role',
    label: 'Role Relevance',
    description: 'Answer aligns with target role requirements and responsibilities',
    weight: 0.15,
    maxScore: 100,
  },
  {
    name: 'company',
    label: 'Company Fit',
    description: 'Answer demonstrates understanding of company culture and values',
    weight: 0.10,
    maxScore: 100,
  },
  {
    name: 'persona',
    label: 'Persona Alignment',
    description: 'Answer resonates with the specific interviewer persona',
    weight: 0.10,
    maxScore: 100,
  },
  {
    name: 'risks',
    label: 'Risk Assessment',
    description: 'Answer avoids red flags and potential concerns',
    weight: 0.10,
    maxScore: 100,
  },
  {
    name: 'clarity',
    label: 'Clarity & Communication',
    description: 'Answer is clear, well-written, and easy to understand',
    weight: 0.05, // Reduced weight for Practice mode
    maxScore: 100,
  },
];

// ============================================================================
// TEXT NORMALIZATION FOR PRACTICE MODE
// ============================================================================

/**
 * Normalize text for structure heuristics - reduces impact of typos/grammar in Practice mode
 */
export function normalizeTextForPractice(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple whitespace
    .replace(/[^\w\s.,!?;:]/g, '') // Remove most punctuation except basic sentence structure
    .replace(/\b(um|uh|like|you know)\b/g, '') // Remove filler words
    .trim();
}

// ============================================================================
// PERSONA WEIGHT MAPS
// ============================================================================

export const PERSONA_WEIGHTS: PersonaWeights = {
  recruiter: {
    structure: 0.12,
    specificity: 0.18,
    outcome: 0.22,
    role: 0.15,
    company: 0.08,
    persona: 0.15, // Higher for recruiter (they want cultural fit)
    risks: 0.10,
  },
  'hiring-manager': {
    structure: 0.15,
    specificity: 0.22,
    outcome: 0.22,
    role: 0.20, // Higher for HM (they focus on job fit)
    company: 0.08,
    persona: 0.08,
    risks: 0.05,
  },
  peer: {
    structure: 0.15,
    specificity: 0.20,
    outcome: 0.18,
    role: 0.18,
    company: 0.12,
    persona: 0.10,
    risks: 0.07,
  },
};

// ============================================================================
// RED FLAG PENALTIES
// ============================================================================

export const RED_FLAGS: RedFlag[] = [
  {
    name: 'weak-ownership',
    description: 'Answer lacks personal accountability (uses "we" instead of "I")',
    penalty: -5,
    keywords: ['we', 'team did', 'others helped', 'it was a group effort'],
  },
  {
    name: 'vague-outcome',
    description: 'Outcome is unclear or unquantified',
    penalty: -8,
    keywords: ['improved', 'better', 'good results', 'successful', 'worked out'],
  },
  {
    name: 'negative-framing',
    description: 'Answer emphasizes problems without solutions',
    penalty: -10,
    keywords: ['failed', 'problem', 'issue', 'mistake', 'bad', 'wrong'],
  },
  {
    name: 'generic-answer',
    description: 'Answer could apply to any role or company',
    penalty: -8,
    keywords: ['generally', 'typically', 'usually', 'in general', 'always'],
  },
  {
    name: 'excessive-criticism',
    description: 'Answer includes excessive criticism of previous employer or colleagues',
    penalty: -15,
    keywords: ['terrible', 'awful', 'incompetent', 'stupid', 'hate', 'disrespect'],
  },
  {
    name: 'overconfidence',
    description: 'Answer shows arrogance or unrealistic claims',
    penalty: -8,
    keywords: ['best', 'genius', 'perfect', 'only one', 'nobody else'],
  },
  {
    name: 'incomplete-answer',
    description: 'Answer is too short or missing key STAR elements',
    penalty: -12,
    keywords: [], // Handled by length check
  },
];

// ============================================================================
// CEILING RULE HOOKS (Function Signatures Only)
// ============================================================================

/**
 * Ceiling Rule: Insufficient Length
 * If answer is too short, cap score even if dimensions are high
 */
export const ceilingRuleInsufficientLength: CeilingRuleHook = ({
  baseScore,
  answerLength,
}) => {
  if (answerLength < 50) return Math.min(baseScore, 40);
  if (answerLength < 100) return Math.min(baseScore, 60);
  return baseScore;
};

/**
 * Ceiling Rule: High Red Flag Count
 * Multiple red flags significantly cap the score
 */
export const ceilingRuleHighRedFlags: CeilingRuleHook = ({
  baseScore,
  redFlagCount,
}) => {
  if (redFlagCount >= 4) return Math.min(baseScore, 45);
  if (redFlagCount >= 3) return Math.min(baseScore, 60);
  if (redFlagCount >= 2) return Math.min(baseScore, 75);
  return baseScore;
};

/**
 * Ceiling Rule: Dimension Imbalance
 * If one dimension is significantly weaker, cap overall score
 */
export const ceilingRuleDimensionImbalance: CeilingRuleHook = ({
  baseScore,
  dimensionScores,
}) => {
  const scores = Object.values(dimensionScores);
  const minScore = Math.min(...scores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // If weakest dimension is >25 points below average, apply ceiling
  if (minScore < avgScore - 25) {
    return Math.min(baseScore, Math.max(60, avgScore));
  }

  return baseScore;
};

/**
 * Ceiling Rule: Persona Mismatch
 * If persona alignment is weak, cap score
 */
export const ceilingRulePersonaMismatch: CeilingRuleHook = ({
  baseScore,
  dimensionScores,
  persona,
}) => {
  if (dimensionScores.persona < 40) {
    return Math.min(baseScore, 70);
  }
  if (dimensionScores.persona < 55) {
    return Math.min(baseScore, 85);
  }
  return baseScore;
};

// ============================================================================
// DEFAULT SCORE V2 CONFIG
// ============================================================================

export const DEFAULT_SCORE_V2_CONFIG: ScoreV2Config = {
  version: '2.0',
  dimensions: DIMENSIONS,
  personaWeights: PERSONA_WEIGHTS,
  redFlags: RED_FLAGS,
  ceilingRules: [
    ceilingRuleInsufficientLength,
    ceilingRuleHighRedFlags,
    ceilingRuleDimensionImbalance,
    ceilingRulePersonaMismatch,
  ],
  minAnswerLength: 50, // Minimum characters for valid answer
  maxPenalties: -30, // Penalties capped at -30 points
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate that dimension weights sum to 1.0 (within tolerance)
 */
export function validateDimensionWeights(config: ScoreV2Config): boolean {
  const totalWeight = config.dimensions.reduce((sum, d) => sum + d.weight, 0);
  return Math.abs(totalWeight - 1.0) < 0.001;
}

/**
 * Validate that persona weights sum to 1.0 for each persona
 */
export function validatePersonaWeights(config: ScoreV2Config): boolean {
  for (const persona of Object.keys(config.personaWeights) as PersonaType[]) {
    const weights = Object.values(config.personaWeights[persona]);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      return false;
    }
  }
  return true;
}

/**
 * Validate red flag penalties are within acceptable range
 */
export function validateRedFlagPenalties(config: ScoreV2Config): boolean {
  return config.redFlags.every((flag) => flag.penalty >= -20 && flag.penalty <= -1);
}

/**
 * Get ceiling rules (validates they are callable functions)
 */
export function getCeilingRules(config: ScoreV2Config): CeilingRuleHook[] {
  return config.ceilingRules.filter((rule) => typeof rule === 'function');
}

/**
 * Get persona weights for a specific persona
 */
export function getPersonaWeights(
  config: ScoreV2Config,
  persona: PersonaType
): Record<DimensionType, number> {
  return config.personaWeights[persona];
}

/**
 * Get dimension by name
 */
export function getDimension(config: ScoreV2Config, name: DimensionType): Dimension | undefined {
  return config.dimensions.find((d) => d.name === name);
}
