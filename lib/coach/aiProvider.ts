/**
 * AI Provider utilities for Coach Mode
 * Handles BYOK (Bring Your Own Key) and dry-run modes
 */

import { db } from '@/db/client';
import { appSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import {
  extractVocabulary,
  generate25ParameterBreakdown,
  extractKeywordAnalysis,
} from './strictExtraction';
import { getRenderedPrompt } from '@/core/ai/promptLoader';

const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

// v1.3: Model allowlist for safety
// v2.7: Added o1-preview for advanced reasoning
// v2.8: Added Claude models
const ALLOWED_MODELS = [
  // OpenAI
  'gpt-4o-mini', 'gpt-4o', 'o1-preview', 'gpt-4-turbo', 'gpt-3.5-turbo',
  // Claude/Anthropic
  'claude-3-5-sonnet-20240620', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229',
  'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'
];

export interface AiSettings {
  networkEnabled: boolean;
  provider: string; // 'claude' or 'openai'
  // Claude settings
  claudeModel?: string;
  claudeKey?: string;
  // OpenAI settings
  openaiModel?: string;
  openaiKey?: string;
  // Tavily settings
  tavilyKey?: string;
  // Legacy support
  model?: string;
  apiKey?: string;
}

export interface AiError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

export interface AiProviderConfig {
  provider: string;
  model: string;
  apiKey?: string;
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Get AI settings from database
 */
export async function getAiSettings(): Promise<AiSettings> {
  try {
    const result = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, 'ai_settings'))
      .limit(1);

    if (result.length === 0) {
      return {
        networkEnabled: false,
        provider: 'openai',
        model: 'gpt-4o',
      };
    }

    const encrypted = result[0].value;
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return {
      networkEnabled: false,
      provider: 'openai',
      model: 'gpt-4o',
    };
  }
}

/**
 * Save AI settings to database (encrypted)
 * IMPORTANT: Merges with existing settings to preserve all keys
 */
export async function saveAiSettings(newSettings: Partial<AiSettings>): Promise<void> {
  // Step 1: Load existing settings
  const existingSettings = await getAiSettings();
  
  // Step 2: Merge new settings with existing (preserves other keys!)
  const mergedSettings: AiSettings = {
    ...existingSettings,
    ...newSettings,
  };
  
  // Remove undefined values (don't overwrite with undefined)
  Object.keys(mergedSettings).forEach(key => {
    if ((mergedSettings as any)[key] === undefined) {
      delete (mergedSettings as any)[key];
    }
  });
  
  console.log('💾 Merging settings:', {
    existing: {
      hasClaudeKey: !!existingSettings.claudeKey,
      hasTavilyKey: !!existingSettings.tavilyKey,
      hasOpenaiKey: !!existingSettings.openaiKey,
    },
    new: {
      hasClaudeKey: !!newSettings.claudeKey,
      hasTavilyKey: !!newSettings.tavilyKey,
      hasOpenaiKey: !!newSettings.openaiKey,
    },
    merged: {
      hasClaudeKey: !!mergedSettings.claudeKey,
      hasTavilyKey: !!mergedSettings.tavilyKey,
      hasOpenaiKey: !!mergedSettings.openaiKey,
    },
  });
  
  // Step 3: Encrypt and save merged settings
  const encrypted = encrypt(JSON.stringify(mergedSettings));

  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, 'ai_settings'))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(appSettings)
      .set({ value: encrypted })
      .where(eq(appSettings.key, 'ai_settings'));
  } else {
    await db.insert(appSettings).values({
      key: 'ai_settings',
      value: encrypted,
    });
  }
  
  console.log('✅ Settings saved and merged successfully');
}

/**
 * Get AI provider configuration (with decrypted API key)
 */
export async function getAiProviderConfig(): Promise<AiProviderConfig | null> {
  const settings = await getAiSettings();

  if (!settings.networkEnabled) {
    return null;
  }

  // Get the appropriate API key based on provider
  let apiKey: string | undefined;
  let model: string | undefined;
  
  if (settings.provider === 'claude') {
    apiKey = settings.claudeKey || settings.apiKey; // Fallback to legacy
    model = settings.claudeModel || settings.model || 'claude-3-5-sonnet-20240620';
  } else {
    apiKey = settings.openaiKey || settings.apiKey; // Fallback to legacy
    model = settings.openaiModel || settings.model || 'gpt-4o-mini';
  }

  if (!apiKey) {
    return null;
  }

  return {
    provider: settings.provider,
    model,
    apiKey,
  };
}

