/**
 * Tier 3 Signal Extraction
 * Calculates 5 derived signals from existing data (no AI calls!)
 * 
 * Signals:
 * 1. Career Trajectory (promotions, stability, prestige)
 * 2. Role Level (current → target, readiness)
 * 3. Scope Analysis (team, budget, users, gap)
 * 4. Domain Expertise (years per domain, breadth, depth)
 * 5. Competitive Context (advantages, differentiators)
 */

// ==========================================
// 1. CAREER TRAJECTORY ANALYSIS
// ==========================================

export interface JobEntry {
  company: string;
  title: string;
  tenureYears: number;
  level: number; // 1=IC, 2=Senior IC, 3=Manager, 4=Director, 5=VP+
  industry: string;
}

export interface CareerTrajectoryAnalysis {
  promotionFrequency: number;   // Years per promotion (lower = faster)
  scopeProgression: 'rapid' | 'steady' | 'flat' | 'declining';
  industryTenure: number;       // Years in current industry
  companyPrestigeTrend: 'ascending' | 'lateral' | 'descending';
  stabilityScore: number;       // 0-100, based on tenure patterns
  pivotRisk: 'none' | 'low' | 'medium' | 'high'; // Industry/role change risk
}

export function analyzeCareerTrajectory(resumeText: string): CareerTrajectoryAnalysis {
  // Extract job history (simplified - can be enhanced with AI)
  const jobs = extractJobHistory(resumeText);
  
  if (jobs.length === 0) {
    return {
      promotionFrequency: 999,
      scopeProgression: 'flat',
      industryTenure: 0,
      companyPrestigeTrend: 'lateral',
      stabilityScore: 50,
      pivotRisk: 'none'
    };
  }
  
  // Calculate promotion frequency
  const promotions = jobs.filter((j, i) => i > 0 && j.level > jobs[i - 1].level);
  const totalYears = jobs.reduce((sum, j) => sum + j.tenureYears, 0);
  const promotionFrequency = promotions.length > 0 ? totalYears / promotions.length : 999;
  
  // Analyze scope progression
  const scopeProgression = analyzeScopeProgression(jobs);
  
  // Industry tenure
  const currentIndustry = jobs[0]?.industry || 'Unknown';
  const industryTenure = jobs
    .filter(j => j.industry === currentIndustry)
    .reduce((sum, j) => sum + j.tenureYears, 0);
  
  // Company prestige trend (simplified)
  const companyPrestigeTrend = 'lateral'; // TODO: Implement prestige scoring
  
  // Stability score (average tenure)
  const avgTenure = totalYears / jobs.length;
  const stabilityScore = Math.min(100, Math.round((avgTenure / 3) * 100)); // 3+ years = 100
  
  // Pivot risk (simplified)
  const pivotRisk = 'low'; // TODO: Implement pivot detection
  
  return {
    promotionFrequency,
    scopeProgression,
    industryTenure,
    companyPrestigeTrend,
    stabilityScore,
    pivotRisk
  };
}

function extractJobHistory(resumeText: string): JobEntry[] {
  // Simplified extraction - looks for common patterns
  const jobs: JobEntry[] = [];
  
  // Look for year ranges (2020-2023, 2020-Present, etc.)
  const yearRangePattern = /(\d{4})\s*[-–]\s*(\d{4}|Present)/gi;
  const matches = resumeText.matchAll(yearRangePattern);
  
  for (const match of matches) {
    const startYear = parseInt(match[1]);
    const endYear = match[2] === 'Present' ? new Date().getFullYear() : parseInt(match[2]);
    const tenureYears = endYear - startYear;
    
    // Extract title (look backwards from year range)
    const textBefore = resumeText.substring(Math.max(0, match.index! - 200), match.index!);
    const titleMatch = textBefore.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\s*$/);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    
    // Detect level from title keywords
    const level = detectLevelFromTitle(title);
    
    jobs.push({
      company: 'Unknown', // TODO: Extract company name
      title,
      tenureYears,
      level,
      industry: 'Unknown' // TODO: Detect industry
    });
  }
  
  return jobs;
}

function analyzeScopeProgression(jobs: JobEntry[]): 'rapid' | 'steady' | 'flat' | 'declining' {
  if (jobs.length < 2) return 'flat';
  
  const levelChanges = jobs.slice(1).map((j, i) => j.level - jobs[i].level);
  const totalChange = levelChanges.reduce((a, b) => a + b, 0);
  
  if (totalChange >= 2) return 'rapid';
  if (totalChange === 1) return 'steady';
  if (totalChange < 0) return 'declining';
  return 'flat';
}

