"use client";

import { useState } from 'react';
import { Linkedin, TrendingUp, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface LinkedInOptimization {
  headline: {
    current: string;
    optimized: string;
    changes: string[];
    keywords: string[];
    atsScore: number;
  };
  about: {
    current: string;
    optimized: string;
    keyChanges: string[];
    keywordsAdded: string[];
    atsScore: number;
  };
  skills: {
    current: string[];
    toAdd: string[];
    toRemove: string[];
    reorderedTop10: string[];
  };
  atsOptimization: {
    currentAtsScore: number;
    optimizedAtsScore: number;
    improvement: number;
  };
  quickWins: Array<{
    action: string;
    impact: string;
    time: string;
    priority: string;
  }>;
}

interface LinkedInOptimizationCardProps {
  optimization: LinkedInOptimization | null;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function LinkedInOptimizationCard({
  optimization,
  onGenerate,
  isGenerating
}: LinkedInOptimizationCardProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quickWins']));

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!optimization) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mb-4">
            <Linkedin size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Optimize Your LinkedIn Profile
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get ATS-optimized recommendations for your headline, about section, skills, and experience bullets.
          </p>
          
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Analyzing...
              </>
            ) : (
              <>
                <Linkedin size={20} />
                Optimize LinkedIn Profile
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Linkedin size={20} className="text-blue-600 dark:text-blue-400" />
          LinkedIn Optimization
        </h3>
        
        {/* ATS Score Improvement */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span className="font-bold">+{optimization.atsOptimization.improvement} ATS Points</span>
          </div>
          <p className="text-xs opacity-90 text-center">
            {optimization.atsOptimization.currentAtsScore} → {optimization.atsOptimization.optimizedAtsScore}
          </p>
        </div>
      </div>

      {/* Quick Wins (Always Expanded) */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          ⚡ Quick Wins (Do These First!)
        </h4>
        <div className="space-y-2">
          {optimization.quickWins.map((win, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{win.action}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>💰 {win.impact}</span>
                  <span>⏱️ {win.time}</span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    win.priority === 'immediate' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {win.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Headline Optimization */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('headline')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            📝 Headline Optimization
          </h4>
          {expandedSections.has('headline') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {expandedSections.has('headline') && (
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {optimization.headline.current}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Optimized (ATS: {optimization.headline.atsScore})</p>
                <button
                  onClick={() => handleCopy(optimization.headline.optimized, 'headline')}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {copiedSection === 'headline' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedSection === 'headline' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 rounded-lg font-medium">
                {optimization.headline.optimized}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {optimization.headline.keywords.map((keyword, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('about')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            📄 About Section
          </h4>
          {expandedSections.has('about') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {expandedSections.has('about') && (
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Optimized (ATS: {optimization.about.atsScore})</p>
                <button
                  onClick={() => handleCopy(optimization.about.optimized, 'about')}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {copiedSection === 'about' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedSection === 'about' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg whitespace-pre-wrap max-h-96 overflow-y-auto">
                {optimization.about.optimized}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Key Changes:</p>
              <ul className="space-y-1">
                {optimization.about.keyChanges.map((change, idx) => (
                  <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('skills')}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            🎯 Skills Optimization
          </h4>
          {expandedSections.has('skills') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {expandedSections.has('skills') && (
          <div className="p-4 space-y-4">
            {optimization.skills.toAdd.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                  ➕ Skills to Add ({optimization.skills.toAdd.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {optimization.skills.toAdd.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-md">
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {optimization.skills.toRemove && optimization.skills.toRemove.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                  ➖ Skills to Remove ({optimization.skills.toRemove.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {optimization.skills.toRemove.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-md line-through">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {optimization.skills.reorderedTop10 && (
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                  🔝 Recommended Order (Top 10)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {optimization.skills.reorderedTop10.slice(0, 10).map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Regenerate Button */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Regenerating...' : '🔄 Regenerate Recommendations'}
        </button>
      </div>
    </div>
  );
}