/**
 * Redact PII from text before sending to AI
 */
export function redactPII(text: string): string {
  // Simple PII redaction - can be enhanced
  let redacted = text;

  // Redact email addresses
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

  // Redact phone numbers (basic patterns)
  redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  redacted = redacted.replace(/\(\d{3}\)\s*\d{3}[-.]?\d{4}/g, '[PHONE]');

  // Redact SSN patterns
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

  return redacted;
}

/**
 * Generate mock AI response for dry-run mode
 * v1.1: Uses strict extraction - NO HALLUCINATIONS
 */
export function generateDryRunResponse(capability: string, inputs: any): any {
  const timestamp = new Date().toISOString();

  switch (capability) {
    case 'company_profile':
      return {
        name: inputs.companyName || 'Sample Company',
        industry: 'Technology',
        subindustry: 'Software',
        principles: ['Innovation', 'Customer Focus', 'Collaboration'],
        hqCity: 'San Francisco',
        hqState: 'CA',
        hqCountry: 'USA',
        sizeBucket: '51-200',
        summary: 'A technology company focused on innovative solutions. [DRY RUN]',
      };

    case 'recruiter_profile':
      return {
        name: inputs.recruiterName || 'Sample Recruiter',
        title: 'Technical Recruiter',
        techDepth: 'medium',
        summary: 'Experienced recruiter with focus on technical roles. [DRY RUN]',
        persona: 'Professional and detail-oriented communicator.',
      };

    case 'fit_analysis':
      // v1.1: Strict extraction - ONLY analyze terms in sources
      const jdVocab = extractVocabulary(inputs.jobDescription || '');
      const resumeVocab = extractVocabulary(inputs.resume || '');
      
      // Generate 25-parameter breakdown with evidence
      const breakdown = generate25ParameterBreakdown(jdVocab, resumeVocab);
      
      // Calculate weighted overall score
      const overall = breakdown.reduce((sum, item) => sum + (item.weight * item.score), 0);
      const threshold = 0.75;
      
      // Determine score level
      let scoreLevel = 'Low';
      if (overall >= threshold) scoreLevel = 'Great';
      else if (overall >= threshold * 0.8) scoreLevel = 'Medium';
      
      // Extract keywords for heatmap
      const keywords = extractKeywordAnalysis(jdVocab, resumeVocab);
      
      return {
        fit: {
          overall: Math.round(overall * 100) / 100,
          threshold,
          breakdown,
        },
        keywords,
        profiles: [], // Will be populated by profile step
        sources: [],
        meta: {
          dryRun: true,
          timestamp,
          evidenceBased: true,
        },
      };

    case 'resume_improve':
      return {
        suggestions: [
          {
            section: 'Summary',
            current: 'Software engineer with experience',
            suggested: 'Software Engineer with 5+ years specializing in React and Node.js',
            reasoning: 'More specific and quantified',
          },
          {
            section: 'Experience',
            current: 'Built web applications',
            suggested: 'Architected and delivered 10+ production React applications serving 100K+ users',
            reasoning: 'Quantified impact',
          },
        ],
        missingKeywords: ['Kubernetes', 'GraphQL', 'CI/CD'],
        estimatedNewScore: 78,
      };

    case 'skill_path':
      return {
        skills: [
          {
            skill: 'Kubernetes',
            priority: 'high',
            estimatedHours: 6,
            resources: [
              {
                title: 'Kubernetes Basics',
                provider: 'YouTube',
                url: 'https://youtube.com/example',
                duration: 2,
              },
            ],
          },
          {
            skill: 'GraphQL',
            priority: 'medium',
            estimatedHours: 4,
            resources: [],
          },
        ],
        totalHours: 10,
        talkTrack: 'I\'m actively upskilling in Kubernetes and GraphQL to strengthen my backend expertise. [DRY RUN]',
      };

    default:
      return {
        message: `Dry run response for ${capability}`,
        timestamp,
        inputs,
      };
  }
}

/**
 * Call AI provider (or return dry-run mock)
 * v1.2: Uses versioned prompts, proper token tracking
 */
/**
 * Fetch available Claude models from Anthropic API
 */
