/**
 * Red Flag Framing System
 * "Don't say X, say Y instead" guidance for addressing weaknesses
 * Turns potential negatives into strategic positives
 */

import type { CareerTrajectoryAnalysis } from './signalExtraction';

export interface WeaknessFraming {
  weakness: string;
  risk: 'high' | 'medium' | 'low';
  detection: string;         // How interviewer will notice
  dontSay: string[];         // Phrases to avoid
  doSay: string[];           // Better alternatives
  example: string;           // Full STAR-style reframe
  rationale: string;         // Why this framing works
}

/**
 * Generate weakness framings from all available signals
 */
export function generateWeaknessFramings(
  resumeText: string,
  matchScoreData: any,
  careerTrajectory: CareerTrajectoryAnalysis,
  webWarnings: string[]
): WeaknessFraming[] {
  const framings: WeaknessFraming[] = [];
  
  // ==========================================
  // 1. JOB HOPPING / SHORT TENURE
  // ==========================================
  if (careerTrajectory.stabilityScore < 50) {
    framings.push({
      weakness: 'Short tenure at previous roles (avg < 2 years)',
      risk: 'high',
      detection: 'Visible on resume, interviewer will notice and probe',
      dontSay: [
        "Company wasn't a good fit",
        "Didn't like my manager",
        "Role wasn't what I expected",
        "Team wasn't great",
        "Company culture was toxic"
      ],
      doSay: [
        "Each move was strategic for targeted skill development",
        "Completed specific learning goals at each company",
        "Ready for long-term commitment now (3-5 years)",
        "Joining [Company] represents a strategic career anchor"
      ],
      example: `"My tenure at [Company X] (18 months) was intentional. I joined specifically to learn product-led growth in a B2B SaaS context, which they pioneered. Once I shipped [Product Launch] and achieved my learning goals, I was ready to apply that expertise in a larger-scale role. Now I'm seeking a 3-5 year commitment where I can drive long-term impact at Fortive."`,
      rationale: 'Reframes "job hopper" → "strategic learner" by showing intentionality and completion. Addressing 3-5 year commitment preempts follow-up.'
    });
  }
  
  // ==========================================
  // 2. SKILLS GAP (Critical Skills Missing)
  // ==========================================
  if (matchScoreData?.skillsMatch && Array.isArray(matchScoreData.skillsMatch)) {
    const weakCriticalSkills = matchScoreData.skillsMatch.filter(
      (s: any) => s.matchStrength === 'weak' && s.importance === 'critical'
    );
    
    weakCriticalSkills.forEach((skill: any) => {
      // Find adjacent/related skills user DOES have
      const adjacentSkill = findAdjacentSkill(skill.skill, matchScoreData.skillsMatch);
      
      framings.push({
        weakness: `Limited experience with ${skill.skill} (critical requirement)`,
        risk: 'medium',
        detection: 'Resume lacks keywords, interviewer may probe depth',
        dontSay: [
          `I haven't used ${skill.skill}`,
          "I'm still learning it",
          "We didn't have that at my company",
          "I don't have hands-on experience"
        ],
        doSay: [
          `I've worked extensively with ${adjacentSkill || 'similar approaches'} which shares core principles`,
          `I'm actively learning through ${getLearningResource(skill.skill)}`,
          `My experience with ${adjacentSkill || 'related methodologies'} provides a strong foundation`,
          `I've applied the same problem-solving approach in ${adjacentSkill || 'adjacent domains'}`
        ],
        example: `"While I haven't used ${skill.skill} in production, I've worked extensively with ${adjacentSkill} which shares core principles of [shared concept]. I'm currently completing [specific course/certification] to deepen my expertise, and my track record shows I can ramp quickly - I learned [other skill] in 3 months and shipped [result]."`,
        rationale: `Acknowledges gap honestly while demonstrating: (1) Adjacent experience, (2) Active learning, (3) Transfer ability, (4) Quick ramp track record.`
      });
    });
  }
  
  // ==========================================
  // 3. LEVEL JUMP (Underqualified)
  // ==========================================
  const levelJump = detectLevelJump(resumeText, ''); // TODO: Pass JD text
  if (levelJump >= 2) {
    framings.push({
      weakness: 'Significant level jump (2+ levels above current)',
      risk: 'high',
      detection: 'Interviewer will assess if candidate can handle increased scope',
      dontSay: [
        "I'm ready for the next level",
        "I can handle it",
        "I learn fast",
        "I'm a quick study"
      ],
      doSay: [
        "I've operated at target level in [specific projects]",
        "Led initiatives with [scope metrics matching target]",
        "Mentored by [senior leader] who prepared me for this",
        "Demonstrated readiness through [specific stretch example]"
      ],
      example: `"While my title is Senior PM, I've consistently operated at Director scope. For example, I led our enterprise expansion strategy (3 cross-functional teams, $2M budget, 20K+ users) which is Director-level scope at most companies. I'm ready to formalize that responsibility and scale impact further at Fortive."`,
      rationale: 'Shows EVIDENCE of operating at target level, not just confidence. Specific scope metrics prove readiness.'
    });
  }
  
  // ==========================================
  // 4. VAGUE QUANTIFICATION (From Web Warnings)
  // ==========================================
  const hasMetricsWarning = webWarnings.some(w => 
    w.toLowerCase().includes('metrics') || 
    w.toLowerCase().includes('exact') ||
    w.toLowerCase().includes('vague')
  );
  
  if (hasMetricsWarning) {
    framings.push({
      weakness: 'Vague quantification or missing metrics',
      risk: 'high',
      detection: 'From candidate reports: This interviewer requires exact metrics',
      dontSay: [
        "Significantly improved",
        "A lot of users",
        "About 10K",
        "Roughly doubled",
        "Substantially increased",
        "Many teams"
      ],
      doSay: [
        "746% improvement (from 147 to 1,243 users)",
        "10,247 active users",
        "Exactly $1.2M ARR",
        "2.13x increase (from $580K to $1.24M)",
        "Increased by 37.2% (from 94 to 129)",
        "Led 3 teams (18 people total)"
      ],
      example: `Instead of: "We significantly improved user adoption"
Say: "We increased adoption from 147 users (baseline in Q1) to 1,243 users by Q4 - a 746% improvement in 9 months, which translated to $420K additional ARR."`,
      rationale: 'Exact numbers build credibility. Vague terms ("about", "roughly", "significantly") signal lack of ownership or BS. This interviewer specifically values precision.'
    });
  }
  
  // ==========================================
  // 5. INDUSTRY PIVOT
  // ==========================================
  if (careerTrajectory.pivotRisk === 'high' || careerTrajectory.pivotRisk === 'medium') {
    framings.push({
      weakness: 'Industry pivot (limited experience in target industry)',
      risk: 'medium',
      detection: 'Resume shows different industry background',
      dontSay: [
        "I want to try something new",
        "This industry seems interesting",
        "Looking for a change",
        "Want to pivot my career"
      ],
      doSay: [
        "My [current industry] experience directly transfers because [specific overlap]",
        "The skills that drove success in [old industry] are exactly what [new industry] needs",
        "I've been preparing for this transition through [specific actions]",
        "This isn't a pivot - it's a strategic application of proven expertise"
      ],
      example: `"While I come from FinTech, the core challenge is identical to B2B SaaS: driving product-led growth in enterprise. My experience scaling [Product] from $500K to $5M ARR transfers directly - it's the same playbook of user onboarding, activation metrics, and expansion revenue. I've been preparing by [industry-specific learning] and am ready to apply proven expertise in this context."`,
      rationale: 'Reframes "pivot" → "strategic application". Shows transferable skills, preparation, and confidence in overlap.'
    });
  }
  
  // ==========================================
  // 6. OVERQUALIFIED
  // ==========================================
  if (levelJump < 0) {
    framings.push({
      weakness: 'Appears overqualified (level downgrade)',
      risk: 'high',
      detection: 'Interviewer will worry about flight risk or desperation',
      dontSay: [
        "I need a job",
        "Looking for work-life balance",
        "Burnt out at current level",
        "Want less responsibility",
        "Just need something stable"
      ],
      doSay: [
        "Strategic move to focus on [specific skill/domain]",
        "Quality of company/mission matters more than title",
        "Joining for long-term growth in [specific area]",
        "Returning to hands-on work I'm passionate about"
      ],
      example: `"This is a strategic move. After 5 years at Director level focusing on strategy, I realized my passion is hands-on product execution. I'm intentionally seeking a Senior PM role where I can own product outcomes directly. Fortive's mission in [area] aligns perfectly, and I'm committed to 5+ years of deep impact here."`,
      rationale: 'Shows intentionality and long-term commitment. Reframes as passion-driven, not desperation.'
    });
  }
  
  // ==========================================
  // 7. NO FORMAL LEADERSHIP (For Manager+ Roles)
  // ==========================================
  const hasLeadershipGap = levelJump >= 1 && !resumeText.toLowerCase().includes('manage');
  if (hasLeadershipGap) {
    framings.push({
      weakness: 'No formal people management experience (required for role)',
      risk: 'medium',
      detection: 'Resume shows no direct reports, title is IC',
      dontSay: [
        "I've never managed people",
        "This would be my first management role",
        "I'm ready to try management",
        "I think I'd be good at it"
      ],
      doSay: [
        "I've led cross-functional initiatives with [team size] contributors",
        "Mentored [number] engineers/PMs who were promoted under my guidance",
        "Operated as tech lead with influence over [scope]",
        "Demonstrated leadership through [specific example with team impact]"
      ],
      example: `"While I haven't had direct reports, I've led teams in practice. For our microservices migration, I led 6 engineers (no formal authority) through architecture decisions, code reviews, and delivery. I mentored 2 junior engineers who both got promoted within a year. I'm ready to formalize that leadership with direct reports and grow as a people manager."`,
      rationale: 'Shows leadership *capability* through influence without authority. Mentorship track record proves people development skills.'
    });
  }
  
  return framings;
}

