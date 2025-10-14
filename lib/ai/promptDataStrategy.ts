/**
 * Centralized Prompt Data Strategy
 * Defines what data each AI analysis section requires
 */

export interface DataRequirements {
  sectionId: string;
  requiredAttachments: ('jd' | 'resume' | 'cover_letter')[];
  optionalAttachments: ('portfolio' | 'transcript' | 'other')[];
  requiredFields: string[];
  contextDependencies: string[]; // Previous analysis results to include
  maxTokens: number;
  description: string;
}

/**
 * Section Data Requirements Map
 * Defines dependencies and token budgets for each analysis section
 */
export const SECTION_DATA_MAP: Record<string, DataRequirements> = {
  matchScore: {
    sectionId: 'matchScore',
    requiredAttachments: ['jd', 'resume'],
    optionalAttachments: [],
    requiredFields: ['jobTitle', 'companyName'],
    contextDependencies: [],
    maxTokens: 8000,
    description: 'Overall job fit score with 50 signals'
  },
  
  skillMatch: {
    sectionId: 'skillMatch',
    requiredAttachments: ['jd', 'resume'],
    optionalAttachments: ['portfolio'],
    requiredFields: [],
    contextDependencies: ['matchScore'],
    maxTokens: 6000,
    description: 'Detailed skill gap analysis with keyword extraction'
  },
  
  companyIntel: {
    sectionId: 'companyIntel',
    requiredAttachments: ['jd'],
    optionalAttachments: [],
    requiredFields: ['companyName'],
    contextDependencies: [],
    maxTokens: 10000,
    description: 'Company background, culture, and competitive landscape'
  },
  
  companyEcosystem: {
    sectionId: 'companyEcosystem',
    requiredAttachments: ['jd'],
    optionalAttachments: [],
    requiredFields: ['companyName'],
    contextDependencies: ['companyIntel'],
    maxTokens: 5000,
    description: 'Competitor and adjacent company analysis'
  },
  
  peopleProfiles: {
    sectionId: 'peopleProfiles',
    requiredAttachments: ['jd'],
    optionalAttachments: [],
    requiredFields: [],
    contextDependencies: ['companyIntel'],
    maxTokens: 8000,
    description: 'Interviewer background and communication style analysis'
  },
  
  fitMatrix: {
    sectionId: 'fitMatrix',
    requiredAttachments: ['jd', 'resume'],
    optionalAttachments: [],
    requiredFields: [],
    contextDependencies: ['matchScore'],
    maxTokens: 10000,
    description: 'Detailed fit matrix with 50 signals (20 ATS + 30 dynamic)'
  }
};

/**
 * Check if a section can be analyzed given available data
 */
export function canAnalyzeSection(
  sectionId: string,
  availableData: {
    attachments: Record<string, boolean>;
    fields: Record<string, any>;
    previousAnalysis: string[];
  }
): {
  canAnalyze: boolean;
  missingData: string[];
  missingDependencies: string[];
  estimatedCost: { tokens: number; usd: number };
} {
  const requirements = SECTION_DATA_MAP[sectionId];
  
  if (!requirements) {
    return {
      canAnalyze: false,
      missingData: ['Unknown section'],
      missingDependencies: [],
      estimatedCost: { tokens: 0, usd: 0 }
    };
  }

  const missing: string[] = [];
  const missingDeps: string[] = [];

  // Check required attachments
  requirements.requiredAttachments.forEach(kind => {
    if (!availableData.attachments[kind]) {
      missing.push(`${kind} attachment`);
    }
  });

  // Check required fields
  requirements.requiredFields.forEach(field => {
    if (!availableData.fields[field] || availableData.fields[field] === '') {
      missing.push(field);
    }
  });

  // Check context dependencies
  requirements.contextDependencies.forEach(dep => {
    if (!availableData.previousAnalysis.includes(dep)) {
      missingDeps.push(dep);
    }
  });

  // Estimate cost (rough: $0.002 per 1K tokens for GPT-4o-mini)
  const estimatedTokens = requirements.maxTokens;
  const estimatedUsd = (estimatedTokens / 1000) * 0.002;

  return {
    canAnalyze: missing.length === 0 && missingDeps.length === 0,
    missingData: missing,
    missingDependencies: missingDeps,
    estimatedCost: { tokens: estimatedTokens, usd: estimatedUsd }
  };
}

