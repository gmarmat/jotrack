'use client';

import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState, ReactNode } from 'react';

interface ExplanationSectionProps {
  title: string; // e.g., "How We Calculate Match Score"
  children: ReactNode; // Content when expanded
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Reusable explanation section component
 * Follows UI_EXPLANATION_SECTIONS_GUIDE.md standard
 * 
 * Usage:
 * <ExplanationSection title="How We Calculate Match Score">
 *   <p>Overview paragraph...</p>
 *   <div>
 *     <p className="font-medium mb-1">Our Methodology:</p>
 *     <ul>...</ul>
 *   </div>
 * </ExplanationSection>
 */
export default function ExplanationSection({ 
  title, 
  children, 
  defaultExpanded = false,
  className = ''
}: ExplanationSectionProps) {
  const [showExplain, setShowExplain] = useState(defaultExpanded);

  return (
    <div className={`mb-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <button
        onClick={() => setShowExplain(!showExplain)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
        aria-expanded={showExplain}
        aria-label={showExplain ? 'Collapse explanation' : 'Expand explanation'}
      >
        <div className="flex items-center gap-2">
          <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </span>
        </div>
        {showExplain ? (
          <ChevronUp size={16} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-600 dark:text-gray-400 flex-shrink-0" />
        )}
      </button>
      
      {showExplain && (
        <div className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

