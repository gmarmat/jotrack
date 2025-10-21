/**
 * Confidence Scoring System for Interview Coach
 * Assesses quality of each data signal to build user trust
 */

export interface SignalConfidence {
  signal: string;
  confidence: number; // 0-100
  reason: string;
  impact: 'high' | 'medium' | 'low';
  sources?: string; // "5 Glassdoor reports"
  breakdown?: {
    linkedin?: number;
    webValidation?: number;
    recency?: number;
  };
}

export interface OverallConfidence {
  score: number; // 0-100
  category: 'low' | 'medium' | 'high';
  signals: SignalConfidence[];
  recommendation?: string;
}

/**
 * Calculate confidence for each signal
 */
export function calculateSignalConfidence(signals: {
  peopleProfiles?: any;
  matchScore?: any;
  companyIntelligence?: any;
  skillsMatch?: any[];
  webIntelligence?: any;
}): SignalConfidence[] {
  const scores: SignalConfidence[] = [];
  
  // People Profiles Confidence
  if (signals.peopleProfiles?.profiles) {
    signals.peopleProfiles.profiles.forEach((profile: any) => {
      const hasLinkedInEvidence = profile.evidence?.quotes?.length >= 3;
      const hasWebValidation = profile.webValidation?.mentions >= 1;
      const webMentions = profile.webValidation?.mentions || 0;
      
      let confidence = 40; // Base (LinkedIn only)
      let breakdown = { linkedin: 40, webValidation: 0, recency: 0 };
      
      // LinkedIn evidence boost
      if (hasLinkedInEvidence) {
        confidence += 30;
        breakdown.linkedin = 70;
      }
      
      // Web validation boost
      if (hasWebValidation) {
        const webBoost = Math.min(30, webMentions * 5);
        confidence += webBoost;
        breakdown.webValidation = webBoost;
      }
      
      // Cap at 95 (never 100%)
      confidence = Math.min(95, confidence);
      
      scores.push({
        signal: `${profile.name} (${profile.role})`,
        confidence,
        reason: hasWebValidation 
          ? `LinkedIn analysis + ${webMentions} candidate ${webMentions === 1 ? 'report' : 'reports'}`
          : 'LinkedIn analysis only (no web validation)',
        impact: 'high',
        sources: hasWebValidation ? `${webMentions} reports (Glassdoor, Reddit)` : undefined,
        breakdown
      });
    });
  }
  
  // Match Score Confidence
  if (signals.matchScore) {
    const hasSkillBreakdown = signals.skillsMatch && signals.skillsMatch.length >= 5;
    const hasJdAndResume = signals.matchScore.matchScore > 0;
    
    let confidence = 50; // Base
    if (hasJdAndResume) confidence += 20; // Has actual analysis
    if (hasSkillBreakdown) confidence += 25; // Detailed breakdown
    
    scores.push({
      signal: 'Match Score & Skills',
      confidence,
      reason: hasSkillBreakdown 
        ? `Detailed skill-by-skill analysis (${signals.skillsMatch.length} skills)`
        : 'High-level score only',
      impact: 'high'
    });
  }
  
  // Company Intelligence Confidence
  if (signals.companyIntelligence) {
    const analyzedAt = signals.companyIntelligence.analyzedAt || 0;
    const age = (Date.now() / 1000) - analyzedAt;
    const days = Math.floor(age / (24 * 3600));
    const isRecent = days < 7;
    const isStale = days > 30;
    
    let confidence = 60; // Base
    if (isRecent) confidence += 30; // Very fresh
    else if (isStale) confidence -= 20; // Old data
    
    scores.push({
      signal: 'Company Intelligence',
      confidence,
      reason: isRecent 
        ? `Recent analysis (${days} ${days === 1 ? 'day' : 'days'} ago)`
        : isStale
          ? `Stale analysis (${days} days ago) - may be outdated`
          : `Moderate age (${days} days ago)`,
      impact: 'medium'
    });
  }
  
  // Web Search Intelligence Confidence
  if (signals.webIntelligence) {
    const questionCount = signals.webIntelligence.questions?.length || 0;
    const hasInterviewerInsights = signals.webIntelligence.interviewerValidations && 
      Object.keys(signals.webIntelligence.interviewerValidations).length > 0;
    const hasSuccessPatterns = signals.webIntelligence.successPatterns?.length > 0;
    
    let confidence = 50; // Base
    if (questionCount >= 20) confidence += 20; // Rich question bank
    if (hasInterviewerInsights) confidence += 15; // Interviewer validation
    if (hasSuccessPatterns) confidence += 15; // Success patterns found
    
    scores.push({
      signal: 'Web Search Intelligence',
      confidence,
      reason: `${questionCount} questions found` + 
        (hasInterviewerInsights ? ', interviewer insights validated' : '') +
        (hasSuccessPatterns ? ', success patterns identified' : ''),
      impact: 'high',
      sources: hasInterviewerInsights 
        ? `Glassdoor, Reddit, Blind` 
        : undefined
    });
  }
  
  return scores;
}

