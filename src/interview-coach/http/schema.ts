import { z } from 'zod';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize category strings to allowed enum values
 */
export const normalizeCategory = (c: string): 'excellent'|'good'|'needs-improvement'|'poor' => {
  const map: Record<string,string> = {
    'almost-there':'needs-improvement',
    'near-miss':'needs-improvement'
  };
  const v = (map[c] || c) as any;
  return ['excellent','good','needs-improvement','poor'].includes(v) ? v : 'needs-improvement';
};

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

/**
 * Job ID parameter validation
 */
export const JobIdParamSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required').regex(/^[a-zA-Z0-9_-]+$/, 'Invalid job ID format')
});

/**
 * Reusable: accept string OR string[], normalize to string[]
 */
export const JdCoreSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : [v]));

/**
 * Base error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  issues: z.array(z.string()).optional(),
  timestamp: z.number().optional()
});

/**
 * Metadata schema for responses
 */
export const MetadataSchema = z.object({
  tokensUsed: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  version: z.string().optional(),
  extractedAt: z.number().optional(),
  savedAt: z.number().optional()
});

// ============================================================================
// SCORE-ANSWER ROUTE SCHEMAS
// ============================================================================

/**
 * V2 Answer scoring request schema
 */
export const ScoreAnswerV2RequestSchema = z.object({
  answer: z.string().min(1, 'Answer text is required').max(10000, 'Answer too long'),
  persona: z.enum(['recruiter', 'hm', 'peer'], {
    errorMap: () => ({ message: 'Persona must be recruiter, hm, or peer' })
  }),
  jdCore: JdCoreSchema.optional(),
  companyValues: z.array(z.string()).optional(),
  userProfile: z.object({
    level: z.string().optional(),
    tenure: z.string().optional(),
    goals: z.string().optional()
  }).optional(),
  matchMatrix: z.object({
    communityTopics: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional()
  }).optional(),
  evidenceQuality: z.number().min(0).max(1).optional(),
  previous: z.object({
    overall: z.number().min(0).max(100).optional(),
    subscores: z.record(z.number().min(0).max(100)).optional()
  }).optional()
});

/**
 * Legacy Answer scoring request schema (backward compatibility)
 */
export const ScoreAnswerLegacyRequestSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answerText: z.string().min(1, 'Answer text is required').max(10000, 'Answer too long'),
  iteration: z.number().min(1).max(100).default(1),
  testOnly: z.boolean().default(false),
  followUpQA: z.object({
    question: z.string().optional(),
    answer: z.string().optional()
  }).optional()
});

/**
 * Combined score answer request schema
 */
export const ScoreAnswerRequestSchema = z.union([
  ScoreAnswerV2RequestSchema,
  ScoreAnswerLegacyRequestSchema
]);

/**
 * Feedback object schema
 */
export const FeedbackSchema = z.object({
  summary: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  framings: z.array(z.object({
    weakness: z.string(),
    doSay: z.array(z.string()),
    dontSay: z.array(z.string()),
    rationale: z.string()
  })).optional()
});

/**
 * Score data schema
 */
export const ScoreDataSchema = z.object({
  overall: z.number().min(0).max(100),
  scoreCategory: z.enum(['excellent', 'good', 'needs-improvement', 'poor']).optional(),
  feedback: FeedbackSchema.optional(),
  iterations: z.array(z.any()).optional(),
  scores: z.array(z.any()).optional(),
  followUpQuestions: z.array(z.string()).optional()
});

/**
 * V2 Enhanced scoring result schema
 */
export const V2ScoringResultSchema = z.object({
  score: z.number().min(0).max(100),
  subscores: z.record(z.number().min(0).max(100)),
  flags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  confidenceReasons: z.array(z.string()),
  deltas: z.record(z.string(), z.number()).optional(),
  version: z.literal('v2')
});

/**
 * Score answer response schema
 */
export const ScoreAnswerResponseSchema = z.object({
  success: z.boolean(),
  score: ScoreDataSchema.optional(),
  impactExplanation: z.string().optional(),
  iteration: z.number().optional(),
  testOnly: z.boolean().optional(),
  savedAt: z.number().optional(),
  metadata: MetadataSchema.optional(),
  // V2 fields
  v2Score: z.number().min(0).max(100).optional(),
  subscores: z.record(z.number().min(0).max(100)).optional(),
  flags: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  confidenceReasons: z.array(z.string()).optional(),
  deltas: z.record(z.number()).optional(),
  version: z.string().optional()
});

// ============================================================================
// SUGGEST-FOLLOW-UP ROUTE SCHEMAS
// ============================================================================

/**
 * Follow-up request schema (reuses V2 fields from score-answer)
 */
