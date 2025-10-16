// v2.7: Prompt executor for analysis sections
// Loads prompts from /prompts/*.md and executes with variants

import { promises as fs } from 'fs';
import path from 'path';
import { getVariant } from '@/lib/extraction/extractionEngine';
import { getAiProviderConfig } from '@/lib/coach/aiProvider';
import type { SourceType } from '@/db/schema';

export interface PromptExecutionParams {
  promptName: string; // e.g., 'matchScore', 'company', 'userProfile'
  promptVersion?: string; // e.g., 'v1', defaults to 'v1'
  variables: Record<string, any>; // Variables to replace in prompt
  jobId: string;
}

export interface PromptExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  promptUsed?: string;
}

/**
 * Load a prompt template from /prompts directory
 */
export async function loadPrompt(name: string, version: string = 'v1'): Promise<string> {
  const promptPath = path.join(process.cwd(), 'prompts', `${name}.${version}.md`);
  
  try {
    const content = await fs.readFile(promptPath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Prompt not found: ${name}.${version}.md`);
  }
}

/**
 * Replace variables in prompt template
 * Supports: {{variableName}} syntax
 */
export function interpolatePrompt(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    const replacement = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    result = result.replace(pattern, replacement);
  }
  
  // Add current date if referenced
  result = result.replace(/{{currentDate}}/g, new Date().toISOString().split('T')[0]);
  result = result.replace(/{{timestamp}}/g, Date.now().toString());
  
  return result;
}

/**
 * Fetch ai_optimized variant for an attachment
 */
export async function fetchVariantForAnalysis(
  attachmentId: string,
  sourceType: SourceType
): Promise<any> {
  const variant = await getVariant(attachmentId, sourceType, 'ai_optimized');
  
  if (!variant) {
    throw new Error(`No ai_optimized variant found for ${sourceType}`);
  }
  
  return variant;
}

/**
 * Simple AI caller for analysis endpoints (bypasses coach mode)
 */
async function callAnalysisAi(prompt: string): Promise<{
  success: boolean;
  content?: string;
  tokensUsed?: number;
  cost?: number;
  error?: string;
}> {
  try {
    const config = await getAiProviderConfig();
    
    if (!config) {
      throw new Error('No API key configured. Go to Settings → AI & Privacy to add your OpenAI key.');
    }
    
    const { apiKey, model } = config;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career advisor and analyst. Follow the prompt instructions exactly and return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 8000, // Increased for large ecosystem responses
        response_format: { type: 'json_object' },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const usage = data.usage;
    
    // Calculate cost (gpt-4o-mini pricing)
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;
    const cost = (promptTokens * 0.00000015) + (completionTokens * 0.0000006); // $0.15/$0.60 per 1M tokens
    
    return {
      success: true,
      content,
      tokensUsed: totalTokens,
      cost,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'AI call failed',
    };
  }
}

/**
 * Execute a prompt with AI
 */
export async function executePrompt(params: PromptExecutionParams): Promise<PromptExecutionResult> {
  try {
    // 1. Load prompt template
    const template = await loadPrompt(params.promptName, params.promptVersion || 'v1');
    
    // 2. Interpolate variables
    const prompt = interpolatePrompt(template, params.variables);
    
    // 3. Call AI
    console.log(`🤖 Executing prompt: ${params.promptName}.${params.promptVersion || 'v1'}`);
    
    const response = await callAnalysisAi(prompt);
    
    if (!response.success || !response.content) {
      throw new Error(response.error || 'AI call failed');
    }
    
    // 4. Parse JSON response
    let data: any;
    try {
      // Try to extract JSON from markdown code blocks if present
      const content = response.content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      data = JSON.parse(jsonStr);
    } catch (parseError: any) {
      console.error('Failed to parse AI response as JSON:');
      console.error('Parse error:', parseError.message);
      console.error('Response length:', response.content?.length);
      console.error('Last 500 chars:', response.content?.slice(-500));
      throw new Error(`AI returned invalid JSON: ${parseError.message}. Response may be truncated (increase max_tokens).`);
    }
    
    // 5. Return with real usage data
    const tokensUsed = response.tokensUsed || 0;
    const cost = response.cost || 0;
    
    console.log(`✅ Prompt executed: ${tokensUsed} tokens, $${cost.toFixed(4)}`);
    
    return {
      success: true,
      data,
      tokensUsed,
      cost,
      promptUsed: params.promptName,
    };
  } catch (error: any) {
    console.error(`❌ Prompt execution failed:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Helper to get resume and JD variants for analysis
 */
export async function getJobAnalysisVariants(jobId: string): Promise<{
  resumeVariant: any;
  jdVariant: any;
  resumeAttachmentId: string;
  jdAttachmentId: string;
}> {
  const { db } = await import('@/db/client');
  const { attachments } = await import('@/db/schema');
  const { eq, and, isNull } = await import('drizzle-orm');
  
  // Get active resume and JD attachments
  const activeAttachments = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.jobId, jobId),
        eq(attachments.isActive, true),
        isNull(attachments.deletedAt)
      )
    );
  
  const resumeAtt = activeAttachments.find(a => a.kind === 'resume');
  const jdAtt = activeAttachments.find(a => a.kind === 'jd');
  
  if (!resumeAtt || !jdAtt) {
    throw new Error('Missing required documents: Resume and JD must be uploaded and active');
  }
  
  // Fetch variants (check any source_type for backward compatibility)
  const resumeVariant = await getVariant(resumeAtt.id, 'resume', 'ai_optimized') || 
                        await getVariant(resumeAtt.id, 'attachment', 'ai_optimized');
  const jdVariant = await getVariant(jdAtt.id, 'job_description', 'ai_optimized') ||
                    await getVariant(jdAtt.id, 'attachment', 'ai_optimized');
  
  if (!resumeVariant || !jdVariant) {
    throw new Error('AI-optimized variants not found. Click "Refresh Data" first to extract variants (~$0.02)');
  }
  
  return {
    resumeVariant,
    jdVariant,
    resumeAttachmentId: resumeAtt.id,
    jdAttachmentId: jdAtt.id,
  };
}

