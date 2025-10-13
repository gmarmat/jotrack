/**
 * Strict Vocabulary Extraction - NO HALLUCINATIONS
 * 
 * This module ensures AI analysis ONLY uses terms present in source documents.
 * Any skill/keyword not found in JD or Resume receives score=0 and "Unknown/Absent" flag.
 */

export interface ExtractedVocab {
  terms: Set<string>;
  bigrams: Set<string>;
  trigrams: Set<string>;
  context: Map<string, string>; // term -> surrounding context (100 chars)
}

export interface SkillMatch {
  skill: string;
  foundIn: 'exact' | 'alias' | 'none';
  context: string;
  inJD: boolean;
  inResume: boolean;
}

export interface ParameterScore {
  score: number;
  jdEvidence: string;
  resumeEvidence: string;
  reasoning: string;
  foundInSources: boolean;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'can', 'could', 'may', 'might', 'must', 'shall',
]);

/**
 * Extract vocabulary from text - unigrams, bigrams, trigrams
 * Returns ONLY terms actually present in source
 */
export function extractVocabulary(text: string): ExtractedVocab {
  const terms = new Set<string>();
  const bigrams = new Set<string>();
  const trigrams = new Set<string>();
  const context = new Map<string, string>();

  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Tokenize: split on whitespace and punctuation, lowercase
    const tokens = trimmed
      .toLowerCase()
      .split(/[\s,\.;:\(\)\[\]{}]+/) // Split on whitespace and punctuation
      .map(t => t.trim())
      .filter(t => t.length > 1 && /\w/.test(t)); // Keep tokens with word characters

    // Unigrams (skip stopwords)
    for (const token of tokens) {
      if (!STOPWORDS.has(token) && token.length > 2) {
        terms.add(token);
        if (!context.has(token)) {
          context.set(token, trimmed.slice(0, 150));
        }
      }
    }

    // Bigrams (common technical terms: "machine learning", "react native")
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      if (bigram.length > 4 && !STOPWORDS.has(tokens[i])) {
        bigrams.add(bigram);
        if (!context.has(bigram)) {
          context.set(bigram, trimmed.slice(0, 150));
        }
      }
    }

    // Trigrams (e.g., "natural language processing")
    for (let i = 0; i < tokens.length - 2; i++) {
      const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
      if (trigram.length > 6) {
        trigrams.add(trigram);
        if (!context.has(trigram)) {
          context.set(trigram, trimmed.slice(0, 150));
        }
      }
    }
  }

  return { terms, bigrams, trigrams, context };
}

/**
 * Check if a term exists in vocabulary (fuzzy matching for variants)
 */
export function termExistsInVocab(
  term: string,
  vocab: ExtractedVocab
): { exists: boolean; matchedTerm: string; context: string } {
  const termLower = term.toLowerCase();

  // Exact match in any gram
  if (vocab.terms.has(termLower) || vocab.bigrams.has(termLower) || vocab.trigrams.has(termLower)) {
    return {
      exists: true,
      matchedTerm: termLower,
      context: vocab.context.get(termLower) || '',
    };
  }

  // Check if term is substring of any bigram/trigram
  for (const bigram of Array.from(vocab.bigrams)) {
    if (bigram.includes(termLower) || termLower.includes(bigram)) {
      return {
        exists: true,
        matchedTerm: bigram,
        context: vocab.context.get(bigram) || '',
      };
    }
  }

  // No match
  return { exists: false, matchedTerm: '', context: '' };
}

/**
 * Match skills from taxonomy against extracted vocabulary
 * ONLY returns skills actually found in text
 */
export function matchSkillsFromTaxonomy(
  jdVocab: ExtractedVocab,
  resumeVocab: ExtractedVocab,
  taxonomySkills: Array<{ label: string; aliases: string[] }>
): SkillMatch[] {
  const matches: SkillMatch[] = [];

  for (const skill of taxonomySkills) {
    const label = skill.label.toLowerCase();
    const aliases = skill.aliases.map(a => a.toLowerCase());

    // Check JD
    const jdExact = termExistsInVocab(label, jdVocab);
    let jdAliasMatch = false;
    let jdContext = '';

    if (!jdExact.exists) {
      for (const alias of aliases) {
        const aliasCheck = termExistsInVocab(alias, jdVocab);
        if (aliasCheck.exists) {
          jdAliasMatch = true;
          jdContext = aliasCheck.context;
          break;
        }
      }
    }

    // Check Resume
    const resumeExact = termExistsInVocab(label, resumeVocab);
    let resumeAliasMatch = false;
    let resumeContext = '';

    if (!resumeExact.exists) {
      for (const alias of aliases) {
        const aliasCheck = termExistsInVocab(alias, resumeVocab);
        if (aliasCheck.exists) {
          resumeAliasMatch = true;
          resumeContext = aliasCheck.context;
          break;
        }
      }
    }

    const inJD = jdExact.exists || jdAliasMatch;
    const inResume = resumeExact.exists || resumeAliasMatch;

    // Only include if found in at least one source
    if (inJD || inResume) {
      matches.push({
        skill: skill.label,
        foundIn: jdExact.exists || resumeExact.exists ? 'exact' : 'alias',
        context: jdContext || resumeContext || jdExact.context || resumeExact.context,
        inJD,
        inResume,
      });
    }
  }

  return matches;
}

