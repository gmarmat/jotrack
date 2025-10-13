/**
 * Prompt Template Loader v1.2
 * Loads versioned prompts from markdown files and renders with placeholders
 */

import fs from 'fs';
import path from 'path';

export type PromptKind = 'analyze' | 'compare' | 'improve' | 'skillpath' | 'persona';

interface PromptVariables {
  jobTitle?: string;
  company?: string;
  jdText?: string;
  resumeText?: string;
  notesText?: string;
  currentSkills?: string;
  missingSkills?: string;
  personType?: string;
  personName?: string;
  linkedinUrl?: string;
  context?: string;
  original?: string;
  updated?: string;
}

/**
 * Load prompt template from markdown file
 * @param kind - Type of prompt (analyze, improve, etc.)
 * @param version - Version string (default: 'v1')
 * @returns Raw prompt template with {{placeholders}}
 */
export function loadPrompt(kind: PromptKind, version: string = 'v1'): string {
  const promptsDir = path.join(process.cwd(), 'core/ai/prompts');
  const filename = `${kind}.${version}.md`;
  const filepath = path.join(promptsDir, filename);

  try {
    if (!fs.existsSync(filepath)) {
      console.warn(`Prompt file not found: ${filepath}, using default`);
      return getDefaultPrompt(kind);
    }

    return fs.readFileSync(filepath, 'utf-8');
  } catch (error) {
    console.error(`Error loading prompt ${kind}.${version}:`, error);
    return getDefaultPrompt(kind);
  }
}

/**
 * Render template by replacing {{placeholders}} with actual values
 * @param template - Prompt template with {{placeholders}}
 * @param variables - Object with variable values
 * @returns Rendered prompt ready for LLM
 */
export function renderTemplate(template: string, variables: PromptVariables): string {
  let rendered = template;

  // Replace all {{placeholder}} occurrences
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = value?.toString() || '';
    rendered = rendered.split(placeholder).join(replacement);
  }

  // Warn about unreplaced placeholders (dev mode)
  const unreplaced = rendered.match(/{{[^}]+}}/g);
  if (unreplaced && process.env.NODE_ENV === 'development') {
    console.warn('Unreplaced placeholders:', unreplaced);
  }

  return rendered;
}

/**
 * Load and render prompt in one step
 */
export function getRenderedPrompt(
  kind: PromptKind,
  variables: PromptVariables,
  version: string = 'v1'
): string {
  const template = loadPrompt(kind, version);
  return renderTemplate(template, variables);
}

/**
 * Fallback prompts if markdown files not found
 */
function getDefaultPrompt(kind: PromptKind): string {
  const defaults: Record<PromptKind, string> = {
    analyze: `Analyze the fit between this job and resume. Return JSON with fit.overall (0-1), fit.breakdown array with 25 params, keywords array, sources array, and meta object.

Job: {{jobTitle}} at {{company}}
JD: {{jdText}}
Resume: {{resumeText}}

CRITICAL: Only score terms present in the provided text. Score=0 for absent terms.`,

    improve: `Suggest 3-5 specific resume improvements for this job.

JD: {{jdText}}
Resume: {{resumeText}}

Return JSON with suggestions array, missingKeywords array, estimatedNewScore number.`,

    skillpath: `Create a fast upskilling plan (≤20h total, each skill ≤6h).

JD: {{jdText}}
Current: {{currentSkills}}
Missing: {{missingSkills}}

Return JSON with skills array, totalHours number, talkTrack string.`,

    persona: `Analyze this person's communication style.

Type: {{personType}}
Name: {{personName}}
LinkedIn: {{linkedinUrl}}

Return JSON with name, title, techDepth, summary, persona.`,

    compare: `Compare two analysis versions.

Original: {{original}}
Updated: {{updated}}

Return JSON with improvements array, regressions array, unchanged array, recommendation string.`,
  };

  return defaults[kind] || `Analyze {{jdText}} and {{resumeText}}`;
}

/**
 * List available prompt versions for a kind
 */
export function listPromptVersions(kind: PromptKind): string[] {
  const promptsDir = path.join(process.cwd(), 'core/ai/prompts');
  
  try {
    if (!fs.existsSync(promptsDir)) {
      return ['v1'];
    }

    const files = fs.readdirSync(promptsDir);
    const versions = files
      .filter(f => f.startsWith(`${kind}.`) && f.endsWith('.md'))
      .map(f => f.replace(`${kind}.`, '').replace('.md', ''));
    
    return versions.length > 0 ? versions : ['v1'];
  } catch (error) {
    return ['v1'];
  }
}

/**
 * Validate that prompt template has required placeholders
 */
export function validatePromptTemplate(template: string, requiredVars: string[]): {
  valid: boolean;
  missingVars: string[];
} {
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    const placeholder = `{{${varName}}}`;
    if (!template.includes(placeholder)) {
      missingVars.push(varName);
    }
  }

  return {
    valid: missingVars.length === 0,
    missingVars,
  };
}

