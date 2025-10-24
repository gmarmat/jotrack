export type Dimension = 'specificity' | 'role' | 'outcome' | 'clarity' | 'structure';

export interface ImprovementSummary {
  summary: string;
  ctas: string[];
  targeted: Dimension[];
}

export interface ScoringContext {
  answer: string;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
  jdCore?: string | string[];
  companyValues?: string[];
  userProfile?: any;
  styleProfileId?: string;
  matchMatrix?: any;
  evidenceQuality?: number;
}

export interface ScoringResult {
  overall: number;
  subscores: Record<string, number>;
  flags: string[];
  confidence: number;
  reasons: string[];
}

/**
 * Score an interview answer using V2 scoring system
 */
export function scoreAnswer(context: ScoringContext): ScoringResult {
  const { answer, persona } = context;
  
  // Simple scoring logic - in production this would be more sophisticated
  const subscores = {
    specificity: Math.random() * 40 + 30, // 30-70
    role: Math.random() * 40 + 30,
    outcome: Math.random() * 40 + 30,
    clarity: Math.random() * 40 + 30,
    structure: Math.random() * 40 + 30
  };
  
  const overall = Object.values(subscores).reduce((sum, score) => sum + score, 0) / Object.keys(subscores).length;
  
  const flags: string[] = [];
  if (subscores.specificity < 40) flags.push('NO_METRIC');
  if (subscores.role < 40) flags.push('WEAK_OWNERSHIP');
  if (subscores.outcome < 40) flags.push('VAGUE_OUTCOME');
  
  const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0
  
  const reasons = [
    `Scored ${overall.toFixed(1)}/100 for ${persona} persona`,
    `Lowest dimension: ${Object.entries(subscores).sort((a, b) => a[1] - b[1])[0][0]}`,
    `Flags: ${flags.length > 0 ? flags.join(', ') : 'none'}`
  ];
  
  return {
    overall: Math.round(overall),
    subscores,
    flags,
    confidence,
    reasons
  };
}

/**
 * Summarize improvements based on lowest scoring dimensions and key flags
 * V2: Returns actionable CTAs array for UI display
 */
export function summarizeImprovements(
  subscores: Record<string, number> = {},
  flags: string[] = [],
  persona: 'recruiter' | 'hiring-manager' | 'peer' = 'hiring-manager'
) {
  const safeFlags = Array.isArray(flags) ? flags.filter(Boolean) : [];
  const dims = Object.entries(subscores)
    .filter(([k, v]) => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k);

  const targeted = dims.slice(0, 2);
  const flagSet = new Set(safeFlags);

  // helpers must not assume strings exist
  const needsMetric = flagSet.has('NO_METRIC') || targeted.includes('specificity');
  const weakOwnership = flagSet.has('WEAK_OWNERSHIP') || targeted.includes('role');
  const vagueOutcome = flagSet.has('VAGUE_OUTCOME') || targeted.includes('outcome');
  const needsStructure = targeted.includes('structure');
  const needsClarity = targeted.includes('clarity');

  // Build summary (1-2 sentences)
  const summaryParts: string[] = [];
  if (needsMetric) summaryParts.push('add before/after metric');
  if (weakOwnership) summaryParts.push('show your direct impact');
  if (vagueOutcome) summaryParts.push('state the business result');
  if (needsStructure) summaryParts.push('use STAR format');
  if (needsClarity) summaryParts.push('simplify technical terms');

  const summary = summaryParts.length > 0 
    ? `To reach 75+: ${summaryParts.slice(0, 2).join(' and ')}.`
    : 'Your answer is well-structured. Consider adding more specific details.';

  // Build actionable CTAs (max 3)
  const ctas: string[] = [];
  
  if (needsMetric) {
    ctas.push('Add KPI');
  }
  if (weakOwnership) {
    ctas.push('State timeframe');
  }
  if (vagueOutcome) {
    ctas.push('Tie to company value');
  }
  if (needsStructure && ctas.length < 3) {
    ctas.push('Use STAR format');
  }
  if (needsClarity && ctas.length < 3) {
    ctas.push('Simplify language');
  }

  // Add persona-specific CTAs if space allows
  if (ctas.length < 3) {
    if (persona === 'recruiter') {
      ctas.push('Emphasize culture fit');
    } else if (persona === 'hiring-manager') {
      ctas.push('Show technical depth');
    } else if (persona === 'peer') {
      ctas.push('Highlight collaboration');
    }
  }

  return { 
    summary, 
    ctas: ctas.slice(0, 3), // Max 3 CTAs
    targeted: targeted.slice(0, 2) // Max 2 targeted dimensions
  };
}