/**
 * Gather all required data for a section
 */
export async function gatherSectionData(
  sectionId: string,
  jobId: string,
  options?: {
    includeOptional?: boolean;
    previousResults?: Record<string, any>;
  }
): Promise<{
  attachments: Record<string, string>;
  fields: Record<string, any>;
  previousAnalysis: Record<string, string>;
  metadata: {
    totalTokens: number;
    attachmentSizes: Record<string, number>;
  };
}> {
  const requirements = SECTION_DATA_MAP[sectionId];
  
  if (!requirements) {
    throw new Error(`Unknown section: ${sectionId}`);
  }

  const result = {
    attachments: {} as Record<string, string>,
    fields: {} as Record<string, any>,
    previousAnalysis: {} as Record<string, string>,
    metadata: {
      totalTokens: 0,
      attachmentSizes: {} as Record<string, number>
    }
  };

  // Fetch required attachments
  for (const kind of requirements.requiredAttachments) {
    const content = await fetchAttachmentContent(jobId, kind);
    if (content) {
      result.attachments[kind] = content;
      result.metadata.attachmentSizes[kind] = content.length;
      result.metadata.totalTokens += estimateTokens(content);
    }
  }

  // Optionally fetch optional attachments
  if (options?.includeOptional) {
    for (const kind of requirements.optionalAttachments) {
      const content = await fetchAttachmentContent(jobId, kind);
      if (content) {
        result.attachments[kind] = content;
        result.metadata.attachmentSizes[kind] = content.length;
        result.metadata.totalTokens += estimateTokens(content);
      }
    }
  }

  // Fetch previous analysis summaries
  if (options?.previousResults) {
    for (const depId of requirements.contextDependencies) {
      if (options.previousResults[depId]) {
        const summary = summarizeAnalysis(depId, options.previousResults[depId]);
        result.previousAnalysis[depId] = summary;
        result.metadata.totalTokens += estimateTokens(summary);
      }
    }
  }

  return result;
}

/**
 * Fetch attachment content by kind
 */
async function fetchAttachmentContent(
  jobId: string,
  kind: string
): Promise<string | null> {
  try {
    const res = await fetch(`/api/jobs/${jobId}/attachments`);
    if (!res.ok) return null;
    
    const data = await res.json();
    const attachment = data.attachments?.find((a: any) => a.kind === kind && !a.deletedAt && a.isActive);
    
    if (!attachment) return null;

    // Extract text content
    const extractRes = await fetch('/api/files/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: attachment.path })
    });

    if (!extractRes.ok) return null;

    const extractData = await extractRes.json();
    return extractData.text || null;
  } catch (error) {
    console.error(`Error fetching ${kind} attachment:`, error);
    return null;
  }
}

/**
 * Summarize analysis result for use in later analyses
 */
function summarizeAnalysis(sectionId: string, fullResult: any): string {
  // Template-based summarization (< 200 tokens)
  switch (sectionId) {
    case 'matchScore':
      return `Match Score: ${fullResult.overallScore || 'N/A'}. Top strengths: ${fullResult.highlights?.slice(0, 3).join(', ') || 'None'}. Key gaps: ${fullResult.gaps?.slice(0, 2).join(', ') || 'None'}.`;
    
    case 'companyIntel':
      return `Company: ${fullResult.name || 'Unknown'}. ${fullResult.description || 'No description'}. Culture: ${fullResult.culture?.values?.slice(0, 2).join(', ') || 'Unknown'}.`;
    
    default:
      return JSON.stringify(fullResult).substring(0, 500); // Fallback: truncate
  }
}

/**
 * Estimate token count (rough: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get list of all sections
 */
export function getAllSections(): string[] {
  return Object.keys(SECTION_DATA_MAP);
}

/**
 * Get section requirements
 */
export function getSectionRequirements(sectionId: string): DataRequirements | null {
  return SECTION_DATA_MAP[sectionId] || null;
}

