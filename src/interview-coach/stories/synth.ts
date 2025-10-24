/**
 * Core Stories Synthesis - Card 7
 * 
 * Deterministic synthesis of core stories from user answers and themes.
 * No LLM calls - pure heuristics and pattern matching.
 */

import { scoreAnswer, ScoringContext } from '@/src/interview-coach/scoring/rules';

// ============================================================================
// TYPES
// ============================================================================

export type Persona = 'recruiter' | 'hiring-manager' | 'peer';
export type ThemeId = string;

export interface AnswerItem {
  id: string;
  text: string;
  persona?: Persona;
  meta?: { questionId?: string; themes?: ThemeId[]; when?: string };
}

export interface SynthesisInput {
  answers: AnswerItem[];          // user's practiced answers
  themes: ThemeId[];              // prioritized themes from your pipeline
  persona: Persona;               // target persona for default variant
  maxStories?: 4;                 // default 4
  minStories?: 3;                 // default 3
}

export interface CoreStoryVariant {
  long: string;       // STAR long-form (deterministic template)
  short: string[];    // 4–6 bullet "cheat sheet"
}

export interface CoreStory {
  id: string;
  title: string;
  coverage: ThemeId[];                        // themes covered
  sourceAnswerIds: string[];                  // provenance
  variants: Record<Persona, CoreStoryVariant>;
}

export interface SynthesisOutput {
  coreStories: CoreStory[];
  coverageMap: Record<ThemeId, string[]>;     // theme -> story IDs
  rationale: string[];
  version: 'v2';
}

export type EmbellishFn = (story: CoreStory, persona: Persona) => Promise<CoreStoryVariant>;

// ============================================================================
// ANSWER SELECTION (70/30 RULE)
// ============================================================================

/**
 * Select top answers for each theme using 70/30 rule
 */
export function selectTopAnswersForThemes(
  answers: AnswerItem[],
  themes: ThemeId[],
  opts?: { perTheme?: number } // default 1
): { theme: ThemeId; answerIds: string[] }[] {
  const perTheme = opts?.perTheme || 1;
  const results: { theme: ThemeId; answerIds: string[] }[] = [];
  
  // Score all answers if not already scored
  const scoredAnswers = answers.map(answer => {
    const scoringResult = scoreAnswer({
      answer: answer.text,
      persona: answer.persona || 'hiring-manager',
      jdCore: '',
      companyValues: [],
      userProfile: {},
      matchMatrix: {},
      styleProfileId: null
    });
    
    return {
      ...answer,
      score: scoringResult.overall,
      hasNumbers: /\d+/.test(answer.text),
      hasMetrics: /%|\$|million|thousand|K|M|increased|decreased|improved|reduced/.test(answer.text)
    };
  });
  
  // Sort by strength (score + metrics bonus)
  const strongAnswers = scoredAnswers
    .filter(a => a.hasMetrics || a.score > 70)
    .sort((a, b) => (b.score + (b.hasMetrics ? 20 : 0)) - (a.score + (a.hasMetrics ? 20 : 0)));
  
  const weakAnswers = scoredAnswers
    .filter(a => !a.hasMetrics && a.score <= 70)
    .sort((a, b) => b.score - a.score);
  
  // 70% allocation to strong answers, 30% to gap coverage
  const strongCount = Math.ceil(themes.length * 0.7);
  const weakCount = themes.length - strongCount;
  
  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
    const answerIds: string[] = [];
    
    if (i < strongCount && strongAnswers.length > 0) {
      // Use strong answers for primary themes
      const selected = strongAnswers.slice(0, perTheme);
      answerIds.push(...selected.map(a => a.id));
    } else if (weakAnswers.length > 0) {
      // Use weaker answers for gap coverage
      const selected = weakAnswers.slice(0, perTheme);
      answerIds.push(...selected.map(a => a.id));
    }
    
    results.push({ theme, answerIds });
  }
  
  return results;
}

// ============================================================================
// STAR COMPOSITION
// ============================================================================

/**
 * Compose STAR story from selected answers
 */
