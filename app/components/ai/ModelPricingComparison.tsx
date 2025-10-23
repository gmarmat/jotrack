'use client';

import { useState } from 'react';
import { Check, DollarSign, Clock, Zap } from 'lucide-react';
import { useModelComparison } from '@/lib/hooks/usePricing';

interface ModelPricingComparisonProps {
  onModelSelect?: (model: string) => void;
  selectedModel?: string;
  className?: string;
}

export default function ModelPricingComparison({ 
  onModelSelect, 
  selectedModel,
  className = '' 
}: ModelPricingComparisonProps) {
  const [showComparison, setShowComparison] = useState(false);
  
  // Available models for comparison
  const availableModels = [
    'claude-3-5-sonnet-20241022', // Claude Sonnet 4.5
    'claude-3-5-haiku-20241022',  // Claude Haiku 4.5
    'claude-3-5-sonnet-20240620', // Claude Sonnet 3.7
    'claude-3-5-haiku-20241022',  // Claude Haiku 3.5
    'gpt-4o-mini'                 // GPT-4o-mini
  ];
  
  const { comparison, selectedModel: currentModel, setSelectedModel } = useModelComparison(availableModels);
  
  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    onModelSelect?.(model);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setShowComparison(!showComparison)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <DollarSign className="w-4 h-4" />
        {showComparison ? 'Hide' : 'Compare'} Model Pricing
      </button>

      {/* Comparison Table */}
      {showComparison && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">Model</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">Job Cost</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">Monthly Cost</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">Best For</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comparison.map((model) => (
                  <tr 
                    key={model.model}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentModel === model.model ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {model.displayName}
                        </span>
                        {currentModel === model.model && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {model.formattedJobCost}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {model.formattedMonthlyCost}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {model.model.includes('sonnet') && (
                          <>
                            <Zap className="w-3 h-3 text-purple-600" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Complex analysis</span>
                          </>
                        )}
                        {model.model.includes('haiku') && (
                          <>
                            <Clock className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Fast & cheap</span>
                          </>
                        )}
                        {model.model.includes('gpt-4o') && (
                          <>
                            <DollarSign className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Budget option</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleModelSelect(model.model)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          currentModel === model.model
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        {currentModel === model.model ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                💡 <strong>Tip:</strong> Sonnet for complex analysis, Haiku for speed, GPT-4o-mini for budget
              </span>
              <span>
                See <a href="/ANTHROPIC_PRICING_2025.md" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">pricing details</a>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
