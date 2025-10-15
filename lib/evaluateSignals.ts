import { getLatestAttachment } from '@/db/repository';
import { getAllAtsSignals, saveJobDynamicSignals, saveSignalEvaluations } from '@/db/signalRepository';
import { ATS_STANDARD_SIGNALS, Signal, DYNAMIC_SIGNALS_EXAMPLE } from './matchSignals';
import { readFileSync } from 'fs';
import path from 'path';

interface EvaluationResult {
  signalId: string;
  jdScore: number;
  resumeScore: number;
  overallScore: number;
  jdEvidence: string;
  resumeEvidence: string;
  aiReasoning: string;
}

/**
 * Main function to evaluate all signals for a job
 */
export async function evaluateSignalsForJob(
  jobId: string,
  jdVersion: number,
  resumeVersion: number
): Promise<void> {
  // 1. Fetch JD and Resume content
  const jdAttachment = getLatestAttachment(jobId, 'jd');
  const resumeAttachment = getLatestAttachment(jobId, 'resume');

  if (!jdAttachment || !resumeAttachment) {
    throw new Error('Missing JD or Resume');
  }

  const jdContent = extractTextFromAttachment(jdAttachment);
  const resumeContent = extractTextFromAttachment(resumeAttachment);

  // 2. Generate dynamic signals from JD (up to 30)
  const dynamicSignals = await generateDynamicSignalsFromJD(jdContent, resumeContent);
  
  // 3. Mark ATS signals that are also emphasized in JD
  const atsSignals = markDualSignals(ATS_STANDARD_SIGNALS, dynamicSignals);

  // 4. Save dynamic signals to database
  saveDynamicSignalsToDb(jobId, dynamicSignals);

  // 5. Evaluate all signals (30 ATS + up to 30 Dynamic = up to 60 total)
  const allSignals = [...atsSignals, ...dynamicSignals];
  const evaluations = await evaluateAllSignals(allSignals, jdContent, resumeContent);

  // 6. Save evaluations to database
  const evaluationRecords = evaluations.map(evaluation => ({
    signalId: evaluation.signalId,
    resumeVersion,
    jdVersion,
    jdScore: evaluation.jdScore,
    resumeScore: evaluation.resumeScore,
    overallScore: evaluation.overallScore,
    jdEvidence: evaluation.jdEvidence,
    resumeEvidence: evaluation.resumeEvidence,
    aiReasoning: evaluation.aiReasoning
  }));

  saveSignalEvaluations(jobId, evaluationRecords);
}

/**
 * Extract text content from attachment
 */
function extractTextFromAttachment(attachment: any): string {
  // In production, this would use proper document parsers (pdf-parse, mammoth, etc.)
  // For now, return the stored content or a placeholder
  if (attachment.content) {
    return attachment.content;
  }
  
  // Try to read from file system
  try {
    const filePath = path.join(process.cwd(), 'data', 'uploads', attachment.filePath);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('Error reading attachment file:', error);
    return '';
  }
}

/**
 * Generate up to 30 dynamic signals from JD using AI
 */
async function generateDynamicSignalsFromJD(jdContent: string, resumeContent: string): Promise<Signal[]> {
  // TODO: Replace with actual AI call to Claude/GPT
  // For now, return example signals
  
  // The AI prompt should be:
  // "Analyze this job description and generate up to 30 specific, measurable signals 
  // that are unique to this role. Focus on:
  // 1. Specific technologies, tools, or platforms mentioned
  // 2. Industry-specific requirements (e.g., fintech compliance, healthcare HIPAA)
  // 3. Company-stage requirements (e.g., startup vs enterprise)
  // 4. Role-specific competencies
  // 5. Specific experience requirements
  // 
  // For each signal, provide:
  // - id: unique identifier (dyn_XXX_N)
  // - name: clear, specific signal name
  // - category: technical | experience | soft
  // - description: what this signal measures
  // - baseWeight: importance (0-1)
  // 
  // Return as JSON array."

  // For now, return example dynamic signals (20 signals)
  return DYNAMIC_SIGNALS_EXAMPLE;
}

/**
 * Mark ATS signals that are also emphasized in the JD
 */
function markDualSignals(atsSignals: Signal[], dynamicSignals: Signal[]): Signal[] {
  // Create a set of dynamic signal names (lowercase for comparison)
  const dynamicSignalNames = new Set(
    dynamicSignals.map(s => s.name.toLowerCase())
  );

  return atsSignals.map(signal => {
    // Check if this ATS signal's concept is also in dynamic signals
    const signalNameLower = signal.name.toLowerCase();
    const isInBothLists = dynamicSignalNames.has(signalNameLower) ||
      // Check for partial matches (e.g., "Leadership" matches "Leadership Experience")
      Array.from(dynamicSignalNames).some(dynName => 
        dynName.includes(signalNameLower) || signalNameLower.includes(dynName)
      );

    return {
      ...signal,
      isInBothLists
    };
  });
}

/**
 * Save dynamic signals to database
 */
function saveDynamicSignalsToDb(jobId: string, dynamicSignals: Signal[]): void {
  const signalRecords = dynamicSignals.map(signal => ({
    signalId: signal.id,
    adjustedWeight: signal.baseWeight,
    reasoning: `Generated from JD analysis: ${signal.description}`
  }));

  saveJobDynamicSignals(jobId, signalRecords);
}

/**
 * Evaluate all signals against JD and Resume
 */
async function evaluateAllSignals(
  signals: Signal[],
  jdContent: string,
  resumeContent: string
): Promise<EvaluationResult[]> {
  // TODO: Replace with actual AI evaluation
  // For now, generate mock evaluation results
  
  // The AI prompt for each signal should be:
  // "Evaluate this signal for the candidate:
  // 
  // Signal: {signal.name}
  // Description: {signal.description}
  // 
  // Job Description:
  // {jdContent}
  // 
  // Resume:
  // {resumeContent}
  // 
  // Please provide:
  // 1. jdScore (0-1): How much does the JD emphasize this signal?
  // 2. resumeScore (0-1): How well does the resume demonstrate this signal?
  // 3. jdEvidence: Specific text from JD supporting the score
  // 4. resumeEvidence: Specific text from Resume supporting the score
  // 5. reasoning: Explanation of the scores
  // 
  // Return as JSON."

  return signals.map(signal => {
    // Generate mock scores (in production, this would come from AI)
    const jdScore = Math.random() * 0.4 + 0.6; // 60-100%
    const resumeScore = Math.random() * 0.4 + 0.5; // 50-90%
    const overallScore = (jdScore + resumeScore) / 2;

    return {
      signalId: signal.id,
      jdScore,
      resumeScore,
      overallScore,
      jdEvidence: `Job description mentions ${signal.name.toLowerCase()} as a key requirement.`,
      resumeEvidence: `Resume demonstrates ${signal.name.toLowerCase()} through relevant experience.`,
      aiReasoning: `Strong alignment detected between JD requirements and resume qualifications for ${signal.name}.`
    };
  });
}

/**
 * Helper to calculate trend
 */
export function calculateTrend(currentScore: number, previousScore?: number): {
  trend: 'up' | 'down' | 'stable';
  change: number;
} {
  if (previousScore === undefined) {
    return { trend: 'stable', change: 0 };
  }

  const change = currentScore - previousScore;
  const percentChange = Math.abs(change);

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (percentChange > 0.05) { // >5% change
    trend = change > 0 ? 'up' : 'down';
  }

  return { trend, change };
}

