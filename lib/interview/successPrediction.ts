/**
 * Interview Success Prediction Model
 * Estimates probability of interview success based on all 15 signals
 * Provides actionable recommendations to improve odds
 */

import type { CareerTrajectoryAnalysis, RoleLevelAnalysis, ScopeAnalysis, DomainExpertiseAnalysis } from './signalExtraction';
import type { WeaknessFraming } from './redFlagFraming';

export interface SuccessPrediction {
  overallProbability: number;          // 0-100
  confidenceInterval: [number, number]; // [low, high]
  category: 'low' | 'medium' | 'high' | 'very-high';
  breakdown: {
    matchScore: number;
    answerQuality: number;
    interviewerAlignment: number;
    redFlags: number;
    competitiveAdvantages: number;
    domainAlignment: number;
  };
  recommendations: string[];
  strengths: string[];
  risks: string[];
}

/**
 * Predict interview success probability
 */
export function predictInterviewSuccess(params: {
  matchScore: number;
  answerScores: number[];
  interviewerProfile?: any;
  redFlags: WeaknessFraming[];
  competitiveAdvantages: any[];
  domainExpertise?: DomainExpertiseAnalysis;
  roleLevel?: RoleLevelAnalysis;
  scopeAnalysis?: ScopeAnalysis;
  careerTrajectory?: CareerTrajectoryAnalysis;
}): SuccessPrediction {
  const {
    matchScore = 0,
    answerScores = [],
    interviewerProfile = null,
    redFlags = [],
    competitiveAdvantages = [],
    domainExpertise = null,
    roleLevel = null,
    scopeAnalysis = null,
    careerTrajectory = null
  } = params;
  
  let baseProb = 50; // Start at 50%
  const breakdown = {
    matchScore: 0,
    answerQuality: 0,
    interviewerAlignment: 0,
    redFlags: 0,
    competitiveAdvantages: 0,
    domainAlignment: 0
  };
  
  // ==========================================
  // 1. MATCH SCORE ADJUSTMENT (Up to ±15 points)
  // ==========================================
  if (matchScore >= 80) {
    breakdown.matchScore = 15;
  } else if (matchScore >= 70) {
    breakdown.matchScore = 10;
  } else if (matchScore >= 60) {
    breakdown.matchScore = 5;
  } else if (matchScore < 50) {
    breakdown.matchScore = -10;
  }
  
  baseProb += breakdown.matchScore;
  
  // ==========================================
  // 2. ANSWER QUALITY (Up to +20 points)
  // ==========================================
  if (answerScores.length > 0) {
    const avgScore = answerScores.reduce((a, b) => a + b, 0) / answerScores.length;
    
    if (avgScore >= 85) {
      breakdown.answerQuality = 20;
    } else if (avgScore >= 75) {
      breakdown.answerQuality = 15;
    } else if (avgScore >= 60) {
      breakdown.answerQuality = 8;
    } else if (avgScore < 50) {
      breakdown.answerQuality = -5;
    }
    
    baseProb += breakdown.answerQuality;
  }
  
  // ==========================================
  // 3. INTERVIEWER ALIGNMENT (Up to +15 points)
  // ==========================================
  if (interviewerProfile) {
    const confidence = interviewerProfile.confidence || 0;
    
    if (confidence >= 90) {
      breakdown.interviewerAlignment = 15;
    } else if (confidence >= 75) {
      breakdown.interviewerAlignment = 10;
    } else if (confidence >= 60) {
      breakdown.interviewerAlignment = 5;
    }
    
    baseProb += breakdown.interviewerAlignment;
  }
  
  // ==========================================
  // 4. RED FLAGS (Up to -30 points)
  // ==========================================
  const highRiskFlags = redFlags.filter(r => r.risk === 'high').length;
  const mediumRiskFlags = redFlags.filter(r => r.risk === 'medium').length;
  
  breakdown.redFlags = -(highRiskFlags * 12 + mediumRiskFlags * 6);
  baseProb += breakdown.redFlags;
  
  // ==========================================
  // 5. COMPETITIVE ADVANTAGES (Up to +15 points)
  // ==========================================
  breakdown.competitiveAdvantages = Math.min(15, competitiveAdvantages.length * 5);
  baseProb += breakdown.competitiveAdvantages;
  
  // ==========================================
  // 6. DOMAIN ALIGNMENT (Up to +10 points)
  // ==========================================
  if (domainExpertise) {
    if (domainExpertise.jdAlignment >= 80) {
      breakdown.domainAlignment = 10;
    } else if (domainExpertise.jdAlignment >= 60) {
      breakdown.domainAlignment = 5;
    } else if (domainExpertise.jdAlignment < 40) {
      breakdown.domainAlignment = -5;
    }
    
    baseProb += breakdown.domainAlignment;
  }
  
  // ==========================================
  // 7. ROLE READINESS (Implicit in other factors)
  // ==========================================
  if (roleLevel?.readiness === 'underqualified') {
    baseProb -= 10; // Significant penalty
  } else if (roleLevel?.readiness === 'overqualified') {
    baseProb -= 5; // Flight risk
  }
  
  // ==========================================
  // 8. SCOPE READINESS (Implicit)
  // ==========================================
  if (scopeAnalysis?.readiness === 'significant-stretch') {
    baseProb -= 8;
  } else if (scopeAnalysis?.readiness === 'stretch') {
    baseProb -= 3;
  }
  
  // Cap probability
  const finalProb = Math.max(10, Math.min(95, baseProb));
  
  // Calculate confidence interval (±10 points)
  const confidenceInterval: [number, number] = [
    Math.max(0, finalProb - 10),
    Math.min(100, finalProb + 10)
  ];
  
  // Determine category
  let category: 'low' | 'medium' | 'high' | 'very-high';
  if (finalProb >= 75) category = 'very-high';
  else if (finalProb >= 60) category = 'high';
  else if (finalProb >= 40) category = 'medium';
  else category = 'low';
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    matchScore,
    answerScores,
    redFlags,
    competitiveAdvantages,
    domainExpertise,
    roleLevel,
    scopeAnalysis,
    careerTrajectory,
    breakdown
  });
  
  // Identify strengths
  const strengths: string[] = [];
  if (breakdown.matchScore >= 10) strengths.push(`Strong profile match (${matchScore}/100)`);
  if (breakdown.answerQuality >= 15) strengths.push('Excellent answer quality (avg 80+)');
  if (breakdown.interviewerAlignment >= 10) strengths.push('High interviewer alignment (validated)');
  if (breakdown.competitiveAdvantages >= 10) strengths.push(`${competitiveAdvantages.length} unique competitive advantages`);
  
  // Identify risks
  const risks: string[] = [];
  if (breakdown.matchScore < 0) risks.push('Low profile match (< 50/100)');
  if (breakdown.answerQuality < 0) risks.push('Answer quality needs improvement');
  if (breakdown.redFlags < -10) risks.push(`${Math.abs(breakdown.redFlags / 10)} high-risk red flags to address`);
  if (roleLevel?.readiness === 'underqualified') risks.push('Significant level jump (2+ levels)');
  if (scopeAnalysis?.readiness === 'significant-stretch') risks.push('Major scope gap vs target role');
  
  return {
    overallProbability: finalProb,
    confidenceInterval,
    category,
    breakdown,
    recommendations,
    strengths,
    risks
  };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(params: any): string[] {
  const {
    matchScore,
    answerScores,
    redFlags,
    competitiveAdvantages,
    domainExpertise,
    roleLevel,
    scopeAnalysis,
    careerTrajectory,
    breakdown
  } = params;
  
  const recommendations: string[] = [];
  
  // Priority 1: Address high-risk red flags
  const highRiskFlags = redFlags.filter((r: any) => r.risk === 'high');
  if (highRiskFlags.length > 0) {
    highRiskFlags.slice(0, 2).forEach((flag: any) => {
      recommendations.push(`❗ ${flag.weakness}: ${flag.doSay[0]}`);
    });
  }
  
  // Priority 2: Leverage competitive advantages
  if (competitiveAdvantages.length > 0 && breakdown.competitiveAdvantages >= 10) {
    recommendations.push(`💪 Lead with ${competitiveAdvantages[0].uniqueSkill} expertise (your #1 differentiator)`);
  }
  
  // Priority 3: Improve answer quality
  const avgScore = answerScores.length > 0 
    ? answerScores.reduce((a: number, b: number) => a + b, 0) / answerScores.length 
    : 0;
  if (avgScore < 75 && answerScores.length > 0) {
    recommendations.push(`📝 Practice more - target 75+ score on all answers (currently ${Math.round(avgScore)})`);
  }
  
  // Priority 4: Domain expertise
  if (domainExpertise && domainExpertise.jdAlignment < 60) {
    recommendations.push(`📚 Study JD requirements for ${domainExpertise.primaryDomain} - alignment is ${domainExpertise.jdAlignment}%`);
  }
  
  // Priority 5: Scope/level readiness
  if (roleLevel?.readiness === 'stretch' || roleLevel?.readiness === 'underqualified') {
    recommendations.push(`🎯 ${roleLevel.prepStrategy}`);
  }
  
  // Priority 6: Career trajectory
  if (careerTrajectory && careerTrajectory.stabilityScore < 50) {
    recommendations.push(`⏱️ Address short tenure proactively: Frame as strategic learning, emphasize 3-5 year commitment`);
  }
  
  // If no major issues, give polish recommendations
  if (recommendations.length === 0) {
    recommendations.push('✅ Strong baseline! Focus on: (1) Memorable stats, (2) Natural delivery, (3) Company-specific prep');
  }
  
  return recommendations.slice(0, 5); // Top 5 most impactful
}

