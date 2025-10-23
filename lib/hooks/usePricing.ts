/**
 * React hook for dynamic AI pricing
 * 
 * Provides real-time cost calculations that update when the user changes models
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  getEstimatedJobCost, 
  getModelDisplayName, 
  formatCost, 
  calculateMonthlyCost,
  getCostPerMTok,
  type ModelPricing
} from '@/lib/pricing';

interface PricingState {
  model: string;
  provider: 'claude' | 'openai';
  jobCost: number;
  monthlyCost: number;
  displayName: string;
  costPerMTok: { input: number; output: number };
}

export function usePricing(initialModel?: string, initialProvider?: 'claude' | 'openai') {
  const [model, setModel] = useState(initialModel || 'claude-3-5-sonnet-20241022');
  const [provider, setProvider] = useState(initialProvider || 'claude');
  
  // Calculate pricing based on current model
  const pricing = useMemo((): PricingState => {
    const jobCost = getEstimatedJobCost(model);
    const monthlyCost = calculateMonthlyCost(model);
    const displayName = getModelDisplayName(model);
    const costPerMTok = getCostPerMTok(model);
    
    return {
      model,
      provider,
      jobCost,
      monthlyCost,
      displayName,
      costPerMTok
    };
  }, [model, provider]);

  // Update model and recalculate pricing
  const updateModel = (newModel: string, newProvider?: 'claude' | 'openai') => {
    setModel(newModel);
    if (newProvider) {
      setProvider(newProvider);
    }
  };

  // Format cost for display
  const formatJobCost = () => formatCost(pricing.jobCost);
  const formatMonthlyCost = () => formatCost(pricing.monthlyCost);
  
  // Get cost breakdown for display
  const getCostBreakdown = () => ({
    jobCost: formatJobCost(),
    monthlyCost: formatMonthlyCost(),
    displayName: pricing.displayName,
    costPerMTok: pricing.costPerMTok
  });

  return {
    ...pricing,
    updateModel,
    formatJobCost,
    formatMonthlyCost,
    getCostBreakdown
  };
}

/**
 * Hook for model comparison
 */
export function useModelComparison(models: string[]) {
  const [selectedModel, setSelectedModel] = useState(models[0]);
  
  const comparison = useMemo(() => {
    return models.map(model => {
      const jobCost = getEstimatedJobCost(model);
      const monthlyCost = calculateMonthlyCost(model);
      const displayName = getModelDisplayName(model);
      
      return {
        model,
        displayName,
        jobCost,
        monthlyCost,
        formattedJobCost: formatCost(jobCost),
        formattedMonthlyCost: formatCost(monthlyCost)
      };
    });
  }, [models]);
  
  const selectedPricing = comparison.find(c => c.model === selectedModel);
  
  return {
    comparison,
    selectedModel,
    selectedPricing,
    setSelectedModel
  };
}

/**
 * Hook for cost estimation with custom parameters
 */
export function useCostEstimation() {
  const [inputTokens, setInputTokens] = useState(15000);
  const [outputTokens, setOutputTokens] = useState(2000);
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
  
  const cost = useMemo(() => {
    const { calculateCost } = require('@/lib/pricing');
    return calculateCost(model, inputTokens, outputTokens);
  }, [model, inputTokens, outputTokens]);
  
  return {
    inputTokens,
    outputTokens,
    model,
    cost,
    formattedCost: formatCost(cost),
    setInputTokens,
    setOutputTokens,
    setModel
  };
}