/**
 * Map parameter names to searchable keywords
 * This is the key to preventing hallucinations while being practical
 */
function getParameterKeywords(param: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'Domain Experience': ['experience', 'years', 'background', 'expertise', 'domain', 'industry'],
    'Technical Skills': ['technical', 'skills', 'technologies', 'tools', 'platforms'],
    'Programming Languages': ['python', 'java', 'javascript', 'typescript', 'go', 'rust', 'ruby', 'c++', 'c#'],
    'Frameworks & Libraries': ['react', 'vue', 'angular', 'django', 'flask', 'spring', 'express', 'nextjs', 'framework', 'library'],
    'System Design': ['architecture', 'design', 'scalable', 'distributed', 'microservices', 'system'],
    'Database Knowledge': ['database', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'db'],
    'Cloud Platforms': ['aws', 'azure', 'gcp', 'cloud', 'ec2', 's3', 'lambda'],
    'DevOps & CI/CD': ['devops', 'cicd', 'ci/cd', 'docker', 'kubernetes', 'jenkins', 'github actions', 'deployment'],
    'Years of Experience': ['years', 'experience', 'senior', 'junior', 'mid-level'],
    'Education Level': ['education', 'degree', 'bachelor', 'master', 'phd', 'university', 'college'],
    'Team Leadership': ['lead', 'leadership', 'managed', 'mentor', 'team'],
    'Project Management': ['project', 'management', 'planning', 'roadmap', 'agile'],
    'Communication Skills': ['communication', 'presentation', 'collaboration', 'stakeholder'],
    'Problem Solving': ['problem', 'solving', 'analytical', 'debugging', 'troubleshooting'],
    'Code Quality': ['quality', 'clean code', 'best practices', 'code review', 'refactoring'],
    'Testing & QA': ['testing', 'test', 'qa', 'unit test', 'integration', 'quality assurance'],
    'Security Knowledge': ['security', 'authentication', 'authorization', 'encryption', 'vulnerabilities'],
    'Performance Optimization': ['performance', 'optimization', 'scaling', 'caching', 'latency'],
    'API Design': ['api', 'rest', 'graphql', 'endpoint', 'integration'],
    'Agile Methodologies': ['agile', 'scrum', 'kanban', 'sprint', 'jira'],
    'Version Control': ['git', 'github', 'gitlab', 'version control', 'vcs'],
    'Documentation': ['documentation', 'docs', 'technical writing', 'readme'],
    'Mentoring': ['mentor', 'mentoring', 'coaching', 'training', 'onboarding'],
    'Innovation': ['innovation', 'innovative', 'creative', 'new'],
    'Cultural Fit': ['culture', 'values', 'principles', 'mission', 'vision'],
  };

  return keywordMap[param] || [param.toLowerCase()];
}

/**
 * CRITICAL: Score a parameter ONLY if evidence exists
 * Returns score=0 and "Unknown/Absent" if term not found in sources
 */
export function scoreParameter(
  param: string,
  jdVocab: ExtractedVocab,
  resumeVocab: ExtractedVocab,
  weight: number
): ParameterScore {
  // Get searchable keywords for this parameter
  const keywords = getParameterKeywords(param);
  
  // Check if ANY keyword exists in vocabs
  let jdCheck = { exists: false, matchedTerm: '', context: '' };
  let resumeCheck = { exists: false, matchedTerm: '', context: '' };
  
  for (const keyword of keywords) {
    if (!jdCheck.exists) {
      const check = termExistsInVocab(keyword, jdVocab);
      if (check.exists) jdCheck = check;
    }
    if (!resumeCheck.exists) {
      const check = termExistsInVocab(keyword, resumeVocab);
      if (check.exists) resumeCheck = check;
    }
    if (jdCheck.exists && resumeCheck.exists) break; // Found in both, no need to continue
  }

  // NOT FOUND IN EITHER - score must be 0
  if (!jdCheck.exists && !resumeCheck.exists) {
    return {
      score: 0,
      jdEvidence: 'Not mentioned in job description',
      resumeEvidence: 'Not mentioned in resume',
      reasoning: 'Unknown/Absent - parameter not found in source documents',
      foundInSources: false,
    };
  }

  // Calculate score based on presence
  let score = 0;
  let reasoning = '';

  if (jdCheck.exists && resumeCheck.exists) {
    // Perfect match - found in both
    score = 1.0;
    reasoning = 'Required in JD and present in resume - perfect match';
  } else if (jdCheck.exists && !resumeCheck.exists) {
    // Required but missing - gap
    score = 0.3;
    reasoning = 'Required in JD but absent from resume - significant gap';
  } else if (!jdCheck.exists && resumeCheck.exists) {
    // Bonus skill - extra value
    score = 0.7;
    reasoning = 'Not required but present in resume - additional skill';
  }

  const jdEvidence = jdCheck.exists
    ? `"${jdCheck.context.slice(0, 100)}..."`
    : 'Not mentioned';

  const resumeEvidence = resumeCheck.exists
    ? `"${resumeCheck.context.slice(0, 100)}..."`
    : 'Not mentioned';

  return {
    score,
    jdEvidence,
    resumeEvidence,
    reasoning,
    foundInSources: true,
  };
}

