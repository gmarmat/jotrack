import { describe, it, expect } from 'vitest';
import { generateDeltaRationales } from '@/src/interview-coach/discovery/feedback';

describe('Follow-up Delta Rationales', () => {
  describe('generateDeltaRationales', () => {
    it('should generate specificity rationale for NO_METRIC flag', () => {
      const oldSubscores = {
        specificity: 60,
        role: 80,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const newSubscores = {
        specificity: 60, // No improvement
        role: 80,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const flags = ['NO_METRIC'];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result).toContain('Still missing a before/after KPI (time/cost/users). Add a number or timeframe.');
    });

    it('should generate role rationale for WEAK_OWNERSHIP flag', () => {
      const oldSubscores = {
        specificity: 80,
        role: 55,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const newSubscores = {
        specificity: 80,
        role: 55, // No improvement
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const flags = ['WEAK_OWNERSHIP'];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result).toContain('Reads like team-wide effort; add a first-person decision you made.');
    });

    it('should generate outcome rationale for VAGUE_OUTCOME flag', () => {
      const oldSubscores = {
        specificity: 80,
        role: 80,
        outcome: 50,
        clarity: 85,
        structure: 90
      };
      const newSubscores = {
        specificity: 80,
        role: 80,
        outcome: 50, // No improvement
        clarity: 85,
        structure: 90
      };
      const flags = ['VAGUE_OUTCOME'];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result).toContain('States actions, not results; add the effect on users/revenue/latency.');
    });

    it('should generate clarity rationale for unchanged clarity score', () => {
      const oldSubscores = {
        specificity: 80,
        role: 80,
        outcome: 80,
        clarity: 55,
        structure: 90
      };
      const newSubscores = {
        specificity: 80,
        role: 80,
        outcome: 80,
        clarity: 55, // No improvement
        structure: 90
      };
      const flags = [];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result).toContain('Clarity score unchanged. Improve sentence structure and flow.');
    });

    it('should generate structure rationale for unchanged structure score', () => {
      const oldSubscores = {
        specificity: 80,
        role: 80,
        outcome: 80,
        clarity: 85,
        structure: 50
      };
      const newSubscores = {
        specificity: 80,
        role: 80,
        outcome: 80,
        clarity: 85,
        structure: 50 // No improvement
      };
      const flags = [];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result).toContain('Structure score unchanged. Better organize with clear sections and transitions.');
    });

    it('should return empty array when all scores improve', () => {
      const oldSubscores = {
        specificity: 60,
        role: 70,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const newSubscores = {
        specificity: 70, // Improved
        role: 80, // Improved
        outcome: 85, // Improved
        clarity: 90, // Improved
        structure: 95 // Improved
      };
      const flags = [];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result).toEqual([]);
    });

    it('should prioritize lowest scoring dimensions', () => {
      const oldSubscores = {
        specificity: 60,
        role: 55,
        outcome: 80,
        clarity: 85,
        structure: 90
      };
      const newSubscores = {
        specificity: 60, // No improvement
        role: 55, // No improvement (lowest)
        outcome: 80,
        clarity: 85,
        structure: 90
      };
      const flags = [];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result.length).toBeGreaterThan(0);
      // Should include rationale for role (lowest score) and specificity (second lowest)
      expect(result.some(r => r.includes('role') || r.includes('Role'))).toBe(true);
    });

    it('should handle missing flags gracefully', () => {
      const oldSubscores = {
        specificity: 60,
        role: 80,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const newSubscores = {
        specificity: 60, // No improvement
        role: 80,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const flags = [];
      
      const result = generateDeltaRationales(oldSubscores, newSubscores, flags);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Specificity score unchanged');
    });
  });
});
