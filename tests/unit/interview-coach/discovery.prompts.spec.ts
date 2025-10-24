/**
 * Unit Tests: Interview Coach Discovery Prompts
 * 
 * Tests the buildFollowUpPrompts function for generating targeted
 * follow-up questions based on lowest scoring dimensions and signal gaps.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildFollowUpPrompts, PromptItem } from '@/src/interview-coach/discovery/prompts';
import { ScoringContext } from '@/src/interview-coach/scoring/rules';
import { DimensionType } from '@/src/interview-coach/scoring/schema';
import * as fs from 'fs';
import * as path from 'path';

describe('buildFollowUpPrompts', () => {
  let mockContext: ScoringContext;
  let mockScoring: { subscores: Record<DimensionType, number>; flags: string[] };

  beforeEach(() => {
    mockContext = {
      answer: 'I worked on a project and it was successful.',
      persona: 'recruiter',
      jdCore: 'Looking for a software engineer with React experience',
      companyValues: ['Customer Obsession', 'Innovation'],
      userProfile: { interviewer: 'John Doe' },
      matchMatrix: { communityTopics: ['AI', 'Machine Learning'] },
      styleProfileId: null
    };

    mockScoring = {
      subscores: {
        structure: 60,
        specificity: 30, // Low score
        outcome: 25,     // Low score
        role: 70,
        company: 80,
        persona: 50,
        risks: 40
      },
      flags: ['low-specificity', 'vague-outcome']
    };
  });

  describe('Low specificity/outcome detection', () => {
    it('should generate prompts targeting specificity and outcome when they are lowest', () => {
      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      expect(prompts).toHaveLength(2);
      expect(prompts[0].targets).toContain('specificity');
      expect(prompts[0].targets).toContain('outcome');
      expect(prompts[0].text).toContain('Quantify impact');
      expect(prompts[0].sourceKeys).toContain('low_specificity');
      expect(prompts[0].sourceKeys).toContain('no_metrics');
    });

    it('should include outcome-focused prompt for second lowest dimension', () => {
      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      expect(prompts[1].targets).toContain('outcome');
      expect(prompts[1].targets).toContain('role');
      expect(prompts[1].text).toContain('before/after metric');
      expect(prompts[1].sourceKeys).toContain('low_outcome');
    });
  });

  describe('Persona mismatch handling', () => {
    it('should generate persona-tuned prompt when persona score is low', () => {
      mockScoring.subscores.persona = 20; // Very low
      mockScoring.subscores.specificity = 80; // Higher
      mockScoring.subscores.outcome = 80; // Higher

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const personaPrompt = prompts.find(p => p.targets.includes('persona'));
      expect(personaPrompt).toBeDefined();
      expect(personaPrompt?.text).toContain('interviewer audience');
      expect(personaPrompt?.sourceKeys).toContain('low_persona');
      expect(personaPrompt?.sourceKeys).toContain('persona_mismatch');
    });

    it('should use recruiter audience when no interviewer profile', () => {
      mockContext.userProfile = null;
      mockScoring.subscores.persona = 20;

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const personaPrompt = prompts.find(p => p.targets.includes('persona'));
      expect(personaPrompt?.text).toContain('recruiter audience');
    });
  });

  describe('Missing company values handling', () => {
    it('should generate company alignment prompt when values present but not referenced', () => {
      mockScoring.subscores.company = 20; // Low company score
      mockScoring.subscores.specificity = 80; // Higher
      mockScoring.subscores.outcome = 80; // Higher

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const companyPrompt = prompts.find(p => p.targets.includes('company'));
      expect(companyPrompt).toBeDefined();
      expect(companyPrompt?.text).toContain('company value');
      expect(companyPrompt?.text).toContain('Customer Obsession');
      expect(companyPrompt?.sourceKeys).toContain('values_present_no_link');
    });

    it('should not generate company prompt when no company values available', () => {
      mockContext.companyValues = undefined;
      mockScoring.subscores.company = 20;

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const companyPrompt = prompts.find(p => p.targets.includes('company'));
      expect(companyPrompt).toBeUndefined();
    });
  });

  describe('Structure and role prompts', () => {
    it('should generate structure prompt for low structure score', () => {
      mockScoring.subscores.structure = 15; // Very low
      mockScoring.subscores.specificity = 80;
      mockScoring.subscores.outcome = 80;

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const structurePrompt = prompts.find(p => p.targets.includes('structure'));
      expect(structurePrompt).toBeDefined();
      expect(structurePrompt?.text).toContain('STAR');
      expect(structurePrompt?.text).toContain('Situation, Task, Action, Result');
    });

    it('should generate role prompt for low role score', () => {
      mockScoring.subscores.role = 20;
      mockScoring.subscores.specificity = 80;
      mockScoring.subscores.outcome = 80;

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const rolePrompt = prompts.find(p => p.targets.includes('role'));
      expect(rolePrompt).toBeDefined();
      expect(rolePrompt?.text).toContain('decision and why');
      expect(rolePrompt?.text).toContain('trade-off');
    });
  });

  describe('Risks and buzzwords handling', () => {
    it('should generate risks prompt for low risks score', () => {
      mockScoring.subscores.risks = 15;
      mockScoring.subscores.specificity = 80;
      mockScoring.subscores.outcome = 80;

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const risksPrompt = prompts.find(p => p.targets.includes('risks'));
      expect(risksPrompt).toBeDefined();
      expect(risksPrompt?.text).toContain('buzzwords');
      expect(risksPrompt?.text).toContain('concrete actions');
      expect(risksPrompt?.sourceKeys).toContain('buzzwords_detected');
    });
  });

  describe('Signal gaps detection', () => {
    it('should include gap indicators in sourceKeys when signals missing', () => {
      mockContext.jdCore = undefined;
      mockContext.companyValues = undefined;
      mockContext.userProfile = null;
      mockContext.matchMatrix = {};

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      expect(prompts.length).toBeGreaterThan(0);
      prompts.forEach(prompt => {
        expect(prompt.sourceKeys).toContain('no_jd');
        expect(prompt.sourceKeys).toContain('no_company_values');
        expect(prompt.sourceKeys).toContain('no_interviewer');
        expect(prompt.sourceKeys).toContain('no_profile');
        expect(prompt.sourceKeys).toContain('no_community');
      });
    });

    it('should not include gap indicators when signals present', () => {
      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      expect(prompts.length).toBeGreaterThan(0);
      prompts.forEach(prompt => {
        expect(prompt.sourceKeys).not.toContain('no_jd');
        expect(prompt.sourceKeys).not.toContain('no_company_values');
        expect(prompt.sourceKeys).not.toContain('no_interviewer');
        expect(prompt.sourceKeys).not.toContain('no_profile');
        expect(prompt.sourceKeys).not.toContain('no_community');
      });
    });
  });

  describe('Additional prompts generation', () => {
    it('should generate additional company prompt when company values present but company dimension not targeted', () => {
      mockScoring.subscores.company = 80; // High company score
      mockScoring.subscores.specificity = 20; // Low specificity
      mockScoring.subscores.outcome = 20; // Low outcome

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      // Should have specificity/outcome prompts + additional company prompt
      expect(prompts.length).toBe(3);
      
      const companyPrompt = prompts.find(p => p.id === 'p_company_additional');
      expect(companyPrompt).toBeDefined();
      expect(companyPrompt?.text).toContain('company values');
    });

    it('should generate additional role prompt when JD present but role dimension not targeted', () => {
      mockScoring.subscores.role = 80; // High role score
      mockScoring.subscores.specificity = 20; // Low specificity
      mockScoring.subscores.outcome = 20; // Low outcome

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const rolePrompt = prompts.find(p => p.id === 'p_role_additional');
      expect(rolePrompt).toBeDefined();
      expect(rolePrompt?.text).toContain('job requirements');
    });

    it('should generate additional community prompt when community topics present', () => {
      mockScoring.subscores.persona = 80; // High persona score
      mockScoring.subscores.specificity = 20; // Low specificity
      mockScoring.subscores.outcome = 20; // Low outcome

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      const communityPrompt = prompts.find(p => p.id === 'p_community_additional');
      expect(communityPrompt).toBeDefined();
      expect(communityPrompt?.text).toContain('industry trends');
    });
  });

  describe('Bounds and limits', () => {
    it('should always return 2-3 prompts', () => {
      const prompts = buildFollowUpPrompts(mockContext, mockScoring);
      expect(prompts.length).toBeGreaterThanOrEqual(2);
      expect(prompts.length).toBeLessThanOrEqual(3);
    });

    it('should not exceed 3 prompts even with many gaps', () => {
      // Set all dimensions to low scores
      Object.keys(mockScoring.subscores).forEach(key => {
        mockScoring.subscores[key as DimensionType] = 10;
      });

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);
      expect(prompts.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty context gracefully', () => {
      const emptyContext: ScoringContext = {
        answer: 'test',
        persona: 'recruiter'
      };

      const prompts = buildFollowUpPrompts(emptyContext, mockScoring);
      expect(prompts.length).toBeGreaterThanOrEqual(2);
      expect(prompts.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Prompt structure validation', () => {
    it('should return prompts with required fields', () => {
      const prompts = buildFollowUpPrompts(mockContext, mockScoring);

      prompts.forEach(prompt => {
        expect(prompt.id).toBeDefined();
        expect(prompt.text).toBeDefined();
        expect(prompt.targets).toBeDefined();
        expect(prompt.sourceKeys).toBeDefined();
        expect(Array.isArray(prompt.targets)).toBe(true);
        expect(Array.isArray(prompt.sourceKeys)).toBe(true);
      });
    });

    it('should have unique prompt IDs', () => {
      const prompts = buildFollowUpPrompts(mockContext, mockScoring);
      const ids = prompts.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('Tie-breaking priority', () => {
    it('should prioritize risks over other dimensions when scores are equal', () => {
      // Set all dimensions to same low score
      Object.keys(mockScoring.subscores).forEach(key => {
        mockScoring.subscores[key as DimensionType] = 30;
      });

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);
      
      // Should prioritize risks, then specificity, then outcome
      expect(prompts[0].targets).toContain('risks');
      expect(prompts[1].targets).toContain('specificity');
    });

    it('should follow dimension priority order for tie-breaking', () => {
      // Set all dimensions to same score
      Object.keys(mockScoring.subscores).forEach(key => {
        mockScoring.subscores[key as DimensionType] = 25;
      });

      const prompts = buildFollowUpPrompts(mockContext, mockScoring);
      
      // First prompt should target risks (highest priority)
      expect(prompts[0].targets).toContain('risks');
    });
  });

  describe('JSON output generation', () => {
    it('should write test results to reports directory', () => {
      const prompts = buildFollowUpPrompts(mockContext, mockScoring);
      
      // Create reports directory if it doesn't exist
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // Write test results
      const testResults = {
        testName: 'discovery.prompts.spec.ts',
        timestamp: new Date().toISOString(),
        testCases: [
          {
            name: 'Low specificity/outcome detection',
            prompts: prompts,
            context: mockContext,
            scoring: mockScoring
          }
        ]
      };
      
      const outputPath = path.join(reportsDir, 'discovery.prompts.json');
      fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
      
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });
});