// ==========================================
// 2. ROLE LEVEL ANALYSIS
// ==========================================

export interface RoleLevelAnalysis {
  currentLevel: 1 | 2 | 3 | 4 | 5; // IC, Senior IC, Manager, Director, VP+
  targetLevel: 1 | 2 | 3 | 4 | 5;
  levelJump: number;                // -2 to +2
  readiness: 'underqualified' | 'ready' | 'stretch' | 'overqualified';
  prepStrategy: string;
}

export function analyzeRoleLevel(resumeText: string, jdText: string): RoleLevelAnalysis {
  const currentLevel = extractLevelFromText(resumeText);
  const targetLevel = extractLevelFromText(jdText);
  const levelJump = targetLevel - currentLevel;
  
  let readiness: 'underqualified' | 'ready' | 'stretch' | 'overqualified';
  let prepStrategy: string;
  
  if (levelJump === 0) {
    readiness = 'ready';
    prepStrategy = 'Focus on domain expertise and cultural fit. Emphasize similar scope examples.';
  } else if (levelJump === 1) {
    readiness = 'stretch';
    prepStrategy = 'Emphasize stretch projects where you operated at target level. Show readiness through scope and leadership examples.';
  } else if (levelJump >= 2) {
    readiness = 'underqualified';
    prepStrategy = 'CRITICAL: Demonstrate rapid growth trajectory. Find examples where you punched above weight class. Address gap proactively in interview.';
  } else {
    readiness = 'overqualified';
    prepStrategy = 'Frame as strategic move (quality of life, company mission, domain interest). Emphasize long-term commitment. Avoid "desperation" signals.';
  }
  
  return {
    currentLevel,
    targetLevel,
    levelJump,
    readiness,
    prepStrategy
  };
}

function extractLevelFromText(text: string): 1 | 2 | 3 | 4 | 5 {
  const lower = text.toLowerCase();
  
  // VP+ keywords
  if (lower.match(/\b(vp|vice president|c-level|ceo|cto|cfo|coo)\b/)) return 5;
  
  // Director keywords
  if (lower.match(/\b(director|head of|principal)\b/)) return 4;
  
  // Manager keywords
  if (lower.match(/\b(manager|lead|team lead|engineering manager)\b/)) return 3;
  
  // Senior IC keywords
  if (lower.match(/\b(senior|sr\.|staff|lead engineer|principal engineer)\b/)) return 2;
  
  // Default to IC
  return 1;
}

function detectLevelFromTitle(title: string): 1 | 2 | 3 | 4 | 5 {
  return extractLevelFromText(title);
}

// ==========================================
// 3. SCOPE ANALYSIS
// ==========================================

export interface ScopeMetrics {
  teamSize: number;
  budget: number; // In thousands
  usersImpacted: number;
  crossFunctionalTeams: number;
}

export interface ScopeAnalysis {
  currentScope: ScopeMetrics;
  targetScope: ScopeMetrics;
  scopeGap: number;         // -100 to +100 (negative = scope reduction)
  readiness: 'ready' | 'stretch' | 'significant-stretch';
  prepStrategy: string;
}

export function analyzeScopeMatch(resumeText: string, jdText: string): ScopeAnalysis {
  const currentScope = extractScopeFromText(resumeText);
  const targetScope = extractScopeFromText(jdText);
  
  // Calculate weighted scope gap
  const gap = (
    (targetScope.teamSize - currentScope.teamSize) * 0.3 +
    (targetScope.budget - currentScope.budget) / 1000 * 0.2 +
    (targetScope.usersImpacted - currentScope.usersImpacted) / 10000 * 0.3 +
    (targetScope.crossFunctionalTeams - currentScope.crossFunctionalTeams) * 0.2
  );
  
  let readiness: 'ready' | 'stretch' | 'significant-stretch';
  let prepStrategy: string;
  
  if (gap <= 20) {
    readiness = 'ready';
    prepStrategy = 'Emphasize similar scale experiences. Show consistency in handling scope.';
  } else if (gap <= 50) {
    readiness = 'stretch';
    prepStrategy = 'Find 1-2 examples where you operated at target scale. Emphasize growth mindset and learning agility.';
  } else {
    readiness = 'significant-stretch';
    prepStrategy = 'CRITICAL: Address scope gap head-on. Show rapid scaling examples. Demonstrate ability to learn quickly and handle ambiguity.';
  }
  
  return {
    currentScope,
    targetScope,
    scopeGap: gap,
    readiness,
    prepStrategy
  };
}

