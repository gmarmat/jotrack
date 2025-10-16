'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, ReactNode } from 'react';

interface AnalysisExplanationProps {
  children: ReactNode; // Explanation content
  defaultExpanded?: boolean;
}

/**
 * Standardized "Explain our Analysis" component
 * Used across all analysis sections (Match Matrix, Ecosystem, etc.)
 * 
 * Pattern:
 * - Always 2nd last position (before "Why this matters")
 * - Outside table borders
 * - Collapsible with blue background
 * - Matches Match Matrix style
 * 
 * Usage:
 * <AnalysisExplanation>
 *   <p>Overview...</p>
 *   <div>
 *     <p className="font-semibold mb-2">Our Methodology:</p>
 *     <ul>...</ul>
 *   </div>
 * </AnalysisExplanation>
 */
export default function AnalysisExplanation({ 
  children, 
  defaultExpanded = false 
}: AnalysisExplanationProps) {
  const [showExplain, setShowExplain] = useState(defaultExpanded);

  return (
    <>
      <button
        onClick={() => setShowExplain(!showExplain)}
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 mt-4"
        data-testid="analysis-explain"
      >
        {showExplain ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span>Explain: Our analysis approach</span>
      </button>

      {showExplain && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
            {children}
          </div>
        </div>
      )}
    </>
  );
}

