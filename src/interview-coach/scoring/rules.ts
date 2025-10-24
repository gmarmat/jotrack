export type Dimension = 'specificity' | 'role' | 'outcome' | 'clarity' | 'structure';

export interface ImprovementSummary {
  summary: string;
  cta: string;
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
 */
export function summarizeImprovements(
  subscores: Record<string, number> = {},
  flags: string[] = []
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

  const parts: string[] = [];
  if (needsMetric) parts.push('Add 1–2 concrete KPIs (before/after, time, cost, users).');
  if (weakOwnership) parts.push('Call out your decision and direct contribution ("I decided…", "I changed…").');
  if (vagueOutcome) parts.push('State the result in business/user terms (e.g., "cut P95 by 38% for 2.4M users").');

  const summary = parts.slice(0, 2).join(' ');
  const cta = `Answer the prompts on ${targeted.join(' & ')} to unlock +8–12 pts.`;

  return { summary, cta, targeted };
}