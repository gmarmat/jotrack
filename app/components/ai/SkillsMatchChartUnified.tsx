'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface Skill {
  term: string;
  jdCount: number;
  resumeCount: number;
  fullProfileCount?: number;
}

interface CategoryScore {
  name: string;
  jdRequired: number;
  resumeCoverage: number;
  profileBonus: number;
  totalScore: number;
}

interface SkillsMatchChartUnifiedProps {
  skills: Skill[];
  categoryScores?: CategoryScore[];
  maxKeywords?: number;
}

export default function SkillsMatchChartUnified({ 
  skills, 
  categoryScores,
  maxKeywords = 50 
}: SkillsMatchChartUnifiedProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<Skill | null>(null);

  // Default category scores if not provided
  const defaultCategories: CategoryScore[] = categoryScores || [
    {
      name: 'Technical Skills & Expertise',
      jdRequired: 100,
      resumeCoverage: 65,
      profileBonus: 20,
      totalScore: 85,
    },
    {
      name: 'Relevant Experience',
      jdRequired: 100,
      resumeCoverage: 70,
      profileBonus: 15,
      totalScore: 85,
    },
    {
      name: 'Domain Knowledge',
      jdRequired: 100,
      resumeCoverage: 55,
      profileBonus: 25,
      totalScore: 80,
    },
  ];

  // Get fit level for axis markers
  const getFitLevel = (score: number): string => {
    if (score >= 100) return 'Exceeds';
    if (score >= 75) return 'High Fit';
    if (score >= 40) return 'Med Fit';
    return 'Low Fit';
  };

  const getFitColor = (score: number): string => {
    if (score >= 100) return 'text-purple-600';
    if (score >= 75) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate keyword sizes based on importance (JD count)
  const maxJdCount = Math.max(...skills.map(s => s.jdCount), 1);
  const getKeywordSize = (jdCount: number): string => {
    const normalized = jdCount / maxJdCount;
    if (normalized >= 0.8) return 'text-2xl';
    if (normalized >= 0.6) return 'text-xl';
    if (normalized >= 0.4) return 'text-lg';
    if (normalized >= 0.2) return 'text-base';
    return 'text-sm';
  };

  // Get keyword color based on match status
  const getKeywordColor = (skill: Skill): string => {
    const total = skill.resumeCount + (skill.fullProfileCount || 0);
    if (total >= skill.jdCount) return 'text-green-600 hover:text-green-700';
    if (skill.fullProfileCount && skill.fullProfileCount > 0) return 'text-yellow-600 hover:text-yellow-700';
    return 'text-red-600 hover:text-red-700';
  };

  const getKeywordStatus = (skill: Skill): string => {
    const total = skill.resumeCount + (skill.fullProfileCount || 0);
    if (total >= skill.jdCount) return '✓ Have it';
    if (skill.fullProfileCount && skill.fullProfileCount > 0) return '◐ Partial/Profile';
    return '✗ Missing';
  };

  const topKeywords = skills.slice(0, maxKeywords);

  return (
    <div className="space-y-6" data-testid="skills-match-chart-unified">
      {/* Category-Level Bars */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Match by Category</h4>
        
        {defaultCategories.map((category, idx) => (
          <div 
            key={idx}
            className="space-y-1"
            onMouseEnter={() => setHoveredCategory(category.name)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            {/* Category name and score */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{category.name}</span>
              {hoveredCategory === category.name && (
                <span className="text-xs text-gray-600 animate-fade-in">
                  Resume: {category.resumeCoverage}% + Profile: +{category.profileBonus}% = {category.totalScore}%
                </span>
              )}
              <span className={`text-sm font-bold ${getFitColor(category.totalScore)}`}>
                {category.totalScore}%
              </span>
            </div>

            {/* Stacked bar with fit zones */}
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              {/* Fit level background zones */}
              <div className="absolute inset-0 flex">
                <div className="w-[40%] bg-red-50 border-r border-red-200"></div>
                <div className="w-[35%] bg-yellow-50 border-r border-yellow-200"></div>
                <div className="w-[25%] bg-green-50"></div>
              </div>
              
              {/* Fit level markers */}
              <div className="absolute inset-0 flex text-[10px] text-gray-400 pointer-events-none">
                <div className="w-[40%] flex items-center justify-center">Low Fit</div>
                <div className="w-[35%] flex items-center justify-center">Med Fit</div>
                <div className="w-[25%] flex items-center justify-center">High Fit</div>
              </div>

              {/* JD Required (light blue background) */}
              <div
                className="absolute left-0 top-0 h-full bg-blue-400 opacity-20"
                style={{ width: `${category.jdRequired}%` }}
                title={`JD Required: ${category.jdRequired}%`}
              />

              {/* Resume Coverage (green) */}
              <div
                className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                style={{ width: `${category.resumeCoverage}%` }}
                title={`Resume: ${category.resumeCoverage}%`}
              />

              {/* Profile Bonus (purple overlay - additive) */}
              {category.profileBonus > 0 && (
                <div
                  className="absolute top-0 h-full bg-purple-500 transition-all duration-500 opacity-80"
                  style={{ 
                    left: `${category.resumeCoverage}%`,
                    width: `${category.profileBonus}%` 
                  }}
                  title={`Profile Bonus: +${category.profileBonus}%`}
                />
              )}

              {/* Score label inside bar */}
              <div className="relative h-full flex items-center px-3">
                {category.totalScore > 15 && (
                  <span className="text-sm font-bold text-white drop-shadow relative z-10">
                    {category.totalScore}%
                  </span>
                )}
              </div>
            </div>

            {/* Fit level indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className={getFitColor(category.totalScore)}>
                {getFitLevel(category.totalScore)}
              </span>
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600 pt-2 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 opacity-20 rounded"></div>
            <span>JD Required</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Resume</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 opacity-80 rounded"></div>
            <span>Profile Bonus</span>
          </div>
        </div>
      </div>

      {/* Keyword-Level Word Cloud */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Keywords from Job Description</h4>
        
        <div className="flex flex-wrap gap-3 items-center justify-center p-4 bg-gray-50 rounded-lg min-h-[200px]">
          {topKeywords.map((skill, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedKeyword(skill)}
              className={`font-semibold transition-all cursor-pointer hover:scale-110 ${getKeywordSize(skill.jdCount)} ${getKeywordColor(skill)}`}
              title={`Click for details: ${skill.term}`}
            >
              {skill.term}
            </button>
          ))}
        </div>

        {/* Color legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Have it</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
            <span>Partial/Profile</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>Missing</span>
          </div>
          <div className="flex items-center gap-1">
            <Info size={12} />
            <span>Size = importance in JD</span>
          </div>
        </div>
      </div>

      {/* Keyword Detail Modal */}
      {selectedKeyword && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setSelectedKeyword(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedKeyword.term}</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${getKeywordColor(selectedKeyword)}`}>
                  {getKeywordStatus(selectedKeyword)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">JD Count:</span>
                <span className="font-medium text-gray-900">{selectedKeyword.jdCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Resume Count:</span>
                <span className="font-medium text-gray-900">{selectedKeyword.resumeCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Profile Count:</span>
                <span className="font-medium text-gray-900">{selectedKeyword.fullProfileCount || 0}</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Match:</span>
                  <span className="font-bold text-purple-600">
                    {selectedKeyword.resumeCount + (selectedKeyword.fullProfileCount || 0)} / {selectedKeyword.jdCount}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedKeyword(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

