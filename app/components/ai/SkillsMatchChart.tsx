'use client';

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

interface SkillsMatchChartProps {
  skills: Skill[];
  categoryScores?: CategoryScore[];
  maxSkills?: number;
  maxKeywords?: number;
}

export default function SkillsMatchChart({ 
  skills, 
  categoryScores,
  maxSkills = 10,
  maxKeywords = 50 
}: SkillsMatchChartProps) {

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

  // Calculate keyword sizes based on importance (JD count) - More compact sizes
  const maxJdCount = Math.max(...skills.map(s => s.jdCount), 1);
  const getKeywordSize = (jdCount: number): string => {
    const normalized = jdCount / maxJdCount;
    if (normalized >= 0.8) return 'text-lg';
    if (normalized >= 0.6) return 'text-base';
    if (normalized >= 0.4) return 'text-sm';
    if (normalized >= 0.2) return 'text-xs';
    return 'text-xs';
  };

  // Get keyword color based on match status
  const getKeywordColor = (skill: Skill): string => {
    const total = skill.resumeCount + (skill.fullProfileCount || 0);
    if (total >= skill.jdCount) return 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300';
    if (skill.fullProfileCount && skill.fullProfileCount > 0) return 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300';
    return 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300';
  };

  const getKeywordStatus = (skill: Skill): string => {
    const total = skill.resumeCount + (skill.fullProfileCount || 0);
    if (total >= skill.jdCount) return '✓ Have it';
    if (skill.fullProfileCount && skill.fullProfileCount > 0) return '◐ Partial/Profile';
    return '✗ Missing';
  };

  const topKeywords = skills.slice(0, maxKeywords);

  return (
    <div className="space-y-6" data-testid="skills-match-chart">
      {/* Category-Level Bars */}
      <div className="space-y-5">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Match by Category</h4>
        
        {defaultCategories.map((category, idx) => (
          <div 
            key={idx}
            className="space-y-2"
          >
            {/* Category name, breakdown, and total score */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Resume: {category.resumeCoverage}% + Profile: +{category.profileBonus}%
                </span>
              </div>
              <span className={`text-sm font-bold ${getFitColor(category.totalScore)}`}>
                {category.totalScore}%
              </span>
            </div>

            {/* 100% Stacked Bar with shadow effect */}
            <div className="relative">
              {/* Bar container with inner shadow for depth */}
              <div className="relative h-10 bg-gray-300/30 dark:bg-gray-600/20 rounded-lg overflow-hidden shadow-inner border border-gray-300 dark:border-gray-600">
                {/* Fit level background zones (subtle) */}
                <div className="absolute inset-0 flex opacity-20">
                  <div className="w-[40%] bg-red-100 dark:bg-red-900 border-r border-red-300 dark:border-red-700"></div>
                  <div className="w-[35%] bg-yellow-100 dark:bg-yellow-900 border-r border-yellow-300 dark:border-yellow-700"></div>
                  <div className="w-[25%] bg-green-100 dark:bg-green-900"></div>
                </div>
                
                {/* Resume Coverage (green) - 100% stacked */}
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-b from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 transition-all duration-500 border-r-2 border-green-700 dark:border-green-800"
                  style={{ width: `${category.resumeCoverage}%` }}
                  title={`Resume: ${category.resumeCoverage}%`}
                />

                {/* Profile Bonus (purple) - stacked on top of resume with pulse animation */}
                {category.profileBonus > 0 && (
                  <div
                    className="absolute top-0 h-full bg-gradient-to-b from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 transition-all duration-500 animate-pulse-bonus"
                    style={{ 
                      left: `${category.resumeCoverage}%`,
                      width: `${category.profileBonus}%` 
                    }}
                    title={`Profile Bonus: +${category.profileBonus}%`}
                  />
                )}
              </div>
            </div>

          </div>
        ))}

        {/* Unified Horizontal Axis (ONE for all 3 bars) */}
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
          <div className="relative">
            {/* Axis line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
            
            {/* Axis labels */}
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 pt-2">
              <span className="font-medium">Low Fit (0%)</span>
              <span className="font-medium">Med Fit (40-75%)</span>
              <span className="font-medium">High Fit (75%+)</span>
            </div>
          </div>

          {/* Unified Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 bg-gradient-to-b from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Resume</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 bg-gradient-to-b from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Profile Bonus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Keyword Word Cloud */}
      {topKeywords.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Keyword Match</h4>
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Info size={14} />
              <span>Size = JD importance | Color = match status</span>
            </div>
          </div>

          {/* Compact Word Cloud */}
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {topKeywords.slice(0, 20).map((skill, idx) => (
              <span
                key={idx}
                className={`${getKeywordSize(skill.jdCount)} ${getKeywordColor(skill)} font-medium transition-all hover:scale-105`}
                title={`${skill.term}: JD requires ${skill.jdCount}, You have ${skill.resumeCount} (resume) + ${skill.fullProfileCount || 0} (profile)`}
              >
                {skill.term}
              </span>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