/**
 * Find adjacent/related skill user DOES have
 */
function findAdjacentSkill(targetSkill: string, allSkills: any[]): string | null {
  // Simple mapping - can be enhanced with AI or graph
  const adjacencies: Record<string, string[]> = {
    'Tableau': ['Data Visualization', 'SQL', 'Analytics'],
    'Figma': ['Design', 'Prototyping', 'UI/UX'],
    'Jira': ['Project Management', 'Agile', 'Sprint Planning'],
    'Salesforce': ['CRM', 'Sales Operations', 'Pipeline Management'],
    'AWS': ['Cloud Infrastructure', 'DevOps', 'System Architecture'],
    'Python': ['Programming', 'Data Analysis', 'Automation'],
    'React': ['JavaScript', 'Frontend Development', 'UI Development']
  };
  
  const adjacentSkills = adjacencies[targetSkill] || [];
  
  // Find which adjacent skill user has
  const userHas = allSkills.find((s: any) => 
    adjacentSkills.includes(s.skill) && s.matchStrength !== 'weak'
  );
  
  return userHas?.skill || null;
}

/**
 * Get learning resource for skill
 */
function getLearningResource(skill: string): string {
  const resources: Record<string, string> = {
    'Tableau': 'Tableau Desktop Specialist certification',
    'Figma': 'Design Systems course on Coursera',
    'Jira': 'Atlassian Agile PM certification',
    'Salesforce': 'Salesforce Admin certification',
    'AWS': 'AWS Solutions Architect course',
    'Python': 'Python for Data Analysis (Udemy)',
    'SQL': 'Advanced SQL bootcamp'
  };
  
  return resources[skill] || `industry-recognized ${skill} certification`;
}

