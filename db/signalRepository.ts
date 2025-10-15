import { getDb } from './client';
import { randomUUID } from 'crypto';

export interface AtsSignal {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'experience' | 'soft';
  type: 'ats_standard' | 'dynamic';
  baseWeight: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface JobDynamicSignal {
  id: string;
  jobId: string;
  signalId: string;
  adjustedWeight: number;
  reasoning?: string;
  createdAt: number;
}

export interface SignalEvaluation {
  id: string;
  jobId: string;
  signalId: string;
  signalName?: string;
  signalCategory?: string;
  signalType?: string;
  resumeVersion?: number;
  jdVersion?: number;
  analysisRunAt: number;
  jdScore?: number;
  resumeScore?: number;
  overallScore?: number;
  jdEvidence?: string;
  resumeEvidence?: string;
  aiReasoning?: string;
  createdAt: number;
  // For trend comparison
  previousResumeScore?: number;
  scoreChange?: number;
  trend?: 'up' | 'down' | 'stable';
}

// ============ ATS SIGNALS ============

export function getAllAtsSignals(): AtsSignal[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, name, description, category, type, base_weight as baseWeight, 
           is_active as isActive, created_at as createdAt, updated_at as updatedAt
    FROM ats_signals
    WHERE is_active = 1
    ORDER BY category, base_weight DESC
  `).all() as AtsSignal[];
  return rows;
}

export function getAtsSignalById(signalId: string): AtsSignal | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, name, description, category, type, base_weight as baseWeight,
           is_active as isActive, created_at as createdAt, updated_at as updatedAt
    FROM ats_signals
    WHERE id = ?
  `).get(signalId) as AtsSignal | undefined;
  return row || null;
}

export function updateAtsSignal(signalId: string, updates: Partial<AtsSignal>): void {
  const db = getDb();
  const allowedFields = ['name', 'description', 'base_weight', 'is_active'];
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(snakeKey)) {
      setClauses.push(`${snakeKey} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) return;

  setClauses.push('updated_at = unixepoch()');
  values.push(signalId);

  const query = `
    UPDATE ats_signals
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `;
  
  db.prepare(query).run(...values);
}

// ============ JOB DYNAMIC SIGNALS ============

export function getJobDynamicSignals(jobId: string): JobDynamicSignal[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, job_id as jobId, signal_id as signalId, 
           adjusted_weight as adjustedWeight, reasoning, created_at as createdAt
    FROM job_dynamic_signals
    WHERE job_id = ?
    ORDER BY created_at DESC
  `).all(jobId) as JobDynamicSignal[];
  return rows;
}

export function saveJobDynamicSignals(jobId: string, signals: Array<{
  signalId: string;
  adjustedWeight: number;
  reasoning?: string;
}>): void {
  const db = getDb();
  
  // Delete existing dynamic signals for this job
  db.prepare('DELETE FROM job_dynamic_signals WHERE job_id = ?').run(jobId);

  // Insert new dynamic signals
  const insert = db.prepare(`
    INSERT INTO job_dynamic_signals (id, job_id, signal_id, adjusted_weight, reasoning, created_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
  `);

  for (const signal of signals) {
    insert.run(
      randomUUID(),
      jobId,
      signal.signalId,
      signal.adjustedWeight,
      signal.reasoning || null
    );
  }
}

// ============ SIGNAL EVALUATIONS ============

