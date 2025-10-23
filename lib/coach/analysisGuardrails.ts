import crypto from 'crypto';

export interface AnalysisInputs {
  jdText: string;
  resumeText: string;
  notesText?: string;
  peopleUrls?: string[];
  companyUrls?: string[];
}

export interface GuardrailCheckResult {
  canProceed: boolean;
  reason?: string;
  warningMessage?: string;
  cooldownRemaining?: number; // seconds
  estimatedTokens?: number;
  estimatedCost?: number;
}

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const ESTIMATED_TOKENS_PER_ANALYSIS = 2000;
const COST_PER_1K_TOKENS = 0.002; // Pricing varies by model - check Settings Modal for current model costs

// In-memory store for last analysis times (would be better in Redis for production)
const lastAnalysisMap = new Map<string, { hash: string; timestamp: number }>();

/**
 * Generate a hash of the analysis inputs to detect changes
 */
export function hashAnalysisInputs(inputs: AnalysisInputs): string {
  const normalized = {
    jd: inputs.jdText?.trim() || '',
    resume: inputs.resumeText?.trim() || '',
    notes: inputs.notesText?.trim() || '',
    people: (inputs.peopleUrls || []).sort().join('|'),
    companies: (inputs.companyUrls || []).sort().join('|'),
  };
  
  const content = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Check if analysis can proceed based on guardrails
 */
export function checkAnalysisGuardrails(
  jobId: string,
  inputs: AnalysisInputs,
  override: boolean = false
): GuardrailCheckResult {
  const currentHash = hashAnalysisInputs(inputs);
  const lastAnalysis = lastAnalysisMap.get(jobId);
  const now = Date.now();

  // 1. Change Detection
  if (lastAnalysis && lastAnalysis.hash === currentHash && !override) {
    return {
      canProceed: false,
      reason: 'no_changes',
      warningMessage: 'No changes detected since last analysis. Re-run anyway?',
      estimatedTokens: ESTIMATED_TOKENS_PER_ANALYSIS,
      estimatedCost: (ESTIMATED_TOKENS_PER_ANALYSIS / 1000) * COST_PER_1K_TOKENS,
    };
  }

  // 2. Cooldown Timer
  if (lastAnalysis && !override) {
    const elapsed = now - lastAnalysis.timestamp;
    if (elapsed < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      
      return {
        canProceed: false,
        reason: 'cooldown',
        warningMessage: `Please wait ${minutes}m ${seconds}s before running another analysis.`,
        cooldownRemaining: remaining,
      };
    }
  }

  // 3. Token Budget Estimate
  const estimatedCost = (ESTIMATED_TOKENS_PER_ANALYSIS / 1000) * COST_PER_1K_TOKENS;

  return {
    canProceed: true,
    estimatedTokens: ESTIMATED_TOKENS_PER_ANALYSIS,
    estimatedCost,
    warningMessage: `This will use ~${ESTIMATED_TOKENS_PER_ANALYSIS} tokens (~$${estimatedCost.toFixed(4)})`,
  };
}

/**
 * Record that an analysis was performed
 */
export function recordAnalysis(jobId: string, inputs: AnalysisInputs): void {
  const hash = hashAnalysisInputs(inputs);
  lastAnalysisMap.set(jobId, {
    hash,
    timestamp: Date.now(),
  });
}

/**
 * Reset cooldown for a specific job (admin override)
 */
export function resetCooldown(jobId: string): void {
  lastAnalysisMap.delete(jobId);
}

/**
 * Get time remaining in cooldown (in seconds)
 */
export function getCooldownRemaining(jobId: string): number {
  const lastAnalysis = lastAnalysisMap.get(jobId);
  if (!lastAnalysis) return 0;

  const elapsed = Date.now() - lastAnalysis.timestamp;
  if (elapsed >= COOLDOWN_MS) return 0;

  return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
}

