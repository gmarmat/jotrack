/**
 * AI Model Pricing Utility
 * 
 * Centralized pricing calculations based on Anthropic pricing (Jan 2025)
 * See ANTHROPIC_PRICING_2025.md for complete pricing tables
 */

export interface ModelPricing {
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  modelName: string;
  provider: 'claude' | 'openai';
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude Models (Anthropic)
  'claude-3-5-sonnet-20241022': {
    inputPricePerMTok: 3,
    outputPricePerMTok: 15,
    modelName: 'Claude Sonnet 4.5',
    provider: 'claude'
  },
  'claude-3-5-haiku-20241022': {
    inputPricePerMTok: 1,
    outputPricePerMTok: 5,
    modelName: 'Claude Haiku 4.5',
    provider: 'claude'
  },
  'claude-3-5-sonnet-20240620': {
    inputPricePerMTok: 3,
    outputPricePerMTok: 15,
    modelName: 'Claude Sonnet 3.7',
    provider: 'claude'
  },
  'claude-3-5-haiku-20241022': {
    inputPricePerMTok: 0.80,
    outputPricePerMTok: 4,
    modelName: 'Claude Haiku 3.5',
    provider: 'claude'
  },
  'claude-3-opus-20240229': {
    inputPricePerMTok: 15,
    outputPricePerMTok: 75,
    modelName: 'Claude Opus 4',
    provider: 'claude'
  },
  
  // OpenAI Models (legacy support)
  'gpt-4o': {
    inputPricePerMTok: 2.50,
    outputPricePerMTok: 10,
    modelName: 'GPT-4o',
    provider: 'openai'
  },
  'gpt-4o-mini': {
    inputPricePerMTok: 0.15,
    outputPricePerMTok: 0.60,
    modelName: 'GPT-4o-mini',
    provider: 'openai'
  }
};

/**
 * Calculate cost for a given model and token usage
 */
export function calculateCost(
  model: string, 
  inputTokens: number, 
  outputTokens: number = 0
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    console.warn(`Unknown model: ${model}, using default pricing`);
    return (inputTokens / 1000000) * 3 + (outputTokens / 1000000) * 15;
  }
  
  const inputCost = (inputTokens / 1000000) * pricing.inputPricePerMTok;
  const outputCost = (outputTokens / 1000000) * pricing.outputPricePerMTok;
  
  return inputCost + outputCost;
}

/**
 * Get estimated cost for a typical job analysis
 * Based on average token usage patterns in JoTrack
 */
export function getEstimatedJobCost(model: string): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return 0.03; // Default fallback
  }
  
  // Typical job analysis: ~15K input tokens, ~2K output tokens
  const typicalInputTokens = 15000;
  const typicalOutputTokens = 2000;
  
  return calculateCost(model, typicalInputTokens, typicalOutputTokens);
}

/**
 * Get cost per 1M tokens for display
 */
export function getCostPerMTok(model: string): { input: number; output: number } {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return { input: 3, output: 15 }; // Default fallback
  }
  
  return {
    input: pricing.inputPricePerMTok,
    output: pricing.outputPricePerMTok
  };
}

/**
 * Get model display name
 */
export function getModelDisplayName(model: string): string {
  const pricing = MODEL_PRICING[model];
  return pricing?.modelName || model;
}

/**
 * Get all available models for a provider
 */
export function getModelsForProvider(provider: 'claude' | 'openai'): string[] {
  return Object.keys(MODEL_PRICING).filter(model => 
    MODEL_PRICING[model].provider === provider
  );
}

/**
 * Get recommended model for cost/performance balance
 */
export function getRecommendedModel(provider: 'claude' | 'openai'): string {
  if (provider === 'claude') {
    return 'claude-3-5-sonnet-20241022'; // Claude Sonnet 4.5 - best balance
  } else {
    return 'gpt-4o-mini'; // Cheapest OpenAI option
  }
}

/**
 * Calculate monthly cost estimate for a user
 */
export function calculateMonthlyCost(
  model: string, 
  jobsPerMonth: number = 15
): number {
  const jobCost = getEstimatedJobCost(model);
  return jobCost * jobsPerMonth;
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Get cost comparison between models
 */
export function getCostComparison(models: string[]): Array<{
  model: string;
  displayName: string;
  jobCost: number;
  monthlyCost: number;
}> {
  return models.map(model => ({
    model,
    displayName: getModelDisplayName(model),
    jobCost: getEstimatedJobCost(model),
    monthlyCost: calculateMonthlyCost(model)
  }));
}