function extractScopeFromText(text: string): ScopeMetrics {
  const lower = text.toLowerCase();
  
  // Extract team size
  let teamSize = 0;
  const teamMatches = lower.match(/(\d+)\s*(?:person|people|engineer|member|team member)/i);
  if (teamMatches) teamSize = parseInt(teamMatches[1]);
  
  // Extract users
  let usersImpacted = 0;
  const userMatches = lower.match(/(\d+[,.]?\d*)[kKmM]?\s*(?:user|customer|client)/i);
  if (userMatches) {
    const num = parseFloat(userMatches[1].replace(',', ''));
    if (userMatches[0].includes('k') || userMatches[0].includes('K')) {
      usersImpacted = num * 1000;
    } else if (userMatches[0].includes('m') || userMatches[0].includes('M')) {
      usersImpacted = num * 1000000;
    } else {
      usersImpacted = num;
    }
  }
  
  // Extract cross-functional teams
  let crossFunctionalTeams = 0;
  const crossFuncMatches = lower.match(/(\d+)\s*(?:team|department|function)/i);
  if (crossFuncMatches) crossFunctionalTeams = parseInt(crossFuncMatches[1]);
  
  // Extract budget (simplified)
  let budget = 0;
  const budgetMatches = lower.match(/\$(\d+[,.]?\d*)[kKmM]?\s*(?:budget|spend)/i);
  if (budgetMatches) {
    const num = parseFloat(budgetMatches[1].replace(',', ''));
    if (budgetMatches[0].includes('m') || budgetMatches[0].includes('M')) {
      budget = num * 1000;
    } else {
      budget = num;
    }
  }
  
  return {
    teamSize,
    budget,
    usersImpacted,
    crossFunctionalTeams
  };
}

// ==========================================
// 4. DOMAIN EXPERTISE ASSESSMENT
// ==========================================

export interface DomainEntry {
  domain: string;           // "Product Strategy", "Operations", "Analytics"
  years: number;
  depth: 'beginner' | 'intermediate' | 'expert';
  evidence: string[];       // Specific mentions
}

export interface DomainExpertiseAnalysis {
  domains: DomainEntry[];
  primaryDomain: string;
  expertiseBreadth: number;   // # of domains at intermediate+
  expertiseDepth: number;     // # of domains at expert level
  jdAlignment: number;        // 0-100, how well expertise matches JD
}

export function assessDomainExpertise(resumeText: string, jdText: string): DomainExpertiseAnalysis {
  // Common domains for Product/Project/Business/Leadership roles
  const commonDomains = [
    'Product Strategy',
    'Product Management',
    'Project Management',
    'Data Analysis',
    'Business Strategy',
    'Operations',
    'Marketing',
    'Sales',
    'Customer Success',
    'Analytics',
    'Strategic Planning',
    'Process Improvement',
    'Stakeholder Management'
  ];
  
  const userDomains: DomainEntry[] = [];
  const lower = resumeText.toLowerCase();
  
  commonDomains.forEach(domain => {
    const domainLower = domain.toLowerCase();
    const mentions = (lower.match(new RegExp(domainLower, 'g')) || []).length;
    
    if (mentions > 0) {
      // Estimate years (very rough - counts year ranges in resume)
      const yearRanges = extractJobHistory(resumeText);
      const totalYears = yearRanges.reduce((sum, j) => sum + j.tenureYears, 0);
      const estimatedYears = Math.min(totalYears, mentions * 2); // Rough heuristic
      
      // Determine depth
      let depth: 'beginner' | 'intermediate' | 'expert' = 'beginner';
      if (estimatedYears >= 5) depth = 'expert';
      else if (estimatedYears >= 2) depth = 'intermediate';
      
      userDomains.push({
        domain,
        years: estimatedYears,
        depth,
        evidence: [`${mentions} mentions in resume`]
      });
    }
  });
  
  // Sort by years (most experienced first)
  userDomains.sort((a, b) => b.years - a.years);
  
  // Calculate JD alignment
  const jdLower = jdText.toLowerCase();
  const jdDomains = commonDomains.filter(d => jdLower.includes(d.toLowerCase()));
  const matchingDomains = userDomains.filter(ud => jdDomains.some(jd => jd === ud.domain));
  const jdAlignment = jdDomains.length > 0 
    ? Math.round((matchingDomains.length / jdDomains.length) * 100)
    : 50;
  
  return {
    domains: userDomains.slice(0, 5), // Top 5
    primaryDomain: userDomains[0]?.domain || 'Unknown',
    expertiseBreadth: userDomains.filter(d => d.depth !== 'beginner').length,
    expertiseDepth: userDomains.filter(d => d.depth === 'expert').length,
    jdAlignment
  };
}

