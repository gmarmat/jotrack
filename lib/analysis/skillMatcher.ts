/**
 * Local FTS5-based Skill Matching
 * No AI needed - 100% local processing!
 */

import { sqlite } from '@/db/client';

// Common technical skills to look for (expandable)
const COMMON_SKILLS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
  
  // Frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'jQuery', 'Redux', 'GraphQL',
  
  // Backend
  'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Rails', 'FastAPI',
  
  // Databases
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'SQLite', 'Oracle', 'NoSQL',
  
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI',
  
  // Data & AI
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Data Science',
  
  // Tools & Platforms
  'Git', 'Linux', 'Unix', 'REST API', 'Microservices', 'Agile', 'Scrum', 'JIRA', 'Confluence',
  
  // Soft Skills
  'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management', 'Mentoring'
];

interface Skill {
  term: string;
  jdCount: number;
  resumeCount: number;
  category?: string;
}

/**
 * Extract skills from text using regex and keyword matching
 * Fast, local, no AI needed!
 */
export function extractSkills(text: string): Map<string, number> {
  const skillCounts = new Map<string, number>();
  
  if (!text) return skillCounts;
  
  const lowerText = text.toLowerCase();
  
  for (const skill of COMMON_SKILLS) {
    const lowerSkill = skill.toLowerCase();
    
    // Count occurrences (case-insensitive)
    // Use word boundaries for better matching
    const regex = new RegExp(`\\b${lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      skillCounts.set(skill, count);
    }
  }
  
  return skillCounts;
}

/**
 * Match skills between JD and Resume locally
 * Returns array of skills with counts from each source
 */
export function matchSkills(jdText: string, resumeText: string): Skill[] {
  console.log('🔍 Extracting skills locally (no AI needed)...');
  
  const jdSkills = extractSkills(jdText);
  const resumeSkills = extractSkills(resumeText);
  
  // Combine all unique skills
  const allSkills = new Set([...jdSkills.keys(), ...resumeSkills.keys()]);
  
  const skills: Skill[] = Array.from(allSkills).map(skill => ({
    term: skill,
    jdCount: jdSkills.get(skill) || 0,
    resumeCount: resumeSkills.get(skill) || 0,
    category: categorizeSkill(skill)
  }));
  
  // Sort by JD importance (descending)
  skills.sort((a, b) => b.jdCount - a.jdCount);
  
  console.log(`✅ Found ${skills.length} skills (${skills.filter(s => s.resumeCount > 0).length} matched)`);
  
  return skills;
}

/**
 * Categorize skill into type
 */
function categorizeSkill(skill: string): string {
  const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala'];
  const frontend = ['React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'jQuery', 'Redux'];
  const backend = ['Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Rails', 'FastAPI'];
  const databases = ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'SQLite', 'Oracle', 'NoSQL'];
  const cloud = ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform'];
  const data = ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Data Science'];
  
  if (languages.includes(skill)) return 'Programming Language';
  if (frontend.includes(skill)) return 'Frontend';
  if (backend.includes(skill)) return 'Backend';
  if (databases.includes(skill)) return 'Database';
  if (cloud.includes(skill)) return 'Cloud & DevOps';
  if (data.includes(skill)) return 'Data & AI';
  
  return 'Other';
}

/**
 * Calculate skill match percentage
 */
export function calculateSkillMatchPercentage(skills: Skill[]): number {
  if (skills.length === 0) return 0;
  
  const jdSkills = skills.filter(s => s.jdCount > 0);
  if (jdSkills.length === 0) return 100; // No skills in JD = perfect match!
  
  const matchedSkills = jdSkills.filter(s => s.resumeCount > 0);
  
  return Math.round((matchedSkills.length / jdSkills.length) * 100);
}

/**
 * Calculate category scores (Technical, Experience, Domain)
 */
export function calculateCategoryScores(jdText: string, resumeText: string) {
  const skills = matchSkills(jdText, resumeText);
  
  const technicalSkills = skills.filter(s => 
    ['Programming Language', 'Frontend', 'Backend', 'Database', 'Cloud & DevOps'].includes(s.category || '')
  );
  
  const dataSkills = skills.filter(s => s.category === 'Data & AI');
  const otherSkills = skills.filter(s => s.category === 'Other');
  
  const calculateScore = (categorySkills: Skill[]) => {
    if (categorySkills.length === 0) return 100;
    const jdRequired = categorySkills.filter(s => s.jdCount > 0);
    if (jdRequired.length === 0) return 100;
    const matched = jdRequired.filter(s => s.resumeCount > 0);
    return Math.round((matched.length / jdRequired.length) * 100);
  };
  
  return [
    {
      name: 'Technical Skills & Expertise',
      jdRequired: 100,
      resumeCoverage: calculateScore(technicalSkills),
      profileBonus: 0,
      totalScore: calculateScore(technicalSkills)
    },
    {
      name: 'Data & AI Knowledge',
      jdRequired: dataSkills.some(s => s.jdCount > 0) ? 100 : 0,
      resumeCoverage: calculateScore(dataSkills),
      profileBonus: 0,
      totalScore: calculateScore(dataSkills)
    },
    {
      name: 'Domain Knowledge',
      jdRequired: 100,
      resumeCoverage: calculateScore(otherSkills),
      profileBonus: 0,
      totalScore: calculateScore(otherSkills)
    }
  ].filter(cat => cat.jdRequired > 0); // Only show relevant categories
}

