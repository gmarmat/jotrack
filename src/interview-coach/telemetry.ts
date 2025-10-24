import { createHash } from 'crypto';

/**
 * Interview Coach Telemetry & Error Reporting
 * 
 * Non-invasive observability system for tracking Interview Coach usage
 * and performance without requiring refactors to existing code.
 */

export interface CoachEventData {
  route: string;
  persona: string;
  durationMs: number;
  score?: number;
  confidence?: number;
  promptsCount?: number;
  storiesCount?: number;
  flags?: string[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Redact PII from long text content
 * Returns hash + length for privacy-preserving logging
 */
function redactLongContent(content: string, maxLength: number = 100): string {
  if (!content || content.length <= maxLength) {
    return content;
  }
  
  const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
  return `[redacted:${hash}:${content.length}]`;
}

/**
 * Redact PII from answer content
 * Preserves structure while removing sensitive information
 */
function redactAnswer(answer: string): string {
  if (!answer) return '';
  
  // Redact if answer is longer than 200 characters
  if (answer.length > 200) {
    return redactLongContent(answer, 200);
  }
  
  return answer;
}

/**
 * Log Interview Coach event with telemetry data
 * 
 * @param eventData - Event data containing route, persona, duration, and metrics
 */
export function logCoachEvent(eventData: CoachEventData): void {
  try {
    // Redact any PII from metadata
    const sanitizedMetadata = { ...eventData.metadata };
    if (sanitizedMetadata.answer) {
      sanitizedMetadata.answer = redactAnswer(sanitizedMetadata.answer);
    }
    if (sanitizedMetadata.question) {
      sanitizedMetadata.question = redactLongContent(sanitizedMetadata.question, 150);
    }
    
    // Create sanitized event data
    const sanitizedEvent: CoachEventData = {
      ...eventData,
      metadata: sanitizedMetadata
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Coach Event:', {
        timestamp: new Date().toISOString(),
        event: 'interview_coach_usage',
        ...sanitizedEvent
      });
    }
    
    // TODO: Future hook for external telemetry sink
    // This could be extended to send to external services like:
    // - DataDog, New Relic, or other APM tools
    // - Custom analytics endpoints
    // - Error tracking services
    
    // Example future implementation:
    // if (process.env.TELEMETRY_ENDPOINT) {
    //   fetch(process.env.TELEMETRY_ENDPOINT, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(sanitizedEvent)
    //   }).catch(err => console.error('Telemetry send failed:', err));
    // }
    
  } catch (error) {
    // Never let telemetry errors break the main flow
    console.error('Telemetry logging failed:', error);
  }
}

/**
 * Log Interview Coach error with context
 * 
 * @param route - The route where the error occurred
 * @param persona - The persona being used
 * @param error - The error object or message
 * @param context - Additional context about the error
 */
export function logCoachError(
  route: string,
  persona: string,
  error: Error | string,
  context?: Record<string, any>
): void {
  try {
    const errorData = {
      route,
      persona,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      context: context ? { ...context } : undefined
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Coach Error:', errorData);
    }
    
    // TODO: Future hook for error reporting service
    // This could be extended to send to external services like:
    // - Sentry, Bugsnag, or other error tracking tools
    // - Custom error reporting endpoints
    
  } catch (telemetryError) {
    // Never let telemetry errors break the main flow
    console.error('Error telemetry logging failed:', telemetryError);
  }
}

/**
 * Measure execution time for Interview Coach operations
 * 
 * @param operation - The operation being measured
 * @param fn - The function to execute and measure
 * @returns The result of the function execution
 */
export async function measureCoachOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;
    
    logCoachEvent({
      route: 'operation',
      persona: 'system',
      durationMs,
      metadata: { operation, success: true }
    });
    
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    
    logCoachError('operation', 'system', error, { operation, durationMs });
    throw error;
  }
}

/**
 * Utility function to extract metrics from Interview Coach responses
 * 
 * @param response - The response object from Interview Coach operations
 * @returns Extracted metrics for telemetry
 */
export function extractCoachMetrics(response: any): {
  score?: number;
  confidence?: number;
  promptsCount?: number;
  storiesCount?: number;
  flags?: string[];
} {
  const metrics: any = {};
  
  try {
    // Extract score
    if (response.score !== undefined) {
      metrics.score = response.score;
    } else if (response.v2Score !== undefined) {
      metrics.score = response.v2Score;
    }
    
    // Extract confidence
    if (response.confidence !== undefined) {
      metrics.confidence = response.confidence;
    }
    
    // Extract prompts count
    if (response.questions && Array.isArray(response.questions)) {
      metrics.promptsCount = response.questions.length;
    } else if (response.followUps && Array.isArray(response.followUps)) {
      metrics.promptsCount = response.followUps.length;
    }
    
    // Extract stories count
    if (response.stories && Array.isArray(response.stories)) {
      metrics.storiesCount = response.stories.length;
    } else if (response.coreStories && Array.isArray(response.coreStories)) {
      metrics.storiesCount = response.coreStories.length;
    }
    
    // Extract flags
    if (response.flags && Array.isArray(response.flags)) {
      metrics.flags = response.flags;
    }
    
  } catch (error) {
    // Never let metric extraction errors break the main flow
    console.error('Metric extraction failed:', error);
  }
  
  return metrics;
}

/**
 * Default telemetry configuration
 */
export const telemetryConfig = {
  enabled: process.env.NODE_ENV === 'development' || process.env.TELEMETRY_ENABLED === 'true',
  redactionEnabled: true,
  maxContentLength: 100,
  maxAnswerLength: 200
};
