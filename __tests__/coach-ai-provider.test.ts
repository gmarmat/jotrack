import { describe, it, expect } from 'vitest';
import { redactPII, generateDryRunResponse } from '@/lib/coach/aiProvider';

describe('AI Provider Utils', () => {
  describe('redactPII', () => {
    it('should redact email addresses', () => {
      const input = 'Contact me at john.doe@example.com for more info';
      const output = redactPII(input);
      expect(output).toBe('Contact me at [EMAIL] for more info');
    });

    it('should redact phone numbers', () => {
      const input = 'Call me at 123-456-7890 or (555) 123-4567';
      const output = redactPII(input);
      expect(output).toContain('[PHONE]');
      expect(output).not.toContain('123-456-7890');
    });

    it('should redact SSN patterns', () => {
      const input = 'SSN: 123-45-6789';
      const output = redactPII(input);
      expect(output).toBe('SSN: [SSN]');
    });

    it('should handle multiple PII types', () => {
      const input = 'Email: test@example.com, Phone: 555-123-4567';
      const output = redactPII(input);
      expect(output).not.toContain('test@example.com');
      expect(output).not.toContain('555-123-4567');
      expect(output).toContain('[EMAIL]');
      expect(output).toContain('[PHONE]');
    });
  });

  describe('generateDryRunResponse', () => {
    it('should generate company profile response', () => {
      const response = generateDryRunResponse('company_profile', {
        companyName: 'Acme Corp',
      });
      
      expect(response).toHaveProperty('name');
      expect(response).toHaveProperty('industry');
      expect(response).toHaveProperty('principles');
      expect(response.principles).toBeInstanceOf(Array);
      expect(response.summary).toContain('[DRY RUN]');
    });

    it('should generate recruiter profile response', () => {
      const response = generateDryRunResponse('recruiter_profile', {
        recruiterName: 'Jane Smith',
      });
      
      expect(response).toHaveProperty('name');
      expect(response).toHaveProperty('title');
      expect(response).toHaveProperty('techDepth');
      expect(response).toHaveProperty('summary');
      expect(response.summary).toContain('[DRY RUN]');
    });

    it('should generate fit analysis response', () => {
      const response = generateDryRunResponse('fit_analysis', {
        jobDescription: 'Looking for React developer',
        resume: 'Experienced with React',
      });
      
      expect(response).toHaveProperty('overallScore');
      expect(response).toHaveProperty('scoreLevel');
      expect(response).toHaveProperty('dimensions');
      expect(response.dimensions).toBeInstanceOf(Array);
      expect(response.dimensions.length).toBeGreaterThan(0);
      
      const firstDim = response.dimensions[0];
      expect(firstDim).toHaveProperty('name');
      expect(firstDim).toHaveProperty('weight');
      expect(firstDim).toHaveProperty('score');
      expect(firstDim).toHaveProperty('reasoning');
      
      expect(response).toHaveProperty('keywordMatches');
      expect(response.keywordMatches).toHaveProperty('found');
      expect(response.keywordMatches).toHaveProperty('missing');
    });

    it('should generate resume improvement response', () => {
      const response = generateDryRunResponse('resume_improve', {});
      
      expect(response).toHaveProperty('suggestions');
      expect(response.suggestions).toBeInstanceOf(Array);
      expect(response.suggestions.length).toBeGreaterThan(0);
      
      const firstSuggestion = response.suggestions[0];
      expect(firstSuggestion).toHaveProperty('section');
      expect(firstSuggestion).toHaveProperty('current');
      expect(firstSuggestion).toHaveProperty('suggested');
      expect(firstSuggestion).toHaveProperty('reasoning');
      
      expect(response).toHaveProperty('missingKeywords');
      expect(response).toHaveProperty('estimatedNewScore');
    });

    it('should generate skill path response', () => {
      const response = generateDryRunResponse('skill_path', {
        missingSkills: ['Kubernetes', 'GraphQL'],
      });
      
      expect(response).toHaveProperty('skills');
      expect(response.skills).toBeInstanceOf(Array);
      expect(response.skills.length).toBeGreaterThan(0);
      
      const firstSkill = response.skills[0];
      expect(firstSkill).toHaveProperty('skill');
      expect(firstSkill).toHaveProperty('priority');
      expect(firstSkill).toHaveProperty('estimatedHours');
      expect(firstSkill.estimatedHours).toBeLessThanOrEqual(6);
      
      expect(response).toHaveProperty('totalHours');
      expect(response).toHaveProperty('talkTrack');
      expect(response.talkTrack).toContain('[DRY RUN]');
    });

    it('should generate generic response for unknown capability', () => {
      const response = generateDryRunResponse('unknown_capability', {
        test: 'data',
      });
      
      expect(response).toHaveProperty('message');
      expect(response.message).toContain('unknown_capability');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('inputs');
    });
  });
});

