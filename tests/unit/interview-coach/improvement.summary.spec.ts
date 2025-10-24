import { describe, it, expect } from 'vitest';
import { summarizeImprovements } from '@/src/interview-coach/scoring/rules';

describe('Improvement Summary', () => {
  describe('summarizeImprovements', () => {
    it('should generate summary for specificity issues with NO_METRIC flag', () => {
      const subscores = {
        specificity: 60,
        role: 80,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const flags = ['NO_METRIC'];
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.summary).toBe('Add 1–2 KPIs and clarify your decision/ownership.');
      expect(result.cta).toBe('Answer the prompts on Specificity + Role to unlock +8–12 pts.');
      expect(result.targeted).toEqual(['specificity', 'role']);
    });

    it('should generate summary for role issues with WEAK_OWNERSHIP flag', () => {
      const subscores = {
        specificity: 80,
        role: 55,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const flags = ['WEAK_OWNERSHIP'];
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.summary).toBe('Clarify your personal role and decision-making authority.');
      expect(result.cta).toBe('Answer the prompts on Role + Outcome to unlock +6–10 pts.');
      expect(result.targeted).toEqual(['role', 'outcome']);
    });

    it('should generate summary for outcome issues with VAGUE_OUTCOME flag', () => {
      const subscores = {
        specificity: 80,
        role: 80,
        outcome: 50,
        clarity: 85,
        structure: 90
      };
      const flags = ['VAGUE_OUTCOME'];
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.summary).toBe('Add specific results and impact metrics.');
      expect(result.cta).toBe('Answer the prompts on Outcome + Specificity to unlock +7–11 pts.');
      expect(result.targeted).toEqual(['outcome', 'specificity']);
    });

    it('should generate summary for clarity issues', () => {
      const subscores = {
        specificity: 80,
        role: 80,
        outcome: 80,
        clarity: 55,
        structure: 90
      };
      const flags = [];
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.summary).toBe('Improve clarity and structure of your response.');
      expect(result.cta).toBe('Answer the prompts on Clarity + Structure to unlock +5–8 pts.');
      expect(result.targeted).toEqual(['clarity', 'structure']);
    });

    it('should generate summary for structure issues', () => {
      const subscores = {
        specificity: 80,
        role: 80,
        outcome: 80,
        clarity: 85,
        structure: 50
      };
      const flags = [];
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.summary).toBe('Better organize your answer with clear sections.');
      expect(result.cta).toBe('Answer the prompts on Structure + Clarity to unlock +4–7 pts.');
      expect(result.targeted).toEqual(['structure', 'clarity']);
    });

    it('should generate generic summary when no specific flags match', () => {
      const subscores = {
        specificity: 70,
        role: 65,
        outcome: 80,
        clarity: 85,
        structure: 90
      };
      const flags = ['OTHER_FLAG'];
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.summary).toBe('Focus on role and specificity to improve your score.');
      expect(result.cta).toBe('Answer the prompts on Role + Specificity to unlock +6–10 pts.');
      expect(result.targeted).toEqual(['role', 'specificity']);
    });

    it('should handle empty subscores gracefully', () => {
      const subscores = {};
      const flags = [];
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.targeted).toEqual([]);
      expect(result.summary).toBeDefined();
      expect(result.cta).toBeDefined();
    });

    it('should prioritize flag-based summaries over dimension-based ones', () => {
      const subscores = {
        specificity: 60,
        role: 55,
        outcome: 75,
        clarity: 85,
        structure: 90
      };
      const flags = ['NO_METRIC']; // This should trigger specificity summary, not role
      
      const result = summarizeImprovements(subscores, flags);
      
      expect(result.summary).toBe('Add 1–2 KPIs and clarify your decision/ownership.');
      expect(result.cta).toBe('Answer the prompts on Specificity + Role to unlock +8–12 pts.');
    });
  });
});