/**
 * Detect level jump (simplified)
 */
function detectLevelJump(resumeText: string, jdText: string): number {
  const currentLevel = extractLevel(resumeText);
  const targetLevel = jdText ? extractLevel(jdText) : currentLevel;
  return targetLevel - currentLevel;
}

function extractLevel(text: string): number {
  const lower = text.toLowerCase();
  if (lower.includes('vp') || lower.includes('vice president')) return 5;
  if (lower.includes('director') || lower.includes('head of')) return 4;
  if (lower.includes('manager') || lower.includes('team lead')) return 3;
  if (lower.includes('senior') || lower.includes('staff')) return 2;
  return 1;
}

/**
 * Generate framing guidance for specific weakness
 */
export function getFramingGuidance(
  weakness: string,
  framings: WeaknessFraming[]
): WeaknessFraming | null {
  return framings.find(f => 
    f.weakness.toLowerCase().includes(weakness.toLowerCase())
  ) || null;
}

/**
 * Inject framings into answer scoring feedback
 */
export function enhanceFeedbackWithFraming(
  feedback: string[],
  framings: WeaknessFraming[]
): string[] {
  const enhanced = [...feedback];
  
  // Add framing guidance if feedback mentions weakness
  framings.forEach(framing => {
    const isRelevant = feedback.some(f => 
      f.toLowerCase().includes(framing.weakness.toLowerCase()) ||
      framing.dontSay.some(dont => f.toLowerCase().includes(dont.toLowerCase()))
    );
    
    if (isRelevant) {
      enhanced.push(
        `⚠️ FRAMING TIP: ${framing.weakness}`,
        `DON'T SAY: "${framing.dontSay[0]}"`,
        `DO SAY: "${framing.doSay[0]}"`,
        `EXAMPLE: ${framing.example.substring(0, 200)}...`
      );
    }
  });
  
  return enhanced;
}

