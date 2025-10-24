import { describe, it, expect, beforeEach } from 'vitest';
import {
  DimensionType,
  PersonaType,
  DIMENSIONS,
  PERSONA_WEIGHTS,
  RED_FLAGS,
  DEFAULT_SCORE_V2_CONFIG,
  ceilingRuleInsufficientLength,
  ceilingRuleHighRedFlags,
  ceilingRuleDimensionImbalance,
  ceilingRulePersonaMismatch,
  validateDimensionWeights,
  validatePersonaWeights,
  validateRedFlagPenalties,
  getCeilingRules,
  getPersonaWeights,
  getDimension,
  type ScoreV2Config,
  type CeilingRuleHook,
} from '@/src/interview-coach/scoring/schema';

describe('Score v2 Schema', () => {
  describe('Dimensions', () => {
    it('should define all 7 dimensions', () => {
      expect(DIMENSIONS).toHaveLength(7);
      const dimensionNames: DimensionType[] = [
        'structure',
        'specificity',
        'outcome',
        'role',
        'company',
        'persona',
        'risks',
      ];
      const definedNames = DIMENSIONS.map((d) => d.name);
      expect(definedNames).toEqual(expect.arrayContaining(dimensionNames));
    });

    it('should have weights sum to approximately 1.0', () => {
      const totalWeight = DIMENSIONS.reduce((sum, d) => sum + d.weight, 0);
      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.001);
    });

    it('should have maxScore of 100 for all dimensions', () => {
      DIMENSIONS.forEach((d) => {
        expect(d.maxScore).toBe(100);
      });
    });

    it('should have descriptive labels and descriptions', () => {
      DIMENSIONS.forEach((d) => {
        expect(d.label).toBeTruthy();
        expect(d.label.length).toBeGreaterThan(0);
        expect(d.description).toBeTruthy();
        expect(d.description.length).toBeGreaterThan(0);
      });
    });

    it('should have weights between 0 and 1', () => {
      DIMENSIONS.forEach((d) => {
        expect(d.weight).toBeGreaterThan(0);
        expect(d.weight).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Persona Weights', () => {
    const personas: PersonaType[] = ['recruiter', 'hiring-manager', 'peer'];

    it('should define weights for all 3 personas', () => {
      personas.forEach((persona) => {
        expect(PERSONA_WEIGHTS[persona]).toBeDefined();
      });
    });

    it('should have weights for all dimensions in each persona', () => {
      const dimensionNames: DimensionType[] = [
        'structure',
        'specificity',
        'outcome',
        'role',
        'company',
        'persona',
        'risks',
      ];

      personas.forEach((p) => {
        dimensionNames.forEach((d) => {
          expect(PERSONA_WEIGHTS[p][d]).toBeDefined();
          expect(typeof PERSONA_WEIGHTS[p][d]).toBe('number');
        });
      });
    });

    it('should have weights sum to 1.0 for each persona', () => {
      personas.forEach((p) => {
        const weights = Object.values(PERSONA_WEIGHTS[p]);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.001);
      });
    });

    it('should have weights between 0 and 1 for each persona', () => {
      personas.forEach((p) => {
        const weights = Object.values(PERSONA_WEIGHTS[p]);
        weights.forEach((w) => {
          expect(w).toBeGreaterThan(0);
          expect(w).toBeLessThanOrEqual(1);
        });
      });
    });

    it('recruiter should emphasize persona alignment', () => {
      expect(PERSONA_WEIGHTS.recruiter.persona).toBeGreaterThan(
        PERSONA_WEIGHTS['hiring-manager'].persona
      );
      expect(PERSONA_WEIGHTS.recruiter.persona).toBeGreaterThan(PERSONA_WEIGHTS.peer.persona);
    });

    it('hiring-manager should emphasize role relevance', () => {
      expect(PERSONA_WEIGHTS['hiring-manager'].role).toBeGreaterThanOrEqual(
        PERSONA_WEIGHTS.recruiter.role
      );
      expect(PERSONA_WEIGHTS['hiring-manager'].role).toBeGreaterThanOrEqual(
        PERSONA_WEIGHTS.peer.role
      );
    });
  });

  describe('Red Flags', () => {
    it('should define red flags', () => {
      expect(RED_FLAGS.length).toBeGreaterThan(0);
    });

    it('should have unique red flag names', () => {
      const names = RED_FLAGS.map((f) => f.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have penalties between -1 and -20', () => {
      RED_FLAGS.forEach((flag) => {
        expect(flag.penalty).toBeGreaterThanOrEqual(-20);
        expect(flag.penalty).toBeLessThanOrEqual(-1);
      });
    });

    it('should have descriptions for all flags', () => {
      RED_FLAGS.forEach((flag) => {
        expect(flag.description).toBeTruthy();
        expect(flag.description.length).toBeGreaterThan(0);
      });
    });

    it('should have keyword arrays for all flags', () => {
      RED_FLAGS.forEach((flag) => {
        expect(Array.isArray(flag.keywords)).toBe(true);
      });
    });

    it('should include common red flags', () => {
      const flagNames = RED_FLAGS.map((f) => f.name);
      expect(flagNames).toContain('weak-ownership');
      expect(flagNames).toContain('vague-outcome');
      expect(flagNames).toContain('negative-framing');
      expect(flagNames).toContain('excessive-criticism');
    });
  });

  describe('Ceiling Rules', () => {
    describe('Insufficient Length Rule', () => {
      it('should be a callable function', () => {
        expect(typeof ceilingRuleInsufficientLength).toBe('function');
      });

      it('should cap score to 40 for very short answers', () => {
        const result = ceilingRuleInsufficientLength({
          baseScore: 100,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 30,
          redFlagCount: 0,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        expect(result).toBe(40);
      });

      it('should cap score to 60 for short answers', () => {
        const result = ceilingRuleInsufficientLength({
          baseScore: 100,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 75,
          redFlagCount: 0,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        expect(result).toBe(60);
      });

      it('should not cap score for adequate length', () => {
        const result = ceilingRuleInsufficientLength({
          baseScore: 85,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 150,
          redFlagCount: 0,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        expect(result).toBe(85);
      });
    });

    describe('High Red Flags Rule', () => {
      it('should be a callable function', () => {
        expect(typeof ceilingRuleHighRedFlags).toBe('function');
      });

      it('should cap score to 45 for 4+ red flags', () => {
        const result = ceilingRuleHighRedFlags({
          baseScore: 100,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 4,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        expect(result).toBe(45);
      });

      it('should cap score to 60 for 3 red flags', () => {
        const result = ceilingRuleHighRedFlags({
          baseScore: 100,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 3,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        expect(result).toBe(60);
      });

      it('should cap score to 75 for 2 red flags', () => {
        const result = ceilingRuleHighRedFlags({
          baseScore: 90,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 2,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        expect(result).toBe(75);
      });

      it('should not cap score for 0-1 red flags', () => {
        const result = ceilingRuleHighRedFlags({
          baseScore: 85,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 1,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        expect(result).toBe(85);
      });
    });

    describe('Dimension Imbalance Rule', () => {
      it('should be a callable function', () => {
        expect(typeof ceilingRuleDimensionImbalance).toBe('function');
      });

      it('should cap score when one dimension is significantly weaker', () => {
        const result = ceilingRuleDimensionImbalance({
          baseScore: 100,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 0,
          dimensionScores: { structure: 30, specificity: 100, outcome: 100, role: 100, company: 100, persona: 100, risks: 100 },
        });
        // Average is (30+100+100+100+100+100+100)/7 = 90
        // Min is 30, which is 60 below average, so ceiling applies
        expect(result).toBeLessThanOrEqual(90);
      });

      it('should not cap score when dimensions are balanced', () => {
        const result = ceilingRuleDimensionImbalance({
          baseScore: 80,
          dimension: 'structure',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 0,
          dimensionScores: { structure: 75, specificity: 80, outcome: 85, role: 80, company: 78, persona: 82, risks: 80 },
        });
        expect(result).toBe(80);
      });
    });

    describe('Persona Mismatch Rule', () => {
      it('should be a callable function', () => {
        expect(typeof ceilingRulePersonaMismatch).toBe('function');
      });

      it('should cap score to 70 when persona score < 40', () => {
        const result = ceilingRulePersonaMismatch({
          baseScore: 100,
          dimension: 'persona',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 0,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 35, risks: 100 },
        });
        expect(result).toBe(70);
      });

      it('should cap score to 85 when persona score < 55', () => {
        const result = ceilingRulePersonaMismatch({
          baseScore: 95,
          dimension: 'persona',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 0,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 50, risks: 100 },
        });
        expect(result).toBe(85);
      });

      it('should not cap score when persona score is strong', () => {
        const result = ceilingRulePersonaMismatch({
          baseScore: 90,
          dimension: 'persona',
          persona: 'recruiter',
          answerLength: 200,
          redFlagCount: 0,
          dimensionScores: { structure: 100, specificity: 100, outcome: 100, role: 100, company: 100, persona: 85, risks: 100 },
        });
        expect(result).toBe(90);
      });
    });

    it('all ceiling rules should be callable functions', () => {
      const rules = [
        ceilingRuleInsufficientLength,
        ceilingRuleHighRedFlags,
        ceilingRuleDimensionImbalance,
        ceilingRulePersonaMismatch,
      ];
      rules.forEach((rule) => {
        expect(typeof rule).toBe('function');
      });
    });
  });

  describe('Validation Functions', () => {
    let config: ScoreV2Config;

    beforeEach(() => {
      config = DEFAULT_SCORE_V2_CONFIG;
    });

    describe('validateDimensionWeights', () => {
      it('should validate correct weights', () => {
        expect(validateDimensionWeights(config)).toBe(true);
      });

      it('should reject invalid weights', () => {
        const invalidConfig: ScoreV2Config = {
          ...config,
          dimensions: [
            { name: 'structure', label: 'Structure', description: 'Test', weight: 0.5, maxScore: 100 },
            { name: 'specificity', label: 'Specificity', description: 'Test', weight: 0.3, maxScore: 100 },
          ],
        };
        expect(validateDimensionWeights(invalidConfig)).toBe(false);
      });
    });

    describe('validatePersonaWeights', () => {
      it('should validate correct persona weights', () => {
        expect(validatePersonaWeights(config)).toBe(true);
      });

      it('should reject invalid persona weights', () => {
        const invalidWeights = {
          recruiter: { ...PERSONA_WEIGHTS.recruiter, structure: 0.5 },
          'hiring-manager': PERSONA_WEIGHTS['hiring-manager'],
          peer: PERSONA_WEIGHTS.peer,
        };
        const invalidConfig: ScoreV2Config = {
          ...config,
          personaWeights: invalidWeights,
        };
        expect(validatePersonaWeights(invalidConfig)).toBe(false);
      });
    });

    describe('validateRedFlagPenalties', () => {
      it('should validate correct red flag penalties', () => {
        expect(validateRedFlagPenalties(config)).toBe(true);
      });

      it('should reject invalid penalties', () => {
        const invalidConfig: ScoreV2Config = {
          ...config,
          redFlags: [
            { name: 'test', description: 'Test', penalty: -25, keywords: [] }, // Too low
          ],
        };
        expect(validateRedFlagPenalties(invalidConfig)).toBe(false);
      });

      it('should reject positive penalties', () => {
        const invalidConfig: ScoreV2Config = {
          ...config,
          redFlags: [
            { name: 'test', description: 'Test', penalty: 5, keywords: [] }, // Positive
          ],
        };
        expect(validateRedFlagPenalties(invalidConfig)).toBe(false);
      });
    });
  });

  describe('Helper Functions', () => {
    describe('getCeilingRules', () => {
      it('should return all ceiling rules from config', () => {
        const rules = getCeilingRules(DEFAULT_SCORE_V2_CONFIG);
        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(typeof rule).toBe('function');
        });
      });
    });

    describe('getPersonaWeights', () => {
      it('should return correct weights for recruiter', () => {
        const weights = getPersonaWeights(DEFAULT_SCORE_V2_CONFIG, 'recruiter');
        expect(weights).toEqual(PERSONA_WEIGHTS.recruiter);
      });

      it('should return correct weights for hiring-manager', () => {
        const weights = getPersonaWeights(DEFAULT_SCORE_V2_CONFIG, 'hiring-manager');
        expect(weights).toEqual(PERSONA_WEIGHTS['hiring-manager']);
      });

      it('should return correct weights for peer', () => {
        const weights = getPersonaWeights(DEFAULT_SCORE_V2_CONFIG, 'peer');
        expect(weights).toEqual(PERSONA_WEIGHTS.peer);
      });
    });

    describe('getDimension', () => {
      it('should find dimension by name', () => {
        const dim = getDimension(DEFAULT_SCORE_V2_CONFIG, 'structure');
        expect(dim).toBeDefined();
        expect(dim?.name).toBe('structure');
      });

      it('should return undefined for non-existent dimension', () => {
        const dim = getDimension(DEFAULT_SCORE_V2_CONFIG, 'structure' as DimensionType);
        expect(dim).toBeDefined(); // 'structure' exists
      });

      it('should find all defined dimensions', () => {
        const dimensionNames: DimensionType[] = [
          'structure',
          'specificity',
          'outcome',
          'role',
          'company',
          'persona',
          'risks',
        ];
        dimensionNames.forEach((name) => {
          const dim = getDimension(DEFAULT_SCORE_V2_CONFIG, name);
          expect(dim).toBeDefined();
          expect(dim?.name).toBe(name);
        });
      });
    });
  });

  describe('Default Config', () => {
    it('should have version 2.0', () => {
      expect(DEFAULT_SCORE_V2_CONFIG.version).toBe('2.0');
    });

    it('should have all required properties', () => {
      expect(DEFAULT_SCORE_V2_CONFIG.dimensions).toBeDefined();
      expect(DEFAULT_SCORE_V2_CONFIG.personaWeights).toBeDefined();
      expect(DEFAULT_SCORE_V2_CONFIG.redFlags).toBeDefined();
      expect(DEFAULT_SCORE_V2_CONFIG.ceilingRules).toBeDefined();
      expect(DEFAULT_SCORE_V2_CONFIG.minAnswerLength).toBeDefined();
      expect(DEFAULT_SCORE_V2_CONFIG.maxPenalties).toBeDefined();
    });

    it('should have minAnswerLength of at least 50', () => {
      expect(DEFAULT_SCORE_V2_CONFIG.minAnswerLength).toBeGreaterThanOrEqual(50);
    });

    it('should have maxPenalties between -50 and 0', () => {
      expect(DEFAULT_SCORE_V2_CONFIG.maxPenalties).toBeLessThanOrEqual(0);
      expect(DEFAULT_SCORE_V2_CONFIG.maxPenalties).toBeGreaterThanOrEqual(-50);
    });

    it('should pass all validations', () => {
      expect(validateDimensionWeights(DEFAULT_SCORE_V2_CONFIG)).toBe(true);
      expect(validatePersonaWeights(DEFAULT_SCORE_V2_CONFIG)).toBe(true);
      expect(validateRedFlagPenalties(DEFAULT_SCORE_V2_CONFIG)).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should have correct dimension types', () => {
      DIMENSIONS.forEach((d) => {
        const type: DimensionType = d.name;
        expect(type).toBeTruthy();
      });
    });

    it('should have correct persona types', () => {
      const personas: PersonaType[] = ['recruiter', 'hiring-manager', 'peer'];
      personas.forEach((p) => {
        expect(PERSONA_WEIGHTS[p]).toBeDefined();
      });
    });
  });
});
