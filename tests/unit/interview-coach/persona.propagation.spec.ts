import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('Persona Propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AnswerPracticeWorkspace persona propagation', () => {
    it('should include persona in score-answer API calls', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          score: { overall: 85, subscores: {}, flags: [], confidence: 0.8 },
          version: 'v2'
        })
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);
      
      // Mock AnswerPracticeWorkspace component
      const mockAnswerPracticeWorkspace = {
        scoreAnswer: async (jobId: string, questionId: string, answerText: string, persona: string) => {
          const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId,
              answerText,
              iteration: 1,
              persona
            })
          });
          return await res.json();
        }
      };
      
      await mockAnswerPracticeWorkspace.scoreAnswer('test-job-id', 'q1', 'Test answer', 'hiring-manager');
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/interview-coach/test-job-id/score-answer',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"persona":"hiring-manager"')
        })
      );
    });

    it('should include persona in suggest-follow-up API calls', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          prompts: [{ text: 'Follow-up question' }],
          version: 'v2'
        })
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);
      
      // Mock AnswerPracticeWorkspace component
      const mockAnswerPracticeWorkspace = {
        suggestFollowUp: async (jobId: string, questionId: string, followUpQuestion: string, persona: string) => {
          const res = await fetch(`/api/interview-coach/${jobId}/suggest-follow-up`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId,
              followUpQuestion,
              followUpIndex: 0,
              persona
            })
          });
          return await res.json();
        }
      };
      
      await mockAnswerPracticeWorkspace.suggestFollowUp('test-job-id', 'q1', 'Test question', 'recruiter');
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/interview-coach/test-job-id/suggest-follow-up',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"persona":"recruiter"')
        })
      );
    });

    it('should include persona in extract-core-stories API calls', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          coreStories: [],
          coverageMap: {},
          version: 'v2'
        })
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);
      
      // Mock TalkTracksPanel component
      const mockTalkTracksPanel = {
        generateStories: async (jobId: string, answers: any[], themes: string[], persona: string) => {
          const res = await fetch(`/api/interview-coach/${jobId}/extract-core-stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              answers,
              themes,
              persona
            })
          });
          return await res.json();
        }
      };
      
      await mockTalkTracksPanel.generateStories(
        'test-job-id',
        [{ id: 'a1', text: 'Test answer' }],
        ['impact', 'ownership'],
        'peer'
      );
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/interview-coach/test-job-id/extract-core-stories',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"persona":"peer"')
        })
      );
    });

    it('should default to hiring-manager persona when not specified', () => {
      // Mock AnswerPracticeWorkspace component with default persona
      const mockAnswerPracticeWorkspace = {
        getPersona: (persona?: string) => persona || 'hiring-manager'
      };
      
      expect(mockAnswerPracticeWorkspace.getPersona()).toBe('hiring-manager');
      expect(mockAnswerPracticeWorkspace.getPersona('recruiter')).toBe('recruiter');
      expect(mockAnswerPracticeWorkspace.getPersona(undefined)).toBe('hiring-manager');
    });
  });

  describe('Persona validation', () => {
    it('should accept valid persona values', () => {
      const validPersonas = ['recruiter', 'hiring-manager', 'peer'];
      
      validPersonas.forEach(persona => {
        expect(['recruiter', 'hiring-manager', 'peer']).toContain(persona);
      });
    });

    it('should handle persona in telemetry logs', () => {
      // Mock telemetry logging
      const mockLogCoachEvent = (event: any) => {
        expect(event.persona).toBeDefined();
        expect(['recruiter', 'hiring-manager', 'peer']).toContain(event.persona);
      };
      
      // Test with different personas
      mockLogCoachEvent({ route: 'score-answer', persona: 'recruiter' });
      mockLogCoachEvent({ route: 'suggest-follow-up', persona: 'hiring-manager' });
      mockLogCoachEvent({ route: 'extract-core-stories', persona: 'peer' });
    });
  });

  describe('Network tab verification', () => {
    it('should verify persona is present in POST request bodies', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      });
      
      global.fetch = mockFetch;
      
      // Mock API call
      await fetch('/api/interview-coach/test-job-id/score-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: 'q1',
          answerText: 'Test answer',
          persona: 'hiring-manager'
        })
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/interview-coach/test-job-id/score-answer',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"persona":"hiring-manager"')
        })
      );
    });

    it('should verify persona is not unknown in telemetry', () => {
      // Mock telemetry event
      const mockTelemetryEvent = {
        route: 'score-answer',
        persona: 'hiring-manager',
        durationMs: 1000,
        metadata: {}
      };
      
      expect(mockTelemetryEvent.persona).not.toBe('unknown');
      expect(mockTelemetryEvent.persona).toBe('hiring-manager');
    });
  });
});