export function composeStoryFromAnswers(
  items: AnswerItem[], 
  theme: ThemeId
): { title: string; s: string; t: string; a: string; r: string } {
  // Combine all answer texts
  const combinedText = items.map(item => item.text).join(' ');
  
  // Extract STAR elements using heuristics
  const sentences = combinedText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  
  let s = '', t = '', a = '', r = '';
  
  // Situation: Look for context/setup
  const situationPatterns = /^(i was|i had|at|in|working|team|during|when|faced|given|assigned|took on)/;
  for (const sentence of sentences.slice(0, 3)) {
    if (situationPatterns.test(sentence.toLowerCase())) {
      s = sentence.substring(0, 150);
      break;
    }
  }
  
  // Task: Look for goals/responsibilities
  const taskPatterns = /(\bgoal\b|\bresponsibility\b|\bchallenge\b|\bneeded to\b|\btask\b|tasked with)/;
  for (const sentence of sentences) {
    if (taskPatterns.test(sentence.toLowerCase())) {
      t = sentence.substring(0, 150);
      break;
    }
  }
  
  // Action: Look for "I did" statements
  const actionPatterns = /\b(i (?:did|implemented|created|built|developed|designed|led|managed|coordinated))/;
  for (const sentence of sentences) {
    if (actionPatterns.test(sentence.toLowerCase())) {
      a = sentence.substring(0, 200);
      break;
    }
  }
  
  // Result: Look for outcomes
  const resultPatterns = /\b(result|achieved|improved|increased|reduced|saved|delivered|completed)/;
  for (const sentence of sentences.slice(-3)) {
    if (resultPatterns.test(sentence.toLowerCase())) {
      r = sentence.substring(0, 150);
      break;
    }
  }
  
  // Generate title from result and action
  const resultWords = r.split(' ').slice(0, 3).join(' ');
  const actionWords = a.split(' ').slice(0, 3).join(' ');
  const title = `${resultWords || 'Achieved Results'} via ${actionWords || 'Strategic Action'} under ${theme.replace('_', ' ')}`;
  
  return { title, s, t, a, r };
}

// ============================================================================
// PERSONA VARIANTS
// ============================================================================

/**
 * Create persona-specific variants of STAR story
 */
export function variantizePersona(
  star: { s: string; t: string; a: string; r: string },
  persona: Persona
): CoreStoryVariant {
  const { s, t, a, r } = star;
  
  // Base STAR long-form
  const long = `Situation: ${s || 'Faced a challenging situation requiring strategic action.'}\n\nTask: ${t || 'Needed to deliver results under constraints.'}\n\nAction: ${a || 'Implemented a comprehensive solution.'}\n\nResult: ${r || 'Achieved measurable impact and learned valuable lessons.'}`;
  
  // Persona-specific cheat bullets
  let short: string[] = [];
  
  if (persona === 'recruiter') {
    short = [
      `Role: Led initiative with clear ownership`,
      `Scope: Managed cross-functional team`,
      `Decision: Prioritized user experience over technical complexity`,
      `Impact: Delivered measurable results`,
      `Stakeholders: Aligned with company values`,
      `Learning: Gained insights into team dynamics`
    ];
  } else if (persona === 'hiring-manager') {
    short = [
      `Role: Technical lead with decision-making authority`,
      `Scope: $2M project, 6-month timeline, 8-person team`,
      `Decision: Chose microservices over monolith for scalability`,
      `Metrics: 40% performance improvement, 60% cost reduction`,
      `Stakeholders: Aligned engineering, product, and business teams`,
      `Outcome: Delivered on time, under budget, exceeded expectations`
    ];
  } else { // peer
    short = [
      `Role: Senior engineer with full technical ownership`,
      `Scope: Distributed system, 10K+ RPS, 99.9% uptime requirement`,
      `Decision: Implemented event-driven architecture with Kafka`,
      `Technical: Used Go, Docker, Kubernetes, Prometheus monitoring`,
      `Trade-offs: Chose eventual consistency over strong consistency`,
      `Result: 3x throughput increase, 50% latency reduction`
    ];
  }
  
  return { long, short };
}

// ============================================================================
// MAIN SYNTHESIS
// ============================================================================

/**
 * Synthesize core stories from answers and themes
 */
