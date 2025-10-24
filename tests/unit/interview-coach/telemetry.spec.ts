import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  logCoachEvent, 
  logCoachError, 
  extractCoachMetrics, 
  measureCoachOperation,
  telemetryConfig,
  CoachEventData 
} from '@/src/interview-coach/telemetry';

// Mock console methods
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

describe('Interview Coach Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    vi.spyOn(console, 'error').mockImplementation(mockConsoleError);
    
    // Reset environment variables
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TELEMETRY_ENABLED', 'true');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('logCoachEvent', () => {
    it('should log coach event with basic data', () => {
      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1500,
        score: 85,
        confidence: 0.9
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          timestamp: expect.any(String),
          event: 'interview_coach_usage',
          route: 'score-answer',
          persona: 'recruiter',
          durationMs: 1500,
          score: 85,
          confidence: 0.9
        })
      );
    });

    it('should redact long answers in metadata', () => {
      const longAnswer = 'A'.repeat(250);
      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1000,
        metadata: {
          answer: longAnswer,
          question: 'Tell me about yourself'
        }
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          metadata: expect.objectContaining({
            answer: expect.stringMatching(/^\[redacted:[a-f0-9]{8}:250\]$/),
            question: 'Tell me about yourself'
          })
        })
      );
    });

    it('should redact long questions in metadata', () => {
      const longQuestion = 'B'.repeat(200);
      const eventData: CoachEventData = {
        route: 'suggest-follow-up',
        persona: 'hiring-manager',
        durationMs: 800,
        metadata: {
          question: longQuestion,
          answer: 'Short answer'
        }
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          metadata: expect.objectContaining({
            question: expect.stringMatching(/^\[redacted:[a-f0-9]{8}:200\]$/),
            answer: 'Short answer'
          })
        })
      );
    });

    it('should handle missing metadata gracefully', () => {
      const eventData: CoachEventData = {
        route: 'extract-core-stories',
        persona: 'peer',
        durationMs: 2000
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          route: 'extract-core-stories',
          persona: 'peer',
          durationMs: 2000
        })
      );
    });

    it('should not log in production environment', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1000
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should handle telemetry errors gracefully', () => {
      // Mock console.log to throw an error
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Console error');
      });

      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1000
      };

      // Should not throw an error
      expect(() => logCoachEvent(eventData)).not.toThrow();
      
      // Should log the telemetry error
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Telemetry logging failed:',
        expect.any(Error)
      );
    });
  });

  describe('logCoachError', () => {
    it('should log coach error with basic data', () => {
      const error = new Error('Test error');
      const context = { questionId: '123', iteration: 2 };

      logCoachError('score-answer', 'recruiter', error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Coach Error:',
        expect.objectContaining({
          route: 'score-answer',
          persona: 'recruiter',
          error: 'Test error',
          stack: expect.any(String),
          timestamp: expect.any(String),
          context: { questionId: '123', iteration: 2 }
        })
      );
    });

    it('should log string errors', () => {
      logCoachError('suggest-follow-up', 'hiring-manager', 'String error');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Coach Error:',
        expect.objectContaining({
          route: 'suggest-follow-up',
          persona: 'hiring-manager',
          error: 'String error',
          stack: undefined
        })
      );
    });

    it('should handle missing context gracefully', () => {
      logCoachError('extract-core-stories', 'peer', new Error('Test error'));

      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Coach Error:',
        expect.objectContaining({
          route: 'extract-core-stories',
          persona: 'peer',
          error: 'Test error',
          context: undefined
        })
      );
    });

    it('should handle telemetry errors gracefully', () => {
      // Mock console.error to throw an error
      vi.spyOn(console, 'error').mockImplementation(() => {
        throw new Error('Console error');
      });

      logCoachError('score-answer', 'recruiter', new Error('Test error'));

      // Should not throw an error
      expect(() => logCoachError('score-answer', 'recruiter', new Error('Test error'))).not.toThrow();
    });
  });

  describe('extractCoachMetrics', () => {
    it('should extract score from response', () => {
      const response = { score: 85 };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ score: 85 });
    });

    it('should extract v2Score from response', () => {
      const response = { v2Score: 90 };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ score: 90 });
    });

    it('should extract confidence from response', () => {
      const response = { confidence: 0.85 };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ confidence: 0.85 });
    });

    it('should extract promptsCount from questions array', () => {
      const response = { questions: ['q1', 'q2', 'q3'] };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ promptsCount: 3 });
    });

    it('should extract promptsCount from followUps array', () => {
      const response = { followUps: ['f1', 'f2'] };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ promptsCount: 2 });
    });

    it('should extract storiesCount from stories array', () => {
      const response = { stories: ['s1', 's2', 's3', 's4'] };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ storiesCount: 4 });
    });

    it('should extract storiesCount from coreStories array', () => {
      const response = { coreStories: ['cs1', 'cs2'] };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ storiesCount: 2 });
    });

    it('should extract flags from response', () => {
      const response = { flags: ['flag1', 'flag2', 'flag3'] };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({ flags: ['flag1', 'flag2', 'flag3'] });
    });

    it('should extract multiple metrics from complex response', () => {
      const response = {
        score: 85,
        confidence: 0.9,
        questions: ['q1', 'q2'],
        stories: ['s1', 's2', 's3'],
        flags: ['flag1', 'flag2']
      };
      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({
        score: 85,
        confidence: 0.9,
        promptsCount: 2,
        storiesCount: 3,
        flags: ['flag1', 'flag2']
      });
    });

    it('should handle extraction errors gracefully', () => {
      // Mock response with circular reference
      const response: any = {};
      response.self = response;

      const metrics = extractCoachMetrics(response);

      expect(metrics).toEqual({});
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Metric extraction failed:',
        expect.any(Error)
      );
    });
  });

  describe('measureCoachOperation', () => {
    it('should measure successful operation', async () => {
      const operation = 'test-operation';
      const fn = vi.fn().mockResolvedValue('success');

      const result = await measureCoachOperation(operation, fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledOnce();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          route: 'operation',
          persona: 'system',
          durationMs: expect.any(Number),
          metadata: expect.objectContaining({
            operation: 'test-operation',
            success: true
          })
        })
      );
    });

    it('should measure failed operation', async () => {
      const operation = 'test-operation';
      const error = new Error('Operation failed');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(measureCoachOperation(operation, fn)).rejects.toThrow('Operation failed');

      expect(fn).toHaveBeenCalledOnce();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Coach Error:',
        expect.objectContaining({
          route: 'operation',
          persona: 'system',
          error: 'Operation failed',
          context: expect.objectContaining({
            operation: 'test-operation',
            durationMs: expect.any(Number)
          })
        })
      );
    });
  });

  describe('PII Redaction', () => {
    it('should redact long content with hash and length', () => {
      const longContent = 'A'.repeat(150);
      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1000,
        metadata: {
          answer: longContent
        }
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          metadata: expect.objectContaining({
            answer: expect.stringMatching(/^\[redacted:[a-f0-9]{8}:150\]$/)
          })
        })
      );
    });

    it('should not redact short content', () => {
      const shortContent = 'Short answer';
      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1000,
        metadata: {
          answer: shortContent
        }
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          metadata: expect.objectContaining({
            answer: 'Short answer'
          })
        })
      );
    });

    it('should handle empty content gracefully', () => {
      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1000,
        metadata: {
          answer: '',
          question: null
        }
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          metadata: expect.objectContaining({
            answer: '',
            question: null
          })
        })
      );
    });
  });

  describe('Event Emission Verification', () => {
    it('should emit exactly one event per route call', () => {
      const eventData: CoachEventData = {
        route: 'score-answer',
        persona: 'recruiter',
        durationMs: 1000
      };

      logCoachEvent(eventData);

      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📊 Coach Event:',
        expect.objectContaining({
          route: 'score-answer'
        })
      );
    });

    it('should emit exactly one error per error call', () => {
      logCoachError('suggest-follow-up', 'hiring-manager', new Error('Test error'));

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '🚨 Coach Error:',
        expect.objectContaining({
          route: 'suggest-follow-up'
        })
      );
    });
  });

  describe('Telemetry Configuration', () => {
    it('should have correct default configuration', () => {
      expect(telemetryConfig.enabled).toBe(true);
      expect(telemetryConfig.redactionEnabled).toBe(true);
      expect(telemetryConfig.maxContentLength).toBe(100);
      expect(telemetryConfig.maxAnswerLength).toBe(200);
    });

    it('should respect NODE_ENV for enabling telemetry', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      // Re-import to get updated config
      const { telemetryConfig: prodConfig } = require('@/src/interview-coach/telemetry');
      
      expect(prodConfig.enabled).toBe(false);
    });

    it('should respect TELEMETRY_ENABLED environment variable', () => {
      vi.stubEnv('TELEMETRY_ENABLED', 'false');
      
      // Re-import to get updated config
      const { telemetryConfig: disabledConfig } = require('@/src/interview-coach/telemetry');
      
      expect(disabledConfig.enabled).toBe(false);
    });
  });
});