async function fetchClaudeModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch Claude models:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.data?.map((m: any) => m.id) || [];
  } catch (error) {
    console.error('Error fetching Claude models:', error);
    return [];
  }
}

/**
 * v1.3: Validate model against allowlist with auto-recovery
 */
async function validateModel(model: string, config: AiProviderConfig): Promise<string> {
  // If model is in allowlist, use it
  if (ALLOWED_MODELS.includes(model)) {
    return model;
  }
  
  console.warn(`⚠️ Model "${model}" not in allowlist, attempting auto-recovery...`);
  
  // Auto-recovery for Claude models
  if (config.provider === 'claude' && model.startsWith('claude')) {
    console.log('🔍 Fetching latest Claude models from API...');
    const availableModels = await fetchClaudeModels(config.apiKey);
    
    if (availableModels.length > 0) {
      console.log(`📋 Found ${availableModels.length} Claude models:`, availableModels);
      
      // Try to find the best mid-tier model (priority order)
      const preferredModels = [
        'claude-3-5-sonnet-20240620',  // Best balance
        'claude-3-5-sonnet-20241022',  // Newer
        'claude-3-sonnet-20240229',    // Fallback
      ];
      
      for (const preferred of preferredModels) {
        if (availableModels.includes(preferred)) {
          console.log(`✅ Auto-selected model: ${preferred}`);
          
          // Update settings with corrected model
          const settings = await getAiSettings();
          await saveAiSettings({ ...settings, claudeModel: preferred });
          
          return preferred;
        }
      }
      
      // If none of preferred found, use first Sonnet model
      const sonnetModel = availableModels.find(m => m.includes('sonnet'));
      if (sonnetModel) {
        console.log(`✅ Auto-selected Sonnet model: ${sonnetModel}`);
        const settings = await getAiSettings();
        await saveAiSettings({ ...settings, claudeModel: sonnetModel });
        return sonnetModel;
      }
    }
  }
  
  // If auto-recovery fails, throw error with helpful message
  throw new Error(
    `Model "${model}" is not allowed. Supported models: ${ALLOWED_MODELS.join(', ')}`
  );
}

/**
 * v1.3: Create user-friendly error from AI error
 */
export function createAiError(code: string, message: string, retryable: boolean): AiError {
  const userMessages: Record<string, string> = {
    'rate_limit': 'You have made too many AI requests. Please wait a few minutes and try again.',
    'invalid_json': 'The AI returned an invalid response. Please try again.',
    'invalid_model': 'The selected AI model is not supported. Please choose a different model in Settings.',
    'api_error': 'There was an error communicating with the AI service. Please check your API key and try again.',
    'network_disabled': 'AI network is disabled. Please enable it in Settings to use remote AI features.',
    'no_api_key': 'No API key configured. Please add your API key in Settings.',
  };

  return {
    code,
    message,
    userMessage: userMessages[code] || 'An unexpected error occurred. Please try again.',
    retryable,
  };
}

