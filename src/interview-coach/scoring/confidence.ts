/**
 * Interview Coach Confidence & Reasons System
 * 
 * Provides confidence scoring and explanatory reasons for interview answer evaluations.
 * Uses weighted geometric mean of signals coverage, evidence quality, and model confidence.
 */

import { ScoringContext } from './rules';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfidenceInputs {
  signalsCoverage: number;    // [0,1] - which signals are present
  evidenceQuality: number;    // [0,1] - recency + diversity of sources
  modelConfidence?: number;   // [0,1] - optional, default 0.85 for rule-only
}

export interface ConfidenceResult {
  confidence: number;         // [0,1] - final confidence score
  reasons: string[];          // Top-3 explanatory reasons
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

/**
 * Compute confidence using weighted geometric mean
 * Formula: ((0.45*signals) * (0.35*evidence) * (0.20*model))^(1/3)
 */
export function computeConfidence(inputs: ConfidenceInputs): ConfidenceResult {
  const { signalsCoverage, evidenceQuality, modelConfidence = 0.85 } = inputs;
  
  // Clamp inputs to [0,1]
  const signals = Math.max(0, Math.min(1, signalsCoverage));
  const evidence = Math.max(0, Math.min(1, evidenceQuality));
  const model = Math.max(0, Math.min(1, modelConfidence));
  
  // Weighted geometric mean
  // Weights: 0.45 signals, 0.35 evidence, 0.20 model
  const weightedProduct = Math.pow(signals, 0.45) * Math.pow(evidence, 0.35) * Math.pow(model, 0.20);
  const confidence = Math.pow(weightedProduct, 1 / (0.45 + 0.35 + 0.20));
  
  // Clamp final result
  const finalConfidence = Math.max(0, Math.min(1, confidence));
  
  // Generate reasons
  const reasons = generateReasons(signals, evidence, model);
  
  return {
    confidence: finalConfidence,
    reasons: reasons.slice(0, 3), // Top 3 reasons
  };
}

/**
 * Generate explanatory reasons based on input values
 * Always returns exactly 3 reasons
 */
function generateReasons(signals: number, evidence: number, model: number): string[] {
  const reasons: string[] = [];
  
  // Signals coverage reasons
  if (signals < 0.3) {
    reasons.push('missing interviewer profile');
  } else if (signals < 0.6) {
    reasons.push('limited context signals available');
  } else if (signals > 0.8) {
    reasons.push('strong signal coverage across all dimensions');
  } else {
    reasons.push('moderate signal coverage available');
  }
  
  // Evidence quality reasons
  if (evidence < 0.3) {
    reasons.push('thin community reports for this company+role');
  } else if (evidence < 0.6) {
    reasons.push('moderate evidence quality from available sources');
  } else if (evidence > 0.8) {
    reasons.push('rich evidence from diverse recent sources');
  } else {
    reasons.push('adequate evidence quality from sources');
  }
  
  // Model confidence reasons
  if (model < 0.7) {
    reasons.push('model uncertainty in evaluation');
  } else if (model > 0.9) {
    reasons.push('high model confidence in assessment');
  } else {
    reasons.push('standard model confidence level');
  }
  
  // Replace with combined reasons if applicable
  if (signals > 0.7 && evidence > 0.7) {
    reasons[0] = 'company values present; strong JD alignment';
  }
  
  if (signals > 0.8 && evidence > 0.8 && model > 0.8) {
    reasons[0] = 'comprehensive evaluation with high confidence';
  }
  
  if (signals < 0.4 && evidence < 0.4) {
    reasons[0] = 'insufficient context and evidence for reliable assessment';
  }
  
  return reasons;
}

// ============================================================================
// SIGNALS COVERAGE HELPER
// ============================================================================

/**
 * Derive signals coverage from scoring context
 * Simple boolean map → average of present signals
 */
export function deriveSignalsCoverage(ctx: ScoringContext): number {
  const signals = {
    hasJD: Boolean(ctx.jdCore && ctx.jdCore.trim().length > 0),
    hasCompanyValues: Boolean(ctx.companyValues && ctx.companyValues.length > 0),
    hasInterviewer: Boolean(ctx.styleProfileId && ctx.styleProfileId.trim().length > 0),
    hasUserProfile: Boolean(ctx.userProfile),
    hasCommunityQs: Boolean(ctx.matchMatrix), // Assuming matchMatrix indicates community data
  };
  
  const presentCount = Object.values(signals).filter(Boolean).length;
  const totalCount = Object.keys(signals).length;
  
  return presentCount / totalCount;
}

// ============================================================================
// EVIDENCE QUALITY ESTIMATION
// ============================================================================

/**
 * Estimate evidence quality based on available context
 * This is a simplified heuristic - in production, this would analyze
 * recency, diversity, and source reliability
 */
export function estimateEvidenceQuality(ctx: ScoringContext): number {
  let quality = 0.5; // Base quality
  
  // JD presence and length
  if (ctx.jdCore && ctx.jdCore.length > 100) {
    quality += 0.2;
  }
  
  // Company values presence
  if (ctx.companyValues && ctx.companyValues.length > 0) {
    quality += 0.15;
  }
  
  // User profile richness
  if (ctx.userProfile && typeof ctx.userProfile === 'object') {
    const profileKeys = Object.keys(ctx.userProfile);
    if (profileKeys.length > 3) {
      quality += 0.1;
    }
  }
  
  // Match matrix indicates community data
  if (ctx.matchMatrix) {
    quality += 0.05;
  }
  
  return Math.max(0, Math.min(1, quality));
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Compute confidence directly from scoring context
 */
export function computeConfidenceFromContext(ctx: ScoringContext, modelConfidence?: number): ConfidenceResult {
  const signalsCoverage = deriveSignalsCoverage(ctx);
  const evidenceQuality = estimateEvidenceQuality(ctx);
  
  return computeConfidence({
    signalsCoverage,
    evidenceQuality,
    modelConfidence,
  });
}