export const SuggestFollowUpRequestSchema = z.object({
  answer: z.string().min(1, 'Answer text is required').max(10000, 'Answer too long'),
  persona: z.enum(['recruiter', 'hm', 'peer'], {
    errorMap: () => ({ message: 'Persona must be recruiter, hm, or peer' })
  }),
  jdCore: JdCoreSchema.optional(),
  companyValues: z.array(z.string()).optional(),
  userProfile: z.object({
    level: z.string().optional(),
    tenure: z.string().optional(),
    goals: z.string().optional()
  }).optional(),
  matchMatrix: z.object({
    communityTopics: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional()
  }).optional(),
  evidenceQuality: z.number().min(0).max(1).optional(),
  previous: z.object({
    overall: z.number().min(0).max(100).optional(),
    subscores: z.record(z.number().min(0).max(100)).optional()
  }).optional()
});

/**
 * Follow-up prompt schema
 */
export const FollowUpPromptSchema = z.object({
  text: z.string(),
  targets: z.array(z.string()),
  priority: z.number().min(1).max(10),
  rationale: z.string().optional()
});

/**
 * Follow-up response schema
 */
export const SuggestFollowUpResponseSchema = z.object({
  prompts: z.array(FollowUpPromptSchema).or(z.array(z.string())), // Support both V2 and legacy
  targetedDimensions: z.array(z.string()).optional(),
  reasons: z.array(z.string()).optional(),
  version: z.string().optional()
});

// ============================================================================
// EXTRACT-CORE-STORIES ROUTE SCHEMAS
// ============================================================================

/**
 * Answer item schema for core stories
 */
export const AnswerItemSchema = z.object({
  questionId: z.string(),
  answerText: z.string(),
  score: z.number().min(0).max(100).optional(),
  iteration: z.number().optional()
});

/**
 * Core story schema
 */
export const CoreStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  themes: z.array(z.string()),
  evidence: z.array(z.string()),
  strength: z.number().min(1).max(10),
  relevance: z.number().min(1).max(10)
});

/**
 * Extract core stories request schema
 */
export const ExtractCoreStoriesRequestSchema = z.object({
  answers: z.array(AnswerItemSchema).min(5, 'Need at least 5 practiced answers for synthesis'),
  themes: z.array(z.string()).min(2, 'Need at least 2 themes for synthesis'),
  persona: z.enum(['recruiter', 'hiring-manager', 'peer'], {
    errorMap: () => ({ message: 'Invalid persona. Must be recruiter, hiring-manager, or peer' })
  }),
  maxStories: z.number().min(1).max(10).default(4),
  minStories: z.number().min(1).max(10).default(3)
});

/**
 * Coverage map schema
 */
export const CoverageMapSchema = z.record(z.array(z.string()));

/**
 * Extract core stories response schema
 */
export const ExtractCoreStoriesResponseSchema = z.object({
  coreStories: z.array(CoreStorySchema),
  coverageMap: CoverageMapSchema,
  rationale: z.string(),
  version: z.string(),
  extractedAt: z.number(),
  metadata: z.object({
    answersAnalyzed: z.number(),
    themesCovered: z.number(),
    totalThemes: z.number(),
    synthesisMethod: z.string()
  }).optional()
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates request body against schema and returns formatted error response
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    issues: string[];
  };
} {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    const issues = result.error.errors.map(err => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        issues
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request format',
        issues: ['Request body is not valid JSON or malformed']
      }
    };
  }
}

/**
 * Validates response data during development/testing
 */
export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): boolean {
  if (process.env.NODE_ENV === 'production') {
    return true; // Skip validation in production
  }
  
  try {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error('Response validation failed:', result.error.errors);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Response validation error:', error);
    return false;
  }
}

/**
 * Maps thrown errors to standardized JSON error format
 */
export function mapErrorToResponse(error: unknown): {
  code: string;
  message: string;
  timestamp: number;
} {
  const timestamp = Date.now();
  
  if (error instanceof Error) {
    // Map common error types to specific codes
    if (error.message.includes('AI')) {
      return {
        code: 'AI_ERROR',
        message: error.message,
        timestamp
      };
    }
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        timestamp
      };
    }
    
    if (error.message.includes('validation')) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        timestamp
      };
    }
    
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      timestamp
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    timestamp
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;

export type ScoreAnswerV2Request = z.infer<typeof ScoreAnswerV2RequestSchema>;
export type ScoreAnswerLegacyRequest = z.infer<typeof ScoreAnswerLegacyRequestSchema>;
export type ScoreAnswerRequest = z.infer<typeof ScoreAnswerRequestSchema>;
export type ScoreAnswerResponse = z.infer<typeof ScoreAnswerResponseSchema>;

export type SuggestFollowUpRequest = z.infer<typeof SuggestFollowUpRequestSchema>;
export type SuggestFollowUpResponse = z.infer<typeof SuggestFollowUpResponseSchema>;

export type ExtractCoreStoriesRequest = z.infer<typeof ExtractCoreStoriesRequestSchema>;
export type ExtractCoreStoriesResponse = z.infer<typeof ExtractCoreStoriesResponseSchema>;
export type CoreStory = z.infer<typeof CoreStorySchema>;
export type AnswerItem = z.infer<typeof AnswerItemSchema>;