export async function callAiProvider(
  capability: string,
  inputs: any,
  dryRun = false,
  promptVersion = 'v1'
): Promise<{ result: any; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  if (dryRun) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      result: generateDryRunResponse(capability, inputs),
      usage: undefined,
    };
  }

  const config = await getAiProviderConfig();

  if (!config) {
    const error = createAiError('network_disabled', 'AI network is disabled or API key is not configured', false);
    throw error;
  }

  // v1.3: Validate model with auto-recovery
  const validatedModel = await validateModel(config.model, config);
  config.model = validatedModel; // Use corrected model

  // Map capability to prompt kind
  const promptKind = mapCapabilityToPromptKind(capability);
  
  // Build prompt variables from inputs
  const variables = buildPromptVariables(capability, inputs);
  
  // Load and render prompt template
  const renderedPrompt = getRenderedPrompt(promptKind, variables, promptVersion);

  // Redact PII before sending (allowlist job posting domains)
  const redactedPrompt = redactPII(renderedPrompt);

  // Call AI provider based on configuration
  if (config.provider === 'claude') {
    // Claude/Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20240620',
        max_tokens: getMaxTokens(capability),
        messages: [
          {
            role: 'user',
            content: redactedPrompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      
      if (response.status === 429) {
        const error = createAiError('rate_limit', 'Claude rate limit exceeded', true);
        throw error;
      }
      
      const error = createAiError(
        'network_error',
        `Claude API error (${response.status}): ${errorText.slice(0, 200)}`,
        false
      );
      throw error;
    }

    const data = await response.json();
    let content = data.content[0].text;
    const usage = data.usage;

    // Strip markdown code blocks if present (Claude often wraps JSON in ```json ... ```)
    content = content.trim();
    if (content.startsWith('```')) {
      // Remove opening ```json or ``` and closing ```
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse Claude response:', content.slice(0, 500));
      const aiError = createAiError(
        'invalid_json',
        `Failed to parse Claude response as JSON: ${content.slice(0, 200)}`,
        true
      );
      throw aiError;
    }

    return {
      result,
      usage: usage ? {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
      } : undefined,
    };
  } else if (config.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a career coach assistant. Always return valid JSON matching the specified output contract. Only analyze terms explicitly present in provided documents.',
          },
          {
            role: 'user',
            content: redactedPrompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: getMaxTokens(capability),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // v1.3: Handle rate limit errors specially
      if (response.status === 429) {
        const error = createAiError('rate_limit', 'OpenAI rate limit exceeded', true);
        throw error;
      }
      
      const error = createAiError(
        'api_error',
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`,
        response.status >= 500 // 5xx errors are retryable
      );
      throw error;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const usage = data.usage;

    if (!content) {
      const error = createAiError('api_error', 'No response from OpenAI', true);
      throw error;
    }

    // v1.3: Improved JSON parsing with better error handling
    let result;
    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content.slice(0, 500));
      const aiError = createAiError(
        'invalid_json',
        `Failed to parse OpenAI response as JSON: ${content.slice(0, 200)}`,
        true
      );
      throw aiError;
    }

    // v1.3: Validate response structure
    if (!result.fit || typeof result.fit.overall !== 'number') {
      console.error('Invalid response structure:', JSON.stringify(result).slice(0, 500));
      const error = createAiError(
        'invalid_json',
        'AI response missing required fields',
        true
      );
      throw error;
    }

    return {
      result,
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : undefined,
    };
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

/**
 * Map capability name to prompt kind
 */
function mapCapabilityToPromptKind(capability: string): any {
  const mapping: Record<string, any> = {
    'fit_analysis': 'analyze',
    'resume_improve': 'improve',
    'skill_path': 'skillpath',
    'recruiter_profile': 'persona',
    'company_profile': 'persona',
    'compare_runs': 'compare',
    'people': 'people',
    'people-extract': 'people-extract',
    'interview-questions-recruiter': 'interview-questions-recruiter',
    'interview-questions-hiring-manager': 'interview-questions-hiring-manager',
    'interview-questions-peer': 'interview-questions-peer',
    'writing-style-evaluation': 'writing-style-evaluation',
    'talk-track-recruiter': 'talk-track-recruiter',
    'talk-track-hiring-manager': 'talk-track-hiring-manager',
    'talk-track-peer': 'talk-track-peer',
    'recommendations': 'recommendations',
  };

  return mapping[capability] || 'analyze';
}

/**
 * Build variables object for prompt template
 */
function buildPromptVariables(capability: string, inputs: any): any {
  const common = {
    jobTitle: inputs.jobTitle || inputs.title || 'Position',
    company: inputs.company || inputs.companyName || 'Company',
    jdText: inputs.jobDescription || inputs.jd || '',
    resumeText: inputs.resume || '',
    notesText: inputs.notes || '',
  };

  switch (capability) {
    case 'fit_analysis':
      return common;

    case 'resume_improve':
      return common;

    case 'skill_path':
      return {
        ...common,
        currentSkills: Array.isArray(inputs.currentSkills) 
          ? inputs.currentSkills.join(', ') 
          : inputs.currentSkills || '',
        missingSkills: Array.isArray(inputs.missingSkills)
          ? inputs.missingSkills.join(', ')
          : inputs.missingSkills || '',
      };

    case 'recruiter_profile':
    case 'company_profile':
      return {
        personType: capability === 'recruiter_profile' ? 'Recruiter' : 'Company',
        personName: inputs.recruiterName || inputs.companyName || '',
        linkedinUrl: inputs.linkedinUrl || '',
        context: inputs.context || common.jdText,
      };

    case 'compare_runs':
      return {
        original: JSON.stringify(inputs.original || {}, null, 2),
        updated: JSON.stringify(inputs.updated || {}, null, 2),
      };

    case 'people':
      return {
        jobDescription: inputs.jobDescription || '',
        peopleProfiles: inputs.peopleProfiles || '',
        recruiterUrl: inputs.recruiterUrl || '',
        peerUrls: inputs.peerUrls || '',
        skipLevelUrls: inputs.skipLevelUrls || '',
        additionalContext: inputs.additionalContext || '',
      };

    case 'people-extract':
      return {
        pastedText: inputs.pastedText || ''
      };

    case 'interview-questions-recruiter':
      return {
        companyName: inputs.companyName || 'Unknown Company',
        jobTitle: inputs.jobTitle || 'Unknown Role',
        jdSummary: inputs.jdSummary || ''
      };

    case 'interview-questions-hiring-manager':
      return {
        companyName: inputs.companyName || 'Unknown Company',
        jobTitle: inputs.jobTitle || 'Unknown Role',
        jobDescription: inputs.jobDescription || '',
        resumeSummary: inputs.resumeSummary || 'TBD'
      };

    case 'interview-questions-peer':
      return {
        companyName: inputs.companyName || 'Unknown Company',
        jobTitle: inputs.jobTitle || 'Unknown Role',
        jobDescription: inputs.jobDescription || '',
        technicalSkills: inputs.technicalSkills || 'General software engineering'
      };

    case 'writing-style-evaluation':
      return {
        jobDescription: inputs.jobDescription || '',
        discoveryResponses: inputs.discoveryResponses || '',
        resumeContent: inputs.resumeContent || ''
      };

    case 'talk-track-recruiter':
      return {
        companyName: inputs.companyName || 'Unknown Company',
        roleTitle: inputs.roleTitle || 'Unknown Role',
        interviewQuestion: inputs.interviewQuestion || '',
        jdKeyPoints: inputs.jdKeyPoints || '',
        resumeSummary: inputs.resumeSummary || '',
        writingStyleProfile: inputs.writingStyleProfile || '{}'
      };

    case 'talk-track-hiring-manager':
      return {
        companyName: inputs.companyName || 'Unknown Company',
        roleTitle: inputs.roleTitle || 'Unknown Role',
        interviewQuestion: inputs.interviewQuestion || '',
        jobDescription: inputs.jobDescription || '',
        resumeSummary: inputs.resumeSummary || '',
        writingStyleProfile: inputs.writingStyleProfile || '{}',
        teamContext: inputs.teamContext || 'Not available'
      };

    case 'talk-track-peer':
      return {
        companyName: inputs.companyName || 'Unknown Company',
        roleTitle: inputs.roleTitle || 'Unknown Role',
        interviewQuestion: inputs.interviewQuestion || '',
        technicalSkills: inputs.technicalSkills || 'General software engineering',
        resumeSummary: inputs.resumeSummary || '',
        writingStyleProfile: inputs.writingStyleProfile || '{}'
      };

    case 'recommendations':
      return {
        jobDescription: inputs.jobDescription || '',
        resumeSummary: inputs.resumeSummary || '',
        matchMatrixGaps: inputs.matchMatrixGaps || '',
        writingStyleProfile: inputs.writingStyleProfile || '{}',
        careerGoals: inputs.careerGoals || 'Not specified'
      };

    default:
      return common;
  }
}

/**
 * Get max tokens for capability (cost control)
 */
function getMaxTokens(capability: string): number {
  const limits: Record<string, number> = {
    'company_profile': 500,
    'recruiter_profile': 500,
    'fit_analysis': 2000,  // Needs more for 25 params
    'resume_improve': 1000,
    'skill_path': 800,
    'compare_runs': 600,
    'people-extract': 12000, // Large JSON response for extraction
    'people': 8000,         // Analysis with multiple profiles
    'interview-questions-recruiter': 2000,      // 10 questions with tips
    'interview-questions-hiring-manager': 3000, // 15 questions with STAR guidance
    'writing-style-evaluation': 4000, // Comprehensive writing analysis
    'interview-questions-peer': 3000,          // 12 questions with keyPoints
    'talk-track-recruiter': 2000,    // STAR answer + cheat sheet
    'talk-track-hiring-manager': 3000, // STAR answer + technical depth
    'talk-track-peer': 3000,         // STAR answer + deep technical prep
    'recommendations': 8000,         // Comprehensive recommendations (courses, projects, LinkedIn, prep)
  };

  return limits[capability] || 1000;
}

