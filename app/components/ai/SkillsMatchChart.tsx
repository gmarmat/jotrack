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

      {/* Compact Keyword Nodes Graph */}
      {topKeywords.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Keyword Match</h4>
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Info size={14} />
              <span>Size = JD importance | Color = match status</span>
            </div>
          </div>

          {/* Compact Nodes Graph */}
          <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
            {/* CSS Animations - Optimized for performance */}
            <style jsx>{`
              @keyframes float-0 {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
              }
              @keyframes float-1 {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-2px); }
              }
              @keyframes float-2 {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
              }
              /* Performance optimization - use transform3d for GPU acceleration */
              .animate-float {
                will-change: transform;
                transform: translateZ(0);
              }
            `}</style>
            {/* SVG for connections and nodes */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 128">
              {/* Connection lines - connect similar keywords */}
              {topKeywords.slice(0, 12).map((skill, idx) => {
                const x = 30 + (idx % 6) * 60;
                const y = 30 + Math.floor(idx / 6) * 60;
                
                // Find similar keywords (same category or similar importance)
                const connections = topKeywords.slice(0, 12).slice(idx + 1).filter((otherSkill, otherIdx) => {
                  // Connect if similar importance level or same status
                  const similarImportance = Math.abs(skill.jdCount - otherSkill.jdCount) <= 2;
                  const sameStatus = (
                    (skill.resumeCount + (skill.fullProfileCount || 0) >= skill.jdCount) === 
                    (otherSkill.resumeCount + (otherSkill.fullProfileCount || 0) >= otherSkill.jdCount)
                  );
                  return similarImportance || sameStatus;
                }).slice(0, 2).map((otherSkill, otherIdx) => {
                  const otherX = 30 + ((idx + otherIdx + 1) % 6) * 60;
                  const otherY = 30 + Math.floor((idx + otherIdx + 1) / 6) * 60;
                  
                  return (
                    <line
                      key={`${idx}-${idx + otherIdx + 1}`}
                      x1={x}
                      y1={y}
                      x2={otherX}
                      y2={otherY}
                      stroke="rgba(156, 163, 175, 0.4)"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      className="animate-pulse"
                    />
                  );
                });
                
                return connections;
              })}

              {/* Animated nodes */}
              {topKeywords.slice(0, 12).map((skill, idx) => {
                const x = 30 + (idx % 6) * 60;
                const y = 30 + Math.floor(idx / 6) * 60;
                const size = Math.max(8, Math.min(20, 8 + (skill.jdCount / maxJdCount) * 12));
                
                return (
                  <g key={idx}>
                    {/* Node circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={size}
                      className={`animate-float cursor-pointer transition-all duration-300 hover:r-${size + 2} ${
                        skill.resumeCount + (skill.fullProfileCount || 0) >= skill.jdCount
                          ? 'fill-green-500'
                          : skill.fullProfileCount && skill.fullProfileCount > 0
                          ? 'fill-yellow-500'
                          : 'fill-red-500'
                      }`}
                      style={{
                        animation: `float-${idx % 3} 3s ease-in-out infinite`,
                        animationDelay: `${idx * 0.2}s`
                      }}
                      onClick={() => setSelectedKeyword(skill)}
                    >
                      <title>{`${skill.term}: JD requires ${skill.jdCount}, You have ${skill.resumeCount} (resume) + ${skill.fullProfileCount || 0} (profile)`}</title>
                    </circle>
                    
                    {/* Node label */}
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      className="animate-float text-xs font-medium fill-gray-700 dark:fill-gray-300 pointer-events-none"
                      style={{
                        animation: `float-${idx % 3} 3s ease-in-out infinite`,
                        animationDelay: `${idx * 0.2}s`
                      }}
                    >
                      {skill.term.length > 8 ? skill.term.substring(0, 8) + '...' : skill.term}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Match</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Partial</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Missing</span>
              </div>
            </div>
          </div>

          {/* Selected keyword details */}
          {selectedKeyword && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedKeyword.term}</div>
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Status:</span> {getKeywordStatus(selectedKeyword)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs space-y-0.5">
                    <div>• JD requires: {selectedKeyword.jdCount} mentions</div>
                    <div>• Resume has: {selectedKeyword.resumeCount} mentions</div>
                    {selectedKeyword.fullProfileCount !== undefined && (
                      <div>• Full profile has: {selectedKeyword.fullProfileCount} additional mentions</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKeyword(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
