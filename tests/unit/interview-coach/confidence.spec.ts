/**
 * Interview Coach Confidence System Tests
 * 
 * Tests confidence calculation, reasons generation, and edge cases.
 * Coverage target: ≥80% for confidence.ts
 */

import { describe, it, expect } from 'vitest';
import {
  computeConfidence,
  deriveSignalsCoverage,
  estimateEvidenceQuality,
  computeConfidenceFromContext,
  ConfidenceInputs,
} from '../../../src/interview-coach/scoring/confidence';
import { ScoringContext } from '../../../src/interview-coach/scoring/rules';

// ============================================================================
// CONFIDENCE CALCULATION TESTS
// ============================================================================

describe('computeConfidence', () => {
  it('should handle low inputs with appropriate confidence and reasons', () => {
    const inputs: ConfidenceInputs = {
      signalsCoverage: 0.2,
      evidenceQuality: 0.1,
      modelConfidence: 0.6,
    };
    
    const result = computeConfidence(inputs);
    
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.reasons).toHaveLength(3);
    expect(result.reasons.some(r => r.includes('missing interviewer profile'))).toBe(true);
    expect(result.reasons.some(r => r.includes('thin community reports'))).toBe(true);
  });

  it('should handle strong inputs with high confidence and positive reasons', () => {
    const inputs: ConfidenceInputs = {
      signalsCoverage: 0.9,
      evidenceQuality: 0.85,
      modelConfidence: 0.95,
    };
    
    const result = computeConfidence(inputs);
    
    expect(result.confidence).toBeGreaterThan(0.75);
    expect(result.reasons).toHaveLength(3);
    expect(result.reasons.some(r => r.includes('strong signal coverage'))).toBe(true);
    expect(result.reasons.some(r => r.includes('rich evidence'))).toBe(true);
  });

  it('should handle mixed inputs with mid confidence and mixed reasons', () => {
    const inputs: ConfidenceInputs = {
      signalsCoverage: 0.6,
      evidenceQuality: 0.4,
      modelConfidence: 0.8,
    };
    
    const result = computeConfidence(inputs);
    
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.confidence).toBeLessThan(0.8);
    expect(result.reasons).toHaveLength(3);
  });

  it('should clamp edge cases to [0,1]', () => {
    // Test negative values
    const negativeInputs: ConfidenceInputs = {
      signalsCoverage: -0.5,
      evidenceQuality: -0.2,
      modelConfidence: -0.1,
    };
    
    const negativeResult = computeConfidence(negativeInputs);
    expect(negativeResult.confidence).toBeGreaterThanOrEqual(0);
    expect(negativeResult.confidence).toBeLessThanOrEqual(1);
    
    // Test values > 1
    const highInputs: ConfidenceInputs = {
      signalsCoverage: 1.5,
      evidenceQuality: 2.0,
      modelConfidence: 1.8,
    };
    
    const highResult = computeConfidence(highInputs);
    expect(highResult.confidence).toBeGreaterThanOrEqual(0);
    expect(highResult.confidence).toBeLessThanOrEqual(1);
  });

  it('should use default model confidence when not provided', () => {
    const inputs: ConfidenceInputs = {
      signalsCoverage: 0.8,
      evidenceQuality: 0.7,
      // modelConfidence not provided
    };
    
    const result = computeConfidence(inputs);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.reasons).toHaveLength(3);
  });

  it('should generate appropriate reasons for different scenarios', () => {
    // Low signals, high evidence
    const scenario1 = computeConfidence({
      signalsCoverage: 0.2,
      evidenceQuality: 0.9,
      modelConfidence: 0.8,
    });
    expect(scenario1.reasons.some(r => r.includes('missing interviewer profile'))).toBe(true);
    expect(scenario1.reasons.some(r => r.includes('rich evidence'))).toBe(true);
    
    // High signals, low evidence
    const scenario2 = computeConfidence({
      signalsCoverage: 0.9,
      evidenceQuality: 0.2,
      modelConfidence: 0.8,
    });
    expect(scenario2.reasons.some(r => r.includes('strong signal coverage'))).toBe(true);
    expect(scenario2.reasons.some(r => r.includes('thin community reports'))).toBe(true);
    
    // All high
    const scenario3 = computeConfidence({
      signalsCoverage: 0.9,
      evidenceQuality: 0.9,
      modelConfidence: 0.9,
    });
    expect(scenario3.reasons.some(r => r.includes('comprehensive evaluation'))).toBe(true);
  });
});

// ============================================================================
// SIGNALS COVERAGE TESTS
// ============================================================================

describe('deriveSignalsCoverage', () => {
  it('should return 0 for empty context', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
    };
    
    const coverage = deriveSignalsCoverage(ctx);
    expect(coverage).toBe(0);
  });

  it('should return 1 for fully populated context', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
      jdCore: 'Software Engineer role with React experience',
      companyValues: ['innovation', 'collaboration'],
      userProfile: { experience: '5 years', skills: ['React', 'Node.js'] },
      matchMatrix: { score: 85 },
      styleProfileId: 'profile-123',
    };
    
    const coverage = deriveSignalsCoverage(ctx);
    expect(coverage).toBe(1);
  });

  it('should return partial coverage for mixed context', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'hiring-manager',
      jdCore: 'Senior Developer position',
      companyValues: ['excellence'],
      // Missing: userProfile, matchMatrix, styleProfileId
    };
    
    const coverage = deriveSignalsCoverage(ctx);
    expect(coverage).toBe(0.4); // 2 out of 5 signals present
  });

  it('should handle empty strings and null values', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'peer',
      jdCore: '', // Empty string
      companyValues: [], // Empty array
      styleProfileId: null, // Null value
    };
    
    const coverage = deriveSignalsCoverage(ctx);
    expect(coverage).toBe(0);
  });
});

