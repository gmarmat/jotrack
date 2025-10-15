export interface Signal {
  id: string;
  name: string;
  category: 'technical' | 'experience' | 'soft';
  type: 'ats_standard' | 'dynamic';
  description: string;
  baseWeight: number; // 0-1, default weight for this signal type
  dynamicWeight?: number; // 0-1, adjusted based on JD/company analysis
  isInBothLists?: boolean; // true if this ATS signal is also found/emphasized in JD
}

export const ATS_STANDARD_SIGNALS: Signal[] = [
  // Technical Skills & Expertise (10 signals) - Generic for all industries
  { id: 'tech_1', name: 'Required Skills Match', category: 'technical', type: 'ats_standard', description: 'Percentage of required skills/tools found in resume', baseWeight: 0.95 },
  { id: 'tech_2', name: 'Core Competencies', category: 'technical', type: 'ats_standard', description: 'Match on primary competencies mentioned in JD', baseWeight: 0.90 },
  { id: 'tech_3', name: 'Software & Tools', category: 'technical', type: 'ats_standard', description: 'Experience with required software/tools', baseWeight: 0.85 },
  { id: 'tech_4', name: 'Certifications & Licenses', category: 'technical', type: 'ats_standard', description: 'Relevant professional certifications/licenses', baseWeight: 0.70 },
  { id: 'tech_5', name: 'Technical Depth', category: 'technical', type: 'ats_standard', description: 'Years of experience with primary skills', baseWeight: 0.80 },
  { id: 'tech_6', name: 'Process Knowledge', category: 'technical', type: 'ats_standard', description: 'Understanding of industry processes/methodologies', baseWeight: 0.75 },
  { id: 'tech_7', name: 'Technology Platforms', category: 'technical', type: 'ats_standard', description: 'Experience with relevant platforms/systems', baseWeight: 0.70 },
  { id: 'tech_8', name: 'Data & Analytics', category: 'technical', type: 'ats_standard', description: 'Experience with data analysis/reporting tools', baseWeight: 0.65 },
  { id: 'tech_9', name: 'Quality & Standards', category: 'technical', type: 'ats_standard', description: 'Knowledge of quality standards/compliance', baseWeight: 0.60 },
  { id: 'tech_10', name: 'Innovation & Learning', category: 'technical', type: 'ats_standard', description: 'Evidence of continuous learning/new technology adoption', baseWeight: 0.70 },
  
  // Experience & Background (10 signals)
  { id: 'exp_1', name: 'Years of Experience', category: 'experience', type: 'ats_standard', description: 'Total years of relevant experience', baseWeight: 0.85 },
  { id: 'exp_2', name: 'Industry Experience', category: 'experience', type: 'ats_standard', description: 'Years in the specific industry', baseWeight: 0.80 },
  { id: 'exp_3', name: 'Role Level Match', category: 'experience', type: 'ats_standard', description: 'Current level matches required level', baseWeight: 0.90 },
  { id: 'exp_4', name: 'Education Level', category: 'experience', type: 'ats_standard', description: 'Degree level (BS, MS, PhD)', baseWeight: 0.75 },
  { id: 'exp_5', name: 'Educational Background', category: 'experience', type: 'ats_standard', description: 'Relevant field of study/major', baseWeight: 0.70 },
  { id: 'exp_6', name: 'Company Size Match', category: 'experience', type: 'ats_standard', description: 'Experience at similar company size', baseWeight: 0.65 },
  { id: 'exp_7', name: 'Career Progression', category: 'experience', type: 'ats_standard', description: 'Steady upward trajectory', baseWeight: 0.70 },
  { id: 'exp_8', name: 'Tenure Stability', category: 'experience', type: 'ats_standard', description: 'Average job tenure (not job-hopping)', baseWeight: 0.65 },
  { id: 'exp_9', name: 'Project Scale', category: 'experience', type: 'ats_standard', description: 'Experience with projects of similar scope', baseWeight: 0.75 },
  { id: 'exp_10', name: 'Work Environment', category: 'experience', type: 'ats_standard', description: 'Experience with remote/onsite/hybrid work', baseWeight: 0.55 },
  
  // Soft Skills & Culture Fit (10 signals)
  { id: 'soft_1', name: 'Leadership Experience', category: 'soft', type: 'ats_standard', description: 'Team management and leadership roles', baseWeight: 0.75 },
  { id: 'soft_2', name: 'Communication Skills', category: 'soft', type: 'ats_standard', description: 'Evidence of presentations, documentation, etc.', baseWeight: 0.70 },
  { id: 'soft_3', name: 'Team Collaboration', category: 'soft', type: 'ats_standard', description: 'Team player, cross-functional, etc.', baseWeight: 0.65 },
  { id: 'soft_4', name: 'Problem Solving', category: 'soft', type: 'ats_standard', description: 'Complex problem solving examples', baseWeight: 0.70 },
  { id: 'soft_5', name: 'Initiative & Ownership', category: 'soft', type: 'ats_standard', description: 'Self-starter, ownership keywords', baseWeight: 0.65 },
  { id: 'soft_6', name: 'Adaptability', category: 'soft', type: 'ats_standard', description: 'Evidence of learning new skills/domains', baseWeight: 0.60 },
  { id: 'soft_7', name: 'Customer Focus', category: 'soft', type: 'ats_standard', description: 'Customer service/client interaction experience', baseWeight: 0.60 },
  { id: 'soft_8', name: 'Time Management', category: 'soft', type: 'ats_standard', description: 'Evidence of meeting deadlines/managing priorities', baseWeight: 0.65 },
  { id: 'soft_9', name: 'Cultural Fit', category: 'soft', type: 'ats_standard', description: 'Values alignment with company culture', baseWeight: 0.70 },
  { id: 'soft_10', name: 'Results Orientation', category: 'soft', type: 'ats_standard', description: 'Track record of achieving measurable results', baseWeight: 0.75 },
];