export function getLatestEvaluation(jobId: string, resumeVersion?: number, jdVersion?: number): SignalEvaluation[] {
  const db = getDb();
  
  let query = `
    SELECT 
      e.id, e.job_id as jobId, e.signal_id as signalId,
      s.name as signalName, s.category as signalCategory, s.type as signalType,
      e.resume_version as resumeVersion, e.jd_version as jdVersion,
      e.analysis_run_at as analysisRunAt,
      e.jd_score as jdScore, e.resume_score as resumeScore, e.overall_score as overallScore,
      e.jd_evidence as jdEvidence, e.resume_evidence as resumeEvidence,
      e.ai_reasoning as aiReasoning, e.created_at as createdAt
    FROM signal_evaluations e
    LEFT JOIN ats_signals s ON e.signal_id = s.id
    WHERE e.job_id = ?
  `;

  const params: any[] = [jobId];

  if (resumeVersion !== undefined && jdVersion !== undefined) {
    query += ` AND e.resume_version = ? AND e.jd_version = ?`;
    params.push(resumeVersion, jdVersion);
  } else {
    // Get the most recent evaluation
    query += ` AND e.analysis_run_at = (
      SELECT MAX(analysis_run_at) FROM signal_evaluations WHERE job_id = ?
    )`;
    params.push(jobId);
  }

  query += ` ORDER BY s.category, s.base_weight DESC`;

  const rows = db.prepare(query).all(...params) as SignalEvaluation[];
  return rows;
}

export function getPreviousEvaluation(jobId: string, currentResumeVersion: number, currentJdVersion: number): SignalEvaluation[] {
  const db = getDb();
  
  const query = `
    SELECT 
      e.id, e.job_id as jobId, e.signal_id as signalId,
      e.resume_version as resumeVersion, e.jd_version as jdVersion,
      e.resume_score as resumeScore
    FROM signal_evaluations e
    WHERE e.job_id = ? 
      AND e.jd_version = ?
      AND e.resume_version < ?
      AND e.analysis_run_at = (
        SELECT MAX(e2.analysis_run_at) 
        FROM signal_evaluations e2 
        WHERE e2.job_id = e.job_id 
          AND e2.signal_id = e.signal_id
          AND e2.jd_version = e.jd_version
          AND e2.resume_version < ?
      )
    ORDER BY e.signal_id
  `;

  const rows = db.prepare(query).all(jobId, currentJdVersion, currentResumeVersion, currentResumeVersion) as SignalEvaluation[];
  return rows;
}

export function saveSignalEvaluations(jobId: string, evaluations: Array<{
  signalId: string;
  resumeVersion?: number;
  jdVersion?: number;
  jdScore?: number;
  resumeScore?: number;
  overallScore?: number;
  jdEvidence?: string;
  resumeEvidence?: string;
  aiReasoning?: string;
}>): void {
  const db = getDb();

  const insert = db.prepare(`
    INSERT INTO signal_evaluations (
      id, job_id, signal_id, resume_version, jd_version, analysis_run_at,
      jd_score, resume_score, overall_score, jd_evidence, resume_evidence, ai_reasoning, created_at
    ) VALUES (?, ?, ?, ?, ?, unixepoch(), ?, ?, ?, ?, ?, ?, unixepoch())
  `);

  for (const eval of evaluations) {
    insert.run(
      randomUUID(),
      jobId,
      eval.signalId,
      eval.resumeVersion || null,
      eval.jdVersion || null,
      eval.jdScore || null,
      eval.resumeScore || null,
      eval.overallScore || null,
      eval.jdEvidence || null,
      eval.resumeEvidence || null,
      eval.aiReasoning || null
    );
  }
}

export function getEvaluationWithTrends(jobId: string, resumeVersion: number, jdVersion: number): SignalEvaluation[] {
  const currentEvals = getLatestEvaluation(jobId, resumeVersion, jdVersion);
  const previousEvals = getPreviousEvaluation(jobId, resumeVersion, jdVersion);

  // Create a map of previous scores by signal ID
  const previousScoresMap = new Map<string, number>();
  for (const prev of previousEvals) {
    if (prev.resumeScore !== undefined) {
      previousScoresMap.set(prev.signalId, prev.resumeScore);
    }
  }

  // Add trend information to current evaluations
  return currentEvals.map(current => {
    const prevScore = previousScoresMap.get(current.signalId);
    
    if (prevScore !== undefined && current.resumeScore !== undefined) {
      const scoreChange = current.resumeScore - prevScore;
      const percentChange = Math.abs(scoreChange);

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (percentChange > 0.05) { // >5% change
        trend = scoreChange > 0 ? 'up' : 'down';
      }

      return {
        ...current,
        previousResumeScore: prevScore,
        scoreChange,
        trend
      };
    }

    return current;
  });
}

