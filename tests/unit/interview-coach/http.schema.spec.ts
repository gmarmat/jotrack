import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Common schemas
  JobIdParamSchema,
  ErrorResponseSchema,
  MetadataSchema,
  JdCoreSchema,
  
  // Score answer schemas
  ScoreAnswerV2RequestSchema,
  ScoreAnswerLegacyRequestSchema,
  ScoreAnswerRequestSchema,
  ScoreAnswerResponseSchema,
  
  // Suggest follow-up schemas
  SuggestFollowUpRequestSchema,
  SuggestFollowUpResponseSchema,
  
  // Extract core stories schemas
  ExtractCoreStoriesRequestSchema,
  ExtractCoreStoriesResponseSchema,
  
  // Validation helpers
  validateRequest,
  validateResponse,
  mapErrorToResponse,
  
  // Utility functions
  normalizeCategory
} from '@/src/interview-coach/http/schema';

describe('Interview Coach HTTP Schema Validation', () => {
  describe('Common Schemas', () => {
    describe('JobIdParamSchema', () => {
      it('should validate valid job IDs', () => {
        const validJobIds = [
          'job-123',
          'job_abc',
          'job-123-abc',
          'job123',
          '123',
          'a'
        ];
        
        validJobIds.forEach(jobId => {
          const result = JobIdParamSchema.safeParse({ jobId });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.jobId).toBe(jobId);
          }
        });
      });
      
      it('should reject invalid job IDs', () => {
        const invalidJobIds = [
          '', // empty
          'job with spaces',
          'job@123',
          'job#123',
          'job$123',
          'job%123',
          'job^123',
          'job&123',
          'job*123',
          'job(123)',
          'job[123]',
          'job{123}',
          'job|123',
          'job\\123',
          'job/123',
          'job:123',
          'job;123',
          'job"123"',
          "job'123'",
          'job<123>',
          'job,123',
          'job.123',
          'job?123',
          'job!123'
        ];
        
        invalidJobIds.forEach(jobId => {
          const result = JobIdParamSchema.safeParse({ jobId });
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.errors[0].message).toContain('Invalid job ID format');
          }
        });
      });
    });

    describe('JdCoreSchema', () => {
      it('should accept string and transform to string array', () => {
        const result = JdCoreSchema.safeParse('single requirement');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(['single requirement']);
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.data.length).toBe(1);
        }
      });

      it('should accept string array and preserve it', () => {
        const input = ['requirement 1', 'requirement 2', 'requirement 3'];
        const result = JdCoreSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(input);
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.data.length).toBe(3);
        }
      });

      it('should handle empty string', () => {
        const result = JdCoreSchema.safeParse('');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(['']);
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.data.length).toBe(1);
        }
      });

      it('should handle empty array', () => {
        const result = JdCoreSchema.safeParse([]);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual([]);
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.data.length).toBe(0);
        }
      });

      it('should reject non-string values', () => {
        const invalidInputs = [123, null, undefined, {}, true, false];
        
        invalidInputs.forEach(input => {
          const result = JdCoreSchema.safeParse(input);
          expect(result.success).toBe(false);
        });
      });

      it('should reject mixed array types', () => {
        const result = JdCoreSchema.safeParse(['valid string', 123, 'another string']);
        expect(result.success).toBe(false);
      });
    });
    
    describe('ErrorResponseSchema', () => {
      it('should validate error responses', () => {
        const validErrors = [
          { error: 'Simple error' },
          { error: 'Error with code', code: 'VALIDATION_ERROR' },
          { error: 'Error with issues', issues: ['Issue 1', 'Issue 2'] },
          { error: 'Complete error', code: 'AI_ERROR', issues: ['Issue 1'], timestamp: 1234567890 }
        ];
        
        validErrors.forEach(error => {
          const result = ErrorResponseSchema.safeParse(error);
          expect(result.success).toBe(true);
        });
      });
      
      it('should reject invalid error responses', () => {
        const invalidErrors = [
          {}, // missing error field
          { code: 'ERROR' }, // missing error field
          { error: 123 }, // error should be string
          { error: 'Error', code: 123 }, // code should be string
          { error: 'Error', issues: 'not array' }, // issues should be array
          { error: 'Error', timestamp: 'not number' } // timestamp should be number
        ];
        
        invalidErrors.forEach(error => {
          const result = ErrorResponseSchema.safeParse(error);
          expect(result.success).toBe(false);
        });
      });
    });
    
    describe('MetadataSchema', () => {
      it('should validate metadata', () => {
        const validMetadata = [
          {},
          { tokensUsed: 100 },
          { cost: 0.05 },
          { version: 'v2.0' },
          { tokensUsed: 100, cost: 0.05, version: 'v2.0', extractedAt: 1234567890 }
        ];
        
        validMetadata.forEach(metadata => {
          const result = MetadataSchema.safeParse(metadata);
          expect(result.success).toBe(true);
        });
      });
      
      it('should reject invalid metadata', () => {
        const invalidMetadata = [
          { tokensUsed: -1 }, // negative tokens
          { cost: -0.01 }, // negative cost
          { tokensUsed: '100' }, // string instead of number
          { cost: '0.05' }, // string instead of number
          { version: 123 }, // number instead of string
          { extractedAt: '1234567890' } // string instead of number
        ];
        
        invalidMetadata.forEach(metadata => {
          const result = MetadataSchema.safeParse(metadata);
          expect(result.success).toBe(false);
        });
      });
    });
  });
  
  describe('Score Answer Schemas', () => {
    describe('ScoreAnswerV2RequestSchema', () => {
      it('should validate V2 requests', () => {
        const validV2Request = {
          answer: 'This is my answer',
          persona: 'recruiter' as const,
          jdCore: ['requirement 1', 'requirement 2'],
          companyValues: ['value 1', 'value 2'],
          userProfile: {
            level: 'senior',
            tenure: '5 years',
            goals: 'leadership'
          },
          matchMatrix: {
            communityTopics: ['topic 1', 'topic 2'],
            skills: ['skill 1', 'skill 2']
          },
          evidenceQuality: 0.8,
          previous: {
            overall: 75,
            subscores: { technical: 80, communication: 70 }
          }
        };
        
        const result = ScoreAnswerV2RequestSchema.safeParse(validV2Request);
        expect(result.success).toBe(true);
      });
      
      it('should validate minimal V2 requests', () => {
        const minimalV2Request = {
          answer: 'Minimal answer',
          persona: 'hm' as const
        };
        
        const result = ScoreAnswerV2RequestSchema.safeParse(minimalV2Request);
        expect(result.success).toBe(true);
      });
      
      it('should reject invalid V2 requests', () => {
        const invalidV2Requests = [
          {}, // missing required fields
          { answer: 'Answer' }, // missing persona
          { persona: 'recruiter' }, // missing answer
          { answer: '', persona: 'recruiter' }, // empty answer
          { answer: 'a'.repeat(10001), persona: 'recruiter' }, // answer too long
          { answer: 'Answer', persona: 'invalid' }, // invalid persona
          { answer: 'Answer', persona: 'recruiter', evidenceQuality: 1.5 }, // evidenceQuality > 1
          { answer: 'Answer', persona: 'recruiter', evidenceQuality: -0.1 }, // evidenceQuality < 0
          { answer: 'Answer', persona: 'recruiter', previous: { overall: 150 } } // score > 100
        ];
        
        invalidV2Requests.forEach(request => {
          const result = ScoreAnswerV2RequestSchema.safeParse(request);
          expect(result.success).toBe(false);
        });
      });

      it('should handle jdCore as string and transform to array', () => {
        const request = {
          answer: 'This is my answer',
          persona: 'recruiter' as const,
          jdCore: 'single requirement'
        };
        
        const result = ScoreAnswerV2RequestSchema.safeParse(request);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.jdCore).toEqual(['single requirement']);
          expect(Array.isArray(result.data.jdCore)).toBe(true);
        }
      });

      it('should handle jdCore as string array and preserve it', () => {
        const request = {
          answer: 'This is my answer',
          persona: 'recruiter' as const,
          jdCore: ['requirement 1', 'requirement 2']
        };
        
        const result = ScoreAnswerV2RequestSchema.safeParse(request);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.jdCore).toEqual(['requirement 1', 'requirement 2']);
          expect(Array.isArray(result.data.jdCore)).toBe(true);
        }
      });

      it('should handle missing jdCore field', () => {
        const request = {
          answer: 'This is my answer',
          persona: 'recruiter' as const
        };
        
        const result = ScoreAnswerV2RequestSchema.safeParse(request);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.jdCore).toBeUndefined();
        }
      });
    });
    
    describe('ScoreAnswerLegacyRequestSchema', () => {
      it('should validate legacy requests', () => {
        const validLegacyRequest = {
          questionId: 'q1',
          answerText: 'This is my answer',
          iteration: 2,
          testOnly: true,
          followUpQA: {
            question: 'Follow-up question?',
            answer: 'Follow-up answer'
          }
        };
        
        const result = ScoreAnswerLegacyRequestSchema.safeParse(validLegacyRequest);
        expect(result.success).toBe(true);
      });
      
      it('should validate minimal legacy requests', () => {
        const minimalLegacyRequest = {
          questionId: 'q1',
          answerText: 'Minimal answer'
        };
        
        const result = ScoreAnswerLegacyRequestSchema.safeParse(minimalLegacyRequest);
        expect(result.success).toBe(true);
      });
      
      it('should reject invalid legacy requests', () => {
        const invalidLegacyRequests = [
          {}, // missing required fields
          { questionId: 'q1' }, // missing answerText
          { answerText: 'Answer' }, // missing questionId
          { questionId: '', answerText: 'Answer' }, // empty questionId
          { questionId: 'q1', answerText: '' }, // empty answerText
          { questionId: 'q1', answerText: 'a'.repeat(10001) }, // answerText too long
          { questionId: 'q1', answerText: 'Answer', iteration: 0 }, // iteration < 1
          { questionId: 'q1', answerText: 'Answer', iteration: 101 }, // iteration > 100
          { questionId: 'q1', answerText: 'Answer', testOnly: 'yes' } // testOnly should be boolean
        ];
        
        invalidLegacyRequests.forEach(request => {
          const result = ScoreAnswerLegacyRequestSchema.safeParse(request);
          expect(result.success).toBe(false);
        });
      });
    });
  });
  
  describe('Suggest Follow-up Schemas', () => {
    describe('SuggestFollowUpRequestSchema', () => {
      it('should validate follow-up requests', () => {
        const validRequest = {
          answer: 'This is my answer',
          persona: 'recruiter' as const,
          jdCore: ['requirement 1'],
          companyValues: ['value 1'],
          userProfile: { level: 'senior' },
          matchMatrix: { communityTopics: ['topic 1'] },
          evidenceQuality: 0.7,
          previous: { overall: 75 }
        };
        
        const result = SuggestFollowUpRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });
      
      it('should reject invalid follow-up requests', () => {
        const invalidRequests = [
          {}, // missing required fields
          { answer: 'Answer' }, // missing persona
          { persona: 'recruiter' }, // missing answer
          { answer: 'Answer', persona: 'invalid' }, // invalid persona
          { answer: 'a'.repeat(10001), persona: 'recruiter' } // answer too long
        ];
        
        invalidRequests.forEach(request => {
          const result = SuggestFollowUpRequestSchema.safeParse(request);
          expect(result.success).toBe(false);
        });
      });

      it('should handle jdCore as string and transform to array', () => {
        const request = {
          answer: 'This is my answer',
          persona: 'recruiter' as const,
          jdCore: 'single requirement'
        };
        
        const result = SuggestFollowUpRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.jdCore).toEqual(['single requirement']);
          expect(Array.isArray(result.data.jdCore)).toBe(true);
        }
      });

      it('should handle jdCore as string array and preserve it', () => {
        const request = {
          answer: 'This is my answer',
          persona: 'recruiter' as const,
          jdCore: ['requirement 1', 'requirement 2']
        };
        
        const result = SuggestFollowUpRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.jdCore).toEqual(['requirement 1', 'requirement 2']);
          expect(Array.isArray(result.data.jdCore)).toBe(true);
        }
      });

      it('should handle missing jdCore field', () => {
        const request = {
          answer: 'This is my answer',
          persona: 'recruiter' as const
        };
        
        const result = SuggestFollowUpRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.jdCore).toBeUndefined();
        }
      });
    });
  });
  
  describe('Extract Core Stories Schemas', () => {
    describe('ExtractCoreStoriesRequestSchema', () => {
      it('should validate core stories requests', () => {
        const validRequest = {
          answers: [
            { questionId: 'q1', answerText: 'Answer 1', score: 80, iteration: 1 },
            { questionId: 'q2', answerText: 'Answer 2', score: 75, iteration: 1 },
            { questionId: 'q3', answerText: 'Answer 3', score: 85, iteration: 1 },
            { questionId: 'q4', answerText: 'Answer 4', score: 70, iteration: 1 },
            { questionId: 'q5', answerText: 'Answer 5', score: 90, iteration: 1 }
          ],
          themes: ['leadership', 'problem-solving'],
          persona: 'recruiter' as const,
          maxStories: 5,
          minStories: 3
        };
        
        const result = ExtractCoreStoriesRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
      });
      
      it('should validate minimal core stories requests', () => {
        const minimalRequest = {
          answers: [
            { questionId: 'q1', answerText: 'Answer 1' },
            { questionId: 'q2', answerText: 'Answer 2' },
            { questionId: 'q3', answerText: 'Answer 3' },
            { questionId: 'q4', answerText: 'Answer 4' },
            { questionId: 'q5', answerText: 'Answer 5' }
          ],
          themes: ['theme1', 'theme2'],
          persona: 'hiring-manager' as const
        };
        
        const result = ExtractCoreStoriesRequestSchema.safeParse(minimalRequest);
        expect(result.success).toBe(true);
      });
      
      it('should reject invalid core stories requests', () => {
        const invalidRequests = [
          {}, // missing required fields
          { answers: [], themes: ['theme1'], persona: 'recruiter' }, // too few answers
          { answers: [{ questionId: 'q1', answerText: 'Answer 1' }], themes: [], persona: 'recruiter' }, // too few themes
          { answers: [{ questionId: 'q1', answerText: 'Answer 1' }], themes: ['theme1'], persona: 'invalid' }, // invalid persona
          { answers: [{ questionId: 'q1', answerText: 'Answer 1' }], themes: ['theme1'], persona: 'recruiter', maxStories: 0 }, // maxStories < 1
          { answers: [{ questionId: 'q1', answerText: 'Answer 1' }], themes: ['theme1'], persona: 'recruiter', maxStories: 11 }, // maxStories > 10
          { answers: [{ questionId: 'q1', answerText: 'Answer 1' }], themes: ['theme1'], persona: 'recruiter', minStories: 0 }, // minStories < 1
          { answers: [{ questionId: 'q1', answerText: 'Answer 1' }], themes: ['theme1'], persona: 'recruiter', minStories: 11 } // minStories > 10
        ];
        
        invalidRequests.forEach(request => {
          const result = ExtractCoreStoriesRequestSchema.safeParse(request);
          expect(result.success).toBe(false);
        });
      });
    });
  });
  
  describe('Validation Helpers', () => {
    describe('validateRequest', () => {
      it('should return success for valid data', () => {
        const schema = JobIdParamSchema;
        const data = { jobId: 'test-123' };
        
        const result = validateRequest(schema, data);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(data);
        }
      });
      
      it('should return error for invalid data', () => {
        const schema = JobIdParamSchema;
        const data = { jobId: '' };
        
        const result = validateRequest(schema, data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
          expect(result.error.message).toBe('Request validation failed');
          expect(result.error.issues).toHaveLength(1);
          expect(result.error.issues[0]).toContain('Job ID is required');
        }
      });
      
      it('should handle multiple validation errors', () => {
        const schema = ScoreAnswerV2RequestSchema;
        const data = { answer: '', persona: 'invalid' };
        
        const result = validateRequest(schema, data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(1);
        }
      });
      
      it('should handle non-JSON data gracefully', () => {
        const schema = JobIdParamSchema;
        const data = undefined;
        
        const result = validateRequest(schema, data);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
          expect(result.error.message).toBe('Request validation failed');
        }
      });
    });
    
    describe('validateResponse', () => {
      beforeEach(() => {
        // Mock NODE_ENV for testing
        vi.stubEnv('NODE_ENV', 'development');
      });
      
      it('should validate responses in development', () => {
        const schema = MetadataSchema;
        const data = { tokensUsed: 100 };
        
        const result = validateResponse(schema, data);
        expect(result).toBe(true);
      });
      
      it('should return false for invalid responses in development', () => {
        const schema = MetadataSchema;
        const data = { tokensUsed: -1 };
        
        const result = validateResponse(schema, data);
        expect(result).toBe(false);
      });
      
      it('should skip validation in production', () => {
        vi.stubEnv('NODE_ENV', 'production');
        
        const schema = MetadataSchema;
        const data = { tokensUsed: -1 }; // Invalid data
        
        const result = validateResponse(schema, data);
        expect(result).toBe(true); // Should skip validation
      });
    });
    
    describe('mapErrorToResponse', () => {
      it('should map Error instances correctly', () => {
        const error = new Error('Test error message');
        const result = mapErrorToResponse(error);
        
        expect(result.code).toBe('INTERNAL_ERROR');
        expect(result.message).toBe('Test error message');
        expect(typeof result.timestamp).toBe('number');
      });
      
      it('should map AI errors correctly', () => {
        const error = new Error('AI provider failed');
        const result = mapErrorToResponse(error);
        
        expect(result.code).toBe('AI_ERROR');
        expect(result.message).toBe('AI provider failed');
      });
      
      it('should map database errors correctly', () => {
        const error = new Error('Database connection failed');
        const result = mapErrorToResponse(error);
        
        expect(result.code).toBe('DATABASE_ERROR');
        expect(result.message).toBe('Database operation failed');
      });
      
      it('should map validation errors correctly', () => {
        const error = new Error('Validation failed');
        const result = mapErrorToResponse(error);
        
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.message).toBe('Validation failed');
      });
      
      it('should handle unknown error types', () => {
        const error = { message: 'Unknown error' };
        const result = mapErrorToResponse(error);
        
        expect(result.code).toBe('UNKNOWN_ERROR');
        expect(result.message).toBe('An unexpected error occurred');
      });
      
      it('should handle null/undefined errors', () => {
        const result = mapErrorToResponse(null);
        
        expect(result.code).toBe('UNKNOWN_ERROR');
        expect(result.message).toBe('An unexpected error occurred');
      });
    });
  });
  
  describe('Edge Cases and Complex Validation', () => {
    it('should handle very long strings within limits', () => {
      const longAnswer = 'a'.repeat(10000); // Exactly at the limit
      const request = {
        answer: longAnswer,
        persona: 'recruiter' as const
      };
      
      const result = ScoreAnswerV2RequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
    
    it('should handle arrays at their limits', () => {
      const manyAnswers = Array.from({ length: 100 }, (_, i) => ({
        questionId: `q${i}`,
        answerText: `Answer ${i}`
      }));
      
      const request = {
        answers: manyAnswers,
        themes: ['theme1', 'theme2'],
        persona: 'recruiter' as const
      };
      
      const result = ExtractCoreStoriesRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
    
    it('should handle nested object validation', () => {
      const complexRequest = {
        answer: 'Complex answer',
        persona: 'recruiter' as const,
        userProfile: {
          level: 'senior',
          tenure: '5+ years',
          goals: 'Leadership role'
        },
        matchMatrix: {
          communityTopics: ['tech', 'leadership', 'innovation'],
          skills: ['javascript', 'react', 'nodejs', 'python']
        },
        previous: {
          overall: 85,
          subscores: {
            technical: 90,
            communication: 80,
            leadership: 85,
            problemSolving: 90
          }
        }
      };
      
      const result = ScoreAnswerV2RequestSchema.safeParse(complexRequest);
      expect(result.success).toBe(true);
    });
  });
});

describe('Utility Functions', () => {
  describe('normalizeCategory', () => {
    it('should normalize "almost-there" to "needs-improvement"', () => {
      expect(normalizeCategory('almost-there')).toBe('needs-improvement');
    });

    it('should normalize "near-miss" to "needs-improvement"', () => {
      expect(normalizeCategory('near-miss')).toBe('needs-improvement');
    });

    it('should preserve valid categories', () => {
      expect(normalizeCategory('excellent')).toBe('excellent');
      expect(normalizeCategory('good')).toBe('good');
      expect(normalizeCategory('needs-improvement')).toBe('needs-improvement');
      expect(normalizeCategory('poor')).toBe('poor');
    });

    it('should default unknown categories to "needs-improvement"', () => {
      expect(normalizeCategory('unknown-category')).toBe('needs-improvement');
      expect(normalizeCategory('invalid')).toBe('needs-improvement');
      expect(normalizeCategory('')).toBe('needs-improvement');
    });
  });
});
