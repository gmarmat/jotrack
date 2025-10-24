/**
 * Interview Coach Discovery Prompts
 * 
 * Generates targeted follow-up prompts based on lowest scoring dimensions
 * and available signal gaps. No LLM calls - pure deterministic logic.
 */

import { DimensionType } from '../scoring/schema';
import { ScoringContext } from '../scoring/rules';
import { deriveSignalsCoverage } from '../scoring/confidence';

export interface PromptItem {
  id: string;
  text: string;
  targets: DimensionType[];
  sourceKeys: string[];
}

export interface ScoringData {
  subscores: Record<DimensionType, number>;
  flags: string[];
}

/**
 * Build follow-up prompts targeting the lowest scoring dimensions
 * Uses signal gaps to determine which prompts to suggest
 */
export function buildFollowUpPrompts(
  ctx: ScoringContext,
  scoring: ScoringData
): PromptItem[] {
  // Step 1: Find the 2 lowest dimensions (with tie-breaking priority)
  const dimensionPriority: DimensionType[] = [
    'risks', 'specificity', 'outcome', 'role', 'company', 'structure', 'persona'
  ];
  
  const sortedDimensions = Object.entries(scoring.subscores)
    .sort(([dimA, scoreA], [dimB, scoreB]) => {
      // Primary sort: by score (lowest first)
      if (scoreA !== scoreB) return scoreA - scoreB;
      
      // Secondary sort: by priority order
      const aIndex = dimensionPriority.indexOf(dimA as DimensionType);
      const bIndex = dimensionPriority.indexOf(dimB as DimensionType);
      return aIndex - bIndex;
    })
    .slice(0, 2)
    .map(([dim]) => dim as DimensionType);

  // Step 2: Read signal gaps
  const hasJD = !!ctx.jdCore?.length;
  const hasCompany = !!ctx.companyValues?.length;
  const hasInterviewer = !!ctx.userProfile?.interviewer;
  const hasProfile = !!ctx.userProfile;
  const hasCommunity = !!ctx.matchMatrix?.communityTopics || false;

  // Step 3: Generate prompts based on lowest dimensions and gaps
  const prompts: PromptItem[] = [];
  const usedDimensions = new Set<DimensionType>();

  for (const dimension of sortedDimensions) {
    if (usedDimensions.has(dimension)) continue;
    
    const prompt = generatePromptForDimension(
      dimension,
      hasJD,
      hasCompany,
      hasInterviewer,
      hasProfile,
      hasCommunity,
      scoring.subscores[dimension]
    );
    
    if (prompt) {
      prompts.push(prompt);
      usedDimensions.add(dimension);
    }
  }

  // Add one more prompt if we have space and gaps
  if (prompts.length < 3) {
    const additionalPrompt = generateAdditionalPrompt(
      hasJD,
      hasCompany,
      hasInterviewer,
      hasProfile,
      hasCommunity,
      usedDimensions
    );
    
    if (additionalPrompt) {
      prompts.push(additionalPrompt);
    }
  }

  return prompts.slice(0, 3); // Ensure max 3 prompts
}

/**
 * Generate a prompt for a specific dimension
 */
function generatePromptForDimension(
  dimension: DimensionType,
  hasJD: boolean,
  hasCompany: boolean,
  hasInterviewer: boolean,
  hasProfile: boolean,
  hasCommunity: boolean,
  score: number
): PromptItem | null {
  const sourceKeys: string[] = [`low_${dimension}`];
  
  // Add gap indicators
  if (!hasJD) sourceKeys.push('no_jd');
  if (!hasCompany) sourceKeys.push('no_company_values');
  if (!hasInterviewer) sourceKeys.push('no_interviewer');
  if (!hasProfile) sourceKeys.push('no_profile');
  if (!hasCommunity) sourceKeys.push('no_community');

  switch (dimension) {
    case 'specificity':
      return {
        id: 'p_specificity',
        text: 'Quantify impact (KPI/metric/time/cost/users).',
        targets: ['specificity', 'outcome'],
        sourceKeys: [...sourceKeys, 'no_metrics']
      };

    case 'outcome':
      return {
        id: 'p_outcome',
        text: 'State a before/after metric and your direct contribution.',
        targets: ['outcome', 'role'],
        sourceKeys: [...sourceKeys, 'no_before_after']
      };

    case 'role':
      return {
        id: 'p_role',
        text: 'Describe your decision and why (trade-off, constraint, stakeholder).',
        targets: ['role'],
        sourceKeys
      };

    case 'company':
      if (hasCompany) {
        return {
          id: 'p_company_values',
          text: 'Tie result to a company value (e.g., "Customer Obsession") and product impact.',
          targets: ['company'],
          sourceKeys: [...sourceKeys, 'values_present_no_link']
        };
      }
      return null;

    case 'structure':
      return {
        id: 'p_structure',
        text: 'Split into STAR: Situation, Task, Action, Result (1–2 sentences each).',
        targets: ['structure'],
        sourceKeys
      };

    case 'persona':
      const audience = hasInterviewer ? 'interviewer' : 'recruiter';
      return {
        id: 'p_persona',
        text: `Rephrase at the right depth for a ${audience} audience.`,
        targets: ['persona'],
        sourceKeys: [...sourceKeys, 'persona_mismatch']
      };

    case 'risks':
      return {
        id: 'p_risks',
        text: 'Replace buzzwords with concrete actions; add scope (team size, timeframe).',
        targets: ['risks', 'specificity'],
        sourceKeys: [...sourceKeys, 'buzzwords_detected']
      };

    default:
      return null;
  }
}

/**
 * Generate an additional prompt based on available gaps
 */
function generateAdditionalPrompt(
  hasJD: boolean,
  hasCompany: boolean,
  hasInterviewer: boolean,
  hasProfile: boolean,
  hasCommunity: boolean,
  usedDimensions: Set<DimensionType>
): PromptItem | null {
  // If we have company values but haven't addressed company dimension
  if (hasCompany && !usedDimensions.has('company')) {
    return {
      id: 'p_company_additional',
      text: 'Connect your example to company values and mission.',
      targets: ['company'],
      sourceKeys: ['values_present_no_link', 'no_company_connection']
    };
  }

  // If we have JD but haven't addressed role dimension
  if (hasJD && !usedDimensions.has('role')) {
    return {
      id: 'p_role_additional',
      text: 'Link your example to specific job requirements.',
      targets: ['role'],
      sourceKeys: ['jd_present_no_link', 'no_role_connection']
    };
  }

  // If we have community topics but haven't addressed persona
  if (hasCommunity && !usedDimensions.has('persona')) {
    return {
      id: 'p_community_additional',
      text: 'Reference industry trends or community insights in your answer.',
      targets: ['persona', 'company'],
      sourceKeys: ['community_present_no_link', 'no_industry_context']
    };
  }

  return null;
}