// ==========================================
// 5. COMPETITIVE CONTEXT ANALYSIS
// ==========================================

export interface CompetitiveAdvantage {
  uniqueSkill: string;
  description: string;
  value: string; // How it helps
}

export interface CompetitiveContextAnalysis {
  typicalCandidates: {
    averageYearsExperience: number;
    commonSkills: string[];
    commonCompanies: string[];
  };
  userAdvantages: CompetitiveAdvantage[];
  differentiationStrategy: string;
}

export async function analyzeCompetitiveContext(
  jobTitle: string,
  userResume: string,
  skillsMatch: any[]
): Promise<CompetitiveContextAnalysis> {
  // Simplified version - uses skills match data
  // In full implementation, would search web for typical candidates
  
  const strongUncommonSkills = skillsMatch
    .filter((s: any) => s.matchStrength === 'strong' && s.yearsExperience >= 5);
  
  const userAdvantages: CompetitiveAdvantage[] = strongUncommonSkills.map((s: any) => ({
    uniqueSkill: s.skill,
    description: `${s.yearsExperience} years of ${s.skill} experience`,
    value: `Brings deep expertise that many ${jobTitle} candidates lack`
  }));
  
  return {
    typicalCandidates: {
      averageYearsExperience: 5, // Placeholder
      commonSkills: ['Communication', 'Stakeholder Management'],
      commonCompanies: ['Unknown']
    },
    userAdvantages: userAdvantages.slice(0, 3), // Top 3
    differentiationStrategy: userAdvantages.length > 0
      ? `Lead with ${userAdvantages[0].uniqueSkill} expertise to differentiate from typical candidates`
      : 'Focus on execution track record and cultural fit'
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate role complexity for adaptive story count
 */
export function calculateRoleComplexity(
  jdText: string,
  scopeAnalysis: ScopeAnalysis,
  domainExpertise: DomainExpertiseAnalysis,
  roleLevel: RoleLevelAnalysis
): number {
  const responsibilities = extractResponsibilities(jdText);
  
  const complexity = (
    responsibilities.length * 2 +
    domainExpertise.expertiseBreadth * 5 +
    roleLevel.targetLevel * 8 +
    (scopeAnalysis.targetScope.teamSize > 0 ? Math.log(scopeAnalysis.targetScope.teamSize + 1) * 3 : 0) +
    scopeAnalysis.targetScope.crossFunctionalTeams * 4
  );
  
  return Math.round(complexity);
}

function extractResponsibilities(jdText: string): string[] {
  const responsibilities: string[] = [];
  
  // Look for bullet points or numbered lists
  const bulletMatches = jdText.match(/[•\-*]\s*([^\n]+)/g);
  if (bulletMatches) {
    responsibilities.push(...bulletMatches.map(m => m.replace(/[•\-*]\s*/, '').trim()));
  }
  
  return responsibilities.slice(0, 15); // Cap at 15
}

/**
 * Determine optimal story count based on role complexity
 */
export function determineOptimalStoryCount(complexity: number): {
  count: number;
  coverage: number;
  reasoning: string;
} {
  if (complexity <= 20) {
    return {
      count: 2,
      coverage: 80,
      reasoning: 'Simple role (IC, single domain). 2 stories cover 80% of questions.'
    };
  }
  
  if (complexity <= 35) {
    return {
      count: 3,
      coverage: 85,
      reasoning: 'Standard role (Senior IC or Team Lead). 3 stories cover 85%.'
    };
  }
  
  if (complexity <= 55) {
    return {
      count: 4,
      coverage: 90,
      reasoning: 'Complex role (Manager, multi-domain). 4 stories needed for 90% coverage.'
    };
  }
  
  return {
    count: 5,
    coverage: 92,
    reasoning: 'Highly complex role (Director+, strategic). 5 stories for 92% coverage.'
  };
}