/**
 * Calculate overall confidence (weighted average)
 */
export function calculateOverallConfidence(scores: SignalConfidence[]): OverallConfidence {
  if (scores.length === 0) {
    return {
      score: 0,
      category: 'low',
      signals: [],
      recommendation: 'No signals available. Complete job analysis first.'
    };
  }
  
  // Weight by impact
  const weighted = scores.map(s => {
    const weight = s.impact === 'high' ? 3 : s.impact === 'medium' ? 2 : 1;
    return s.confidence * weight;
  });
  
  const sum = weighted.reduce((a, b) => a + b, 0);
  const totalWeight = scores.reduce((a, s) => 
    a + (s.impact === 'high' ? 3 : s.impact === 'medium' ? 2 : 1), 
    0
  );
  
  const overall = Math.round(sum / totalWeight);
  
  let category: 'low' | 'medium' | 'high';
  let recommendation: string | undefined;
  
  if (overall >= 80) {
    category = 'high';
    recommendation = 'Excellent signal quality! Interview prep is well-informed.';
  } else if (overall >= 60) {
    category = 'medium';
    recommendation = 'Good signal quality. Consider adding more People Profiles for better insights.';
  } else {
    category = 'low';
    recommendation = 'Low confidence. Add People Profiles and run company analysis for better prep.';
  }
  
  return {
    score: overall,
    category,
    signals: scores,
    recommendation
  };
}

/**
 * Merge LinkedIn evidence with web validation
 */
export function mergePeopleProfileSources(
  linkedInProfile: any,
  webValidation: any
): any {
  if (!webValidation) {
    return {
      ...linkedInProfile,
      confidence: 70, // LinkedIn only
      sources: {
        linkedin: linkedInProfile.evidence || {},
        web: null
      }
    };
  }
  
  // Calculate merged confidence
  const linkedInConfidence = linkedInProfile.evidence?.quotes?.length >= 3 ? 70 : 40;
  const webConfidence = Math.min(30, webValidation.mentions * 5);
  const totalConfidence = Math.min(95, linkedInConfidence + webConfidence);
  
  return {
    ...linkedInProfile,
    confidence: totalConfidence,
    sources: {
      linkedin: linkedInProfile.evidence || {},
      web: {
        mentions: webValidation.mentions,
        sources: webValidation.sources || [],
        confirmedInsights: webValidation.confirmedInsights || [],
        newWarnings: webValidation.newWarnings || [],
        successPatterns: webValidation.successPatterns || [],
        failurePatterns: webValidation.failurePatterns || []
      }
    },
    enhancedWarnings: [
      ...(linkedInProfile.redFlags || []),
      ...(webValidation.newWarnings || [])
    ]
  };
}