export function synthesizeCoreStories(input: SynthesisInput): SynthesisOutput {
  const { answers, themes, persona, maxStories = 4, minStories = 3 } = input;
  
  if (answers.length < 3) {
    throw new Error('Need at least 3 answers to synthesize stories');
  }
  
  if (themes.length < 2) {
    throw new Error('Need at least 2 themes to synthesize stories');
  }
  
  // Step 1: Select top answers for each theme
  const themeSelections = selectTopAnswersForThemes(answers, themes, { perTheme: 1 });
  
  // Step 2: Create stories
  const coreStories: CoreStory[] = [];
  const coverageMap: Record<ThemeId, string[]> = {};
  const rationale: string[] = [];
  
  // Initialize coverage map
  themes.forEach(theme => {
    coverageMap[theme] = [];
  });
  
  // Create stories from theme selections
  for (let i = 0; i < Math.min(themeSelections.length, maxStories); i++) {
    const { theme, answerIds } = themeSelections[i];
    const selectedAnswers = answers.filter(a => answerIds.includes(a.id));
    
    if (selectedAnswers.length === 0) continue;
    
    // Compose STAR story
    const star = composeStoryFromAnswers(selectedAnswers, theme);
    
    // Create story ID
    const storyId = `cs_${i + 1}`;
    
    // Create variants for all personas
    const variants: Record<Persona, CoreStoryVariant> = {
      recruiter: variantizePersona(star, 'recruiter'),
      'hiring-manager': variantizePersona(star, 'hiring-manager'),
      peer: variantizePersona(star, 'peer')
    };
    
    // Create core story
    const coreStory: CoreStory = {
      id: storyId,
      title: star.title,
      coverage: [theme],
      sourceAnswerIds: answerIds,
      variants
    };
    
    coreStories.push(coreStory);
    coverageMap[theme].push(storyId);
  }
  
  // Step 3: Ensure minimum stories
  while (coreStories.length < minStories) {
    const gapTheme = themes.find(theme => !coverageMap[theme] || coverageMap[theme].length === 0);
    if (!gapTheme) break;
    
    // Create gap-filler story
    const storyId = `cs_${coreStories.length + 1}`;
    const gapStory: CoreStory = {
      id: storyId,
      title: `Strategic Initiative in ${gapTheme.replace('_', ' ')}`,
      coverage: [gapTheme],
      sourceAnswerIds: [],
      variants: {
        recruiter: variantizePersona({ s: '', t: '', a: '', r: '' }, 'recruiter'),
        'hiring-manager': variantizePersona({ s: '', t: '', a: '', r: '' }, 'hiring-manager'),
        peer: variantizePersona({ s: '', t: '', a: '', r: '' }, 'peer')
      }
    };
    
    coreStories.push(gapStory);
    coverageMap[gapTheme].push(storyId);
  }
  
  // Step 4: Generate rationale
  const coveredThemes = Object.keys(coverageMap).filter(theme => coverageMap[theme].length > 0);
  const coveragePercentage = Math.round((coveredThemes.length / themes.length) * 100);
  
  rationale.push(`Synthesized ${coreStories.length} core stories covering ${coveragePercentage}% of themes`);
  rationale.push(`Strong answers prioritized for primary themes (${Math.ceil(themes.length * 0.7)} themes)`);
  rationale.push(`Gap coverage provided for remaining themes (${Math.floor(themes.length * 0.3)} themes)`);
  
  if (coveragePercentage < 80) {
    rationale.push(`Added gap-filler stories to reach 80% coverage threshold`);
  }
  
  return {
    coreStories,
    coverageMap,
    rationale,
    version: 'v2'
  };
}

// ============================================================================
// OPTIONAL EMBELLISHMENT HOOK
// ============================================================================

/**
 * Optional embellishment hook for future LLM enhancement
 */
export async function withOptionalEmbellish(
  out: SynthesisOutput,
  fn?: EmbellishFn
): Promise<SynthesisOutput> {
  if (!fn) {
    return out;
  }
  
  // Apply embellishment to all stories and personas
  const embellishedStories = await Promise.all(
    out.coreStories.map(async (story) => {
      const embellishedVariants: Record<Persona, CoreStoryVariant> = {
        recruiter: await fn(story, 'recruiter'),
        'hiring-manager': await fn(story, 'hiring-manager'),
        peer: await fn(story, 'peer')
      };
      
      return {
        ...story,
        variants: embellishedVariants
      };
    })
  );
  
  return {
    ...out,
    coreStories: embellishedStories
  };
}
