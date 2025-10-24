import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI provider
vi.mock('@/lib/coach/aiProvider', () => ({
  callAiProvider: vi.fn()
}));

// Mock the telemetry
vi.mock('@/src/interview-coach/telemetry', () => ({
  logCoachEvent: vi.fn(),
  logCoachError: vi.fn()
}));

describe('Suggest Answer Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.AI_ASSIST_ON;
  });

  describe('Deterministic scaffold generation', () => {
    it('should generate scaffold without AI when AI_ASSIST_ON is not set', async () => {
      const { callAiProvider } = await import('@/lib/coach/aiProvider');
      
      const requestBody = {
        answer: 'I led a project that improved performance.',
        persona: 'hiring-manager',
        question: 'Tell me about a time you improved a system.',
        targetedDimensions: ['specificity', 'role']
      };

      const response = await fetch('http://localhost:3000/api/interview-coach/test-job-id/suggest-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.draft).toContain('[METRIC_PLACEHOLDER');
      expect(result.draft).toContain('[ROLE_PLACEHOLDER');
      expect(result.rationale).toContain('Added metric placeholder for specificity');
      expect(result.rationale).toContain('Added role clarity placeholder');
      expect(result.version).toBe('v2');
      
      // Should not call AI provider
      expect(callAiProvider).not.toHaveBeenCalled();
    });

    it('should enhance with AI when AI_ASSIST_ON=1', async () => {
      process.env.AI_ASSIST_ON = '1';
      
      const { callAiProvider } = await import('@/lib/coach/aiProvider');
      vi.mocked(callAiProvider).mockResolvedValue({
        success: true,
        data: { text: 'AI-enhanced answer with metrics and clarity' }
      });

      const requestBody = {
        answer: 'I led a project that improved performance.',
        persona: 'hiring-manager',
        question: 'Tell me about a time you improved a system.',
        targetedDimensions: ['specificity']
      };

      const response = await fetch('http://localhost:3000/api/interview-coach/test-job-id/suggest-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.draft).toBe('AI-enhanced answer with metrics and clarity');
      expect(result.rationale).toContain('AI-enhanced with improved structure and impact metrics');
      
      expect(callAiProvider).toHaveBeenCalledWith('text-generation', expect.objectContaining({
        prompt: expect.stringContaining('Tell me about a time you improved a system'),
        maxTokens: 300,
        temperature: 0.7
      }));
    });

    it('should fallback to scaffold if AI enhancement fails', async () => {
      process.env.AI_ASSIST_ON = '1';
      
      const { callAiProvider } = await import('@/lib/coach/aiProvider');
      vi.mocked(callAiProvider).mockRejectedValue(new Error('AI service unavailable'));

      const requestBody = {
        answer: 'I led a project that improved performance.',
        persona: 'hiring-manager',
        question: 'Tell me about a time you improved a system.',
        targetedDimensions: ['specificity']
      };

      const response = await fetch('http://localhost:3000/api/interview-coach/test-job-id/suggest-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.draft).toContain('[METRIC_PLACEHOLDER');
      expect(result.rationale).toContain('AI enhancement unavailable, using scaffold');
    });
  });

  describe('Scaffold generation logic', () => {
    it('should add placeholders for all targeted dimensions', () => {
      const { generateAnswerScaffold } = require('@/app/api/interview-coach/[jobId]/suggest-answer/route');
      
      const result = generateAnswerScaffold(
        'Original answer',
        ['specificity', 'role', 'outcome', 'clarity', 'structure']
      );
      
      expect(result.draft).toContain('[METRIC_PLACEHOLDER');
      expect(result.draft).toContain('[ROLE_PLACEHOLDER');
      expect(result.draft).toContain('[OUTCOME_PLACEHOLDER');
      expect(result.draft).toContain('[CLARITY_IMPROVEMENT');
      expect(result.draft).toContain('[STRUCTURE_IMPROVEMENT');
      
      expect(result.rationale).toHaveLength(5);
      expect(result.rationale[0]).toContain('metric placeholder');
      expect(result.rationale[1]).toContain('role clarity');
      expect(result.rationale[2]).toContain('outcome impact');
      expect(result.rationale[3]).toContain('clarity improvement');
      expect(result.rationale[4]).toContain('structure improvement');
    });

    it('should handle empty targeted dimensions', () => {
      const { generateAnswerScaffold } = require('@/app/api/interview-coach/[jobId]/suggest-answer/route');
      
      const result = generateAnswerScaffold('Original answer', []);
      
      expect(result.draft).toBe('Original answer');
      expect(result.rationale).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        answer: 'Some answer'
        // Missing persona, question, targetedDimensions
      };

      const response = await fetch('http://localhost:3000/api/interview-coach/test-job-id/suggest-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch('http://localhost:3000/api/interview-coach/test-job-id/suggest-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain('Invalid JSON');
    });
  });
});