/**
 * Generate keyword analysis for heatmap
 */
export function extractKeywordAnalysis(
  jdVocab: ExtractedVocab,
  resumeVocab: ExtractedVocab
): Array<{ term: string; inJD: boolean; inResume: boolean; importance: number; action: string }> {
  const keywords: Array<{ term: string; inJD: boolean; inResume: boolean; importance: number; action: string }> = [];

  // Combine all terms from both vocabs
  const allTerms = new Set([
    ...Array.from(jdVocab.terms),
    ...Array.from(jdVocab.bigrams),
    ...Array.from(resumeVocab.terms),
    ...Array.from(resumeVocab.bigrams),
  ]);

  // Filter to relevant technical/professional terms (simple heuristic)
  const relevantTerms = Array.from(allTerms).filter(term => {
    return term.length > 3 && !STOPWORDS.has(term);
  });

  // Sort by length (longer terms often more specific/important)
  relevantTerms.sort((a, b) => b.length - a.length);

  // Take top 20 most relevant
  for (const term of relevantTerms.slice(0, 20)) {
    const inJD = termExistsInVocab(term, jdVocab).exists;
    const inResume = termExistsInVocab(term, resumeVocab).exists;

    // Importance heuristic
    let importance = 1;
    if (inJD && !inResume) importance = 3; // Critical gap
    if (inJD && inResume) importance = 2; // Good coverage
    if (!inJD && inResume) importance = 1; // Nice to have

    // Action recommendation
    let action = 'ok';
    if (inJD && !inResume) action = 'add';
    if (inJD && inResume) action = 'emphasize';

    keywords.push({ term, inJD, inResume, importance, action });
  }

  // Sort by importance descending
  keywords.sort((a, b) => b.importance - a.importance);

  return keywords;
}

/**
 * Generate 25-parameter breakdown with strict extraction
 * NO HALLUCINATIONS - only parameters found in sources get non-zero scores
 */
export function generate25ParameterBreakdown(
  jdVocab: ExtractedVocab,
  resumeVocab: ExtractedVocab
): Array<{
  param: string;
  weight: number;
  jdEvidence: string;
  resumeEvidence: string;
  score: number;
  reasoning: string;
  sources: string[];
}> {
  // Define 25 parameters with weights (must sum to 1.0)
  const parameters = [
    { name: 'Domain Experience', weight: 0.08 },
    { name: 'Technical Skills', weight: 0.08 },
    { name: 'Programming Languages', weight: 0.07 },
    { name: 'Frameworks & Libraries', weight: 0.07 },
    { name: 'System Design', weight: 0.06 },
    { name: 'Database Knowledge', weight: 0.05 },
    { name: 'Cloud Platforms', weight: 0.05 },
    { name: 'DevOps & CI/CD', weight: 0.04 },
    { name: 'Years of Experience', weight: 0.06 },
    { name: 'Education Level', weight: 0.04 },
    { name: 'Team Leadership', weight: 0.05 },
    { name: 'Project Management', weight: 0.04 },
    { name: 'Communication Skills', weight: 0.04 },
    { name: 'Problem Solving', weight: 0.04 },
    { name: 'Code Quality', weight: 0.03 },
    { name: 'Testing & QA', weight: 0.03 },
    { name: 'Security Knowledge', weight: 0.03 },
    { name: 'Performance Optimization', weight: 0.03 },
    { name: 'API Design', weight: 0.03 },
    { name: 'Agile Methodologies', weight: 0.03 },
    { name: 'Version Control', weight: 0.02 },
    { name: 'Documentation', weight: 0.02 },
    { name: 'Mentoring', weight: 0.02 },
    { name: 'Innovation', weight: 0.02 },
    { name: 'Cultural Fit', weight: 0.02 },
  ];

  const breakdown = parameters.map(p => {
    const result = scoreParameter(p.name, jdVocab, resumeVocab, p.weight);
    return {
      param: p.name,
      weight: p.weight,
      jdEvidence: result.jdEvidence,
      resumeEvidence: result.resumeEvidence,
      score: result.score,
      reasoning: result.reasoning,
      sources: [], // Will be populated from API meta
    };
  });

  return breakdown;
}