// 30 ATS signals defined above
// UP TO 30 Dynamic signals generated at runtime based on JD analysis
// Example dynamic signals for a Product Manager role (showing 20 for demo):
export const DYNAMIC_SIGNALS_EXAMPLE: Signal[] = [
  // Technical Skills (8 dynamic)
  { id: 'dyn_tech_1', name: 'Product Analytics Tools', category: 'technical', type: 'dynamic', description: 'Experience with Mixpanel, Amplitude, or similar product analytics', baseWeight: 0.85 },
  { id: 'dyn_tech_2', name: 'A/B Testing & Experimentation', category: 'technical', type: 'dynamic', description: 'Running controlled experiments and interpreting results', baseWeight: 0.80 },
  { id: 'dyn_tech_3', name: 'Roadmap & Project Management Tools', category: 'technical', type: 'dynamic', description: 'Proficiency with Jira, Asana, or Linear', baseWeight: 0.75 },
  { id: 'dyn_tech_4', name: 'SQL & Database Querying', category: 'technical', type: 'dynamic', description: 'Ability to write SQL queries for data analysis', baseWeight: 0.70 },
  { id: 'dyn_tech_5', name: 'API Documentation', category: 'technical', type: 'dynamic', description: 'Experience documenting APIs for developers', baseWeight: 0.65 },
  { id: 'dyn_tech_6', name: 'Figma/Sketch Proficiency', category: 'technical', type: 'dynamic', description: 'Ability to create wireframes and mockups', baseWeight: 0.60 },
  { id: 'dyn_tech_7', name: 'Google Analytics', category: 'technical', type: 'dynamic', description: 'Web analytics and conversion tracking', baseWeight: 0.65 },
  { id: 'dyn_tech_8', name: 'Mobile App Platforms', category: 'technical', type: 'dynamic', description: 'Understanding of iOS and Android ecosystems', baseWeight: 0.70 },
  
  // Experience (7 dynamic)
  { id: 'dyn_exp_1', name: 'B2B SaaS Experience', category: 'experience', type: 'dynamic', description: 'Product management in B2B SaaS environment', baseWeight: 0.90 },
  { id: 'dyn_exp_2', name: '0-to-1 Product Launch', category: 'experience', type: 'dynamic', description: 'Experience launching new products from scratch', baseWeight: 0.85 },
  { id: 'dyn_exp_3', name: 'Cross-Platform Product', category: 'experience', type: 'dynamic', description: 'Managing web, mobile, and API products', baseWeight: 0.75 },
  { id: 'dyn_exp_4', name: 'Growth Stage Startup', category: 'experience', type: 'dynamic', description: 'Experience in Series B-D startups', baseWeight: 0.70 },
  { id: 'dyn_exp_5', name: 'Enterprise Customer Management', category: 'experience', type: 'dynamic', description: 'Working with Fortune 500 clients', baseWeight: 0.75 },
  { id: 'dyn_exp_6', name: 'Pricing Strategy', category: 'experience', type: 'dynamic', description: 'Experience with pricing models and monetization', baseWeight: 0.70 },
  { id: 'dyn_exp_7', name: 'International Markets', category: 'experience', type: 'dynamic', description: 'Experience launching products globally', baseWeight: 0.65 },
  
  // Soft Skills (5 dynamic)
  { id: 'dyn_soft_1', name: 'Stakeholder Management', category: 'soft', type: 'dynamic', description: 'Managing expectations across engineering, design, sales', baseWeight: 0.85 },
  { id: 'dyn_soft_2', name: 'Data-Driven Decision Making', category: 'soft', type: 'dynamic', description: 'Using metrics and data to drive product decisions', baseWeight: 0.80 },
  { id: 'dyn_soft_3', name: 'Customer Discovery', category: 'soft', type: 'dynamic', description: 'Conducting user interviews and customer research', baseWeight: 0.75 },
  { id: 'dyn_soft_4', name: 'Executive Communication', category: 'soft', type: 'dynamic', description: 'Presenting to C-level executives', baseWeight: 0.80 },
  { id: 'dyn_soft_5', name: 'Conflict Resolution', category: 'soft', type: 'dynamic', description: 'Navigating disagreements between teams', baseWeight: 0.70 },
];

export const generateDynamicSignals = (jd: string, resume: string, companyProfile?: any): Signal[] => {
  // AI would analyze JD and generate up to 30 role-specific signals
  // The AI should:
  // 1. Extract specific technical requirements (languages, tools, platforms)
  // 2. Identify industry-specific requirements (fintech compliance, healthcare HIPAA, etc.)
  // 3. Find company-specific needs (startup vs enterprise, remote-first, etc.)
  // 4. Detect role-specific competencies (PM: roadmap, Engineer: system design, etc.)
  // 5. Mark any ATS signals that are also emphasized in JD with isInBothLists: true
  // For now, return example signals (20 out of possible 30)
  return DYNAMIC_SIGNALS_EXAMPLE;
};

// Dynamic weight adjustment based on JD analysis
export const adjustSignalWeights = (signals: Signal[], jd: string, companyProfile?: any): Signal[] => {
  return signals.map(signal => {
    // AI analysis determines if this signal is more/less important for this specific role
    // For example:
    // - If JD emphasizes "5+ years Python", increase tech_2 (Programming Languages) weight
    // - If company is startup, increase exp_12 (Startup vs Enterprise) weight
    // - If role requires management, increase soft_1 (Leadership) weight
    
    const adjustedWeight = signal.baseWeight; // AI would calculate this
    return {
      ...signal,
      dynamicWeight: adjustedWeight
    };
  });
};