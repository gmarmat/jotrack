/**
 * Skill Assessment Engine
 * Dual scoring system: self-reported vs AI-computed
 */

export interface SkillEvidence {
  projectCount: number;
  yearsExperience: number;
  contextMentions: number;
  certifications: string[];
}

export interface SkillAssessment {
  skill: string;
  selfReported: number | null; // User's self-assessment (1-5 scale)
  computed: number; // Our computed score (0-100)
  confidence: number; // Confidence in computed score (0-100)
  evidence: SkillEvidence;
}

/**
 * Parse resume for self-reported skill levels
 * Looks for patterns like "Expert in X", "Proficient in Y", "Advanced", etc.
 */
function extractSelfReportedLevels(resumeText: string): Map<string, number> {
  const skillLevels = new Map<string, number>();
  const text = resumeText.toLowerCase();

  // Patterns for skill level indicators
  const patterns = [
    { regex: /expert (in|with|at) ([\w\s]+)/gi, level: 5 },
    { regex: /advanced (in|with|at) ([\w\s]+)/gi, level: 4 },
    { regex: /proficient (in|with|at) ([\w\s]+)/gi, level: 4 },
    { regex: /skilled (in|with|at) ([\w\s]+)/gi, level: 3 },
    { regex: /intermediate (in|with|at) ([\w\s]+)/gi, level: 3 },
    { regex: /familiar (with|in) ([\w\s]+)/gi, level: 2 },
    { regex: /beginner (in|with|at) ([\w\s]+)/gi, level: 1 },
  ];

  patterns.forEach(({ regex, level }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const skill = match[2].trim();
      if (skill.length > 2 && skill.length < 30) {
        skillLevels.set(skill, level);
      }
    }
  });

  return skillLevels;
}

/**
 * Compute skill score from evidence
 */
function computeSkillScore(evidence: SkillEvidence): { score: number; confidence: number } {
  let score = 0;
  let confidenceFactors = 0;

  // Project count (0-40 points)
  const projectScore = Math.min(evidence.projectCount * 10, 40);
  score += projectScore;
  if (evidence.projectCount > 0) confidenceFactors++;

  // Years experience (0-30 points)
  const yearsScore = Math.min(evidence.yearsExperience * 10, 30);
  score += yearsScore;
  if (evidence.yearsExperience > 0) confidenceFactors++;

  // Context mentions (0-20 points)
  const mentionsScore = Math.min(evidence.contextMentions * 5, 20);
  score += mentionsScore;
  if (evidence.contextMentions > 0) confidenceFactors++;

  // Certifications (0-10 points)
  const certScore = Math.min(evidence.certifications.length * 10, 10);
  score += certScore;
  if (evidence.certifications.length > 0) confidenceFactors++;

  // Confidence based on number of evidence types (25%, 50%, 75%, 100%)
  const confidence = (confidenceFactors / 4) * 100;

  return { score, confidence };
}

/**
 * Extract evidence for a specific skill from resume text
 */
function extractSkillEvidence(skill: string, resumeText: string): SkillEvidence {
  const skillLower = skill.toLowerCase();
  const text = resumeText.toLowerCase();

  // Count context mentions
  const regex = new RegExp(`\\b${skillLower}\\b`, 'gi');
  const mentions = (resumeText.match(regex) || []).length;

  // Extract years of experience
  let years = 0;
  const yearsPattern = new RegExp(`(\\d+)\\+?\\s*years?.*${skillLower}`, 'i');
  const yearsMatch = resumeText.match(yearsPattern);
  if (yearsMatch) {
    years = parseInt(yearsMatch[1], 10);
  }

  // Count projects (look for bullet points or project sections mentioning the skill)
  const projectPattern = new RegExp(`(^|\\n)\\s*[•\\-*].*${skillLower}`, 'gi');
  const projects = (resumeText.match(projectPattern) || []).length;

  // Extract certifications
  const certifications: string[] = [];
  const certPattern = new RegExp(`(certified|certification).*${skillLower}`, 'gi');
  if (certPattern.test(resumeText)) {
    certifications.push(`${skill} Certification`);
  }

  return {
    projectCount: projects,
    yearsExperience: years,
    contextMentions: mentions,
    certifications,
  };
}

/**
 * Main assessment function
 * Analyzes resume to produce dual assessment for each skill
 */
export function assessSkills(
  skills: string[],
  resumeText: string
): SkillAssessment[] {
  const selfReportedMap = extractSelfReportedLevels(resumeText);
  
  return skills.map(skill => {
    const evidence = extractSkillEvidence(skill, resumeText);
    const { score, confidence } = computeSkillScore(evidence);
    const selfReported = selfReportedMap.get(skill.toLowerCase()) || null;

    return {
      skill,
      selfReported,
      computed: score,
      confidence,
      evidence,
    };
  });
}

/**
 * Check if there's a large discrepancy between self-reported and computed
 */
export function hasDiscrepancy(assessment: SkillAssessment): boolean {
  if (assessment.selfReported === null) return false;
  
  // Convert self-reported (1-5) to 0-100 scale
  const selfReportedScaled = (assessment.selfReported / 5) * 100;
  const diff = Math.abs(selfReportedScaled - assessment.computed);
  
  return diff > 30;
}

/**
 * Get confidence label
 */
export function getConfidenceLabel(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= 75) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