// ============================================================================
// EVIDENCE QUALITY TESTS
// ============================================================================

describe('estimateEvidenceQuality', () => {
  it('should return base quality for minimal context', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
    };
    
    const quality = estimateEvidenceQuality(ctx);
    expect(quality).toBe(0.5);
  });

  it('should increase quality with rich JD', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
      jdCore: 'Senior Software Engineer position requiring 5+ years of experience with React, Node.js, and cloud technologies. Must have experience with microservices architecture and agile development methodologies.',
    };
    
    const quality = estimateEvidenceQuality(ctx);
    expect(quality).toBeGreaterThan(0.5);
  });

  it('should increase quality with company values', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
      companyValues: ['innovation', 'collaboration', 'excellence', 'integrity'],
    };
    
    const quality = estimateEvidenceQuality(ctx);
    expect(quality).toBeGreaterThan(0.5);
  });

  it('should increase quality with rich user profile', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
      userProfile: {
        experience: '5 years',
        skills: ['React', 'Node.js', 'TypeScript'],
        education: 'Computer Science',
        certifications: ['AWS', 'Google Cloud'],
      },
    };
    
    const quality = estimateEvidenceQuality(ctx);
    expect(quality).toBeGreaterThan(0.5);
  });

  it('should cap quality at 1.0', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
      jdCore: 'Very detailed job description with many requirements and qualifications',
      companyValues: ['value1', 'value2', 'value3'],
      userProfile: { key1: 'val1', key2: 'val2', key3: 'val3', key4: 'val4' },
      matchMatrix: { score: 90 },
    };
    
    const quality = estimateEvidenceQuality(ctx);
    expect(quality).toBeLessThanOrEqual(1.0);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('computeConfidenceFromContext', () => {
  it('should work with minimal context', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
    };
    
    const result = computeConfidenceFromContext(ctx);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.reasons).toHaveLength(3);
  });

  it('should work with rich context', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'hiring-manager',
      jdCore: 'Senior Software Engineer with React and Node.js experience',
      companyValues: ['innovation', 'collaboration'],
      userProfile: { experience: '5 years', skills: ['React', 'Node.js'] },
      matchMatrix: { score: 85 },
      styleProfileId: 'profile-123',
    };
    
    const result = computeConfidenceFromContext(ctx, 0.9);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.reasons).toHaveLength(3);
  });

  it('should use provided model confidence', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'peer',
      jdCore: 'Software Engineer role',
    };
    
    const resultLow = computeConfidenceFromContext(ctx, 0.3);
    const resultHigh = computeConfidenceFromContext(ctx, 0.9);
    
    expect(resultLow.confidence).toBeLessThan(resultHigh.confidence);
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('Edge Cases', () => {
  it('should handle undefined and null values gracefully', () => {
    const ctx: ScoringContext = {
      answer: 'test answer',
      persona: 'recruiter',
      jdCore: undefined,
      companyValues: undefined,
      userProfile: undefined,
      matchMatrix: undefined,
      styleProfileId: undefined,
    };
    
    const result = computeConfidenceFromContext(ctx);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should handle extreme values in inputs', () => {
    const extremeInputs: ConfidenceInputs = {
      signalsCoverage: 0.0001,
      evidenceQuality: 0.9999,
      modelConfidence: 0.5,
    };
    
    const result = computeConfidence(extremeInputs);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should always return exactly 3 reasons', () => {
    const inputs: ConfidenceInputs = {
      signalsCoverage: 0.5,
      evidenceQuality: 0.5,
      modelConfidence: 0.5,
    };
    
    const result = computeConfidence(inputs);
    expect(result.reasons).toHaveLength(3);
  });
});

// ============================================================================
// MATHEMATICAL PROPERTIES TESTS
// ============================================================================

describe('Mathematical Properties', () => {
  it('should be monotonic with respect to inputs', () => {
    const baseInputs: ConfidenceInputs = {
      signalsCoverage: 0.5,
      evidenceQuality: 0.5,
      modelConfidence: 0.5,
    };
    
    const baseResult = computeConfidence(baseInputs);
    
    // Increase signals coverage
    const higherSignals = computeConfidence({ ...baseInputs, signalsCoverage: 0.8 });
    expect(higherSignals.confidence).toBeGreaterThan(baseResult.confidence);
    
    // Increase evidence quality
    const higherEvidence = computeConfidence({ ...baseInputs, evidenceQuality: 0.8 });
    expect(higherEvidence.confidence).toBeGreaterThan(baseResult.confidence);
    
    // Increase model confidence
    const higherModel = computeConfidence({ ...baseInputs, modelConfidence: 0.8 });
    expect(higherModel.confidence).toBeGreaterThan(baseResult.confidence);
  });

  it('should handle zero inputs gracefully', () => {
    const zeroInputs: ConfidenceInputs = {
      signalsCoverage: 0,
      evidenceQuality: 0,
      modelConfidence: 0,
    };
    
    const result = computeConfidence(zeroInputs);
    expect(result.confidence).toBe(0);
    expect(result.reasons).toHaveLength(3);
  });

  it('should handle maximum inputs', () => {
    const maxInputs: ConfidenceInputs = {
      signalsCoverage: 1,
      evidenceQuality: 1,
      modelConfidence: 1,
    };
    
    const result = computeConfidence(maxInputs);
    expect(result.confidence).toBe(1);
    expect(result.reasons).toHaveLength(3);
  });
});
