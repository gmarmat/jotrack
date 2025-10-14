'use client';

import { useState } from 'react';

interface Skill {
  term: string;
  jdCount: number;
  resumeCount: number;
  fullProfileCount?: number;
}

interface SkillsMatchChartProps {
  skills: Skill[];
  maxSkills?: number;
}

export default function SkillsMatchChart({ skills, maxSkills = 10 }: SkillsMatchChartProps) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  
  const topSkills = skills.slice(0, maxSkills);
  const maxCount = Math.max(...topSkills.flatMap(s => [
    s.jdCount, 
    s.resumeCount, 
    s.fullProfileCount || 0
  ]));

  const getGapStatus = (skill: Skill) => {
    const hasGap = skill.jdCount > (skill.resumeCount + (skill.fullProfileCount || 0));
    const resumeProficiency = (skill.resumeCount / skill.jdCount) * 100;
    
    if (hasGap) {
      if (resumeProficiency < 50) return 'critical';
      if (resumeProficiency < 80) return 'moderate';
    }
    return 'good';
  };

  return (
    <div className="space-y-3" data-testid="skills-match-chart">
      {topSkills.map((skill, index) => {
        const gapStatus = getGapStatus(skill);
        const jdWidth = (skill.jdCount / maxCount) * 100;
        const resumeWidth = (skill.resumeCount / maxCount) * 100;
        const profileWidth = ((skill.fullProfileCount || 0) / maxCount) * 100;
        
        return (
          <div 
            key={index} 
            className="space-y-1 group"
            onMouseEnter={() => setHoveredSkill(skill.term)}
            onMouseLeave={() => setHoveredSkill(null)}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{skill.term}</span>
                {gapStatus === 'critical' && (
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                    Gap!
                  </span>
                )}
                {gapStatus === 'moderate' && (
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                    Weak
                  </span>
                )}
              </div>
              {hoveredSkill === skill.term && (
                <span className="text-xs text-gray-600 animate-fade-in">
                  JD: {skill.jdCount} | Resume: {skill.resumeCount} | Profile: {skill.fullProfileCount || 0}
                </span>
              )}
            </div>
            
            {/* Stacked 3-Color Bar */}
            <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
              {/* Background grid for reference */}
              <div className="absolute inset-0 flex">
                {[20, 40, 60, 80].map(mark => (
                  <div 
                    key={mark} 
                    className="absolute h-full w-px bg-gray-300 opacity-30"
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>
              
              {/* JD Required (Blue) - Bottom layer */}
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 opacity-30 transition-all duration-500"
                style={{ width: `${jdWidth}%` }}
                title={`Required by JD: ${skill.jdCount}`}
              />
              
              {/* Resume (Green) - Middle layer */}
              <div
                className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                style={{ width: `${resumeWidth}%` }}
                title={`In Resume: ${skill.resumeCount}`}
              />
              
              {/* Full Profile (Purple) - Top layer */}
              {skill.fullProfileCount && skill.fullProfileCount > 0 && (
                <div
                  className="absolute left-0 top-0 h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${profileWidth}%` }}
                  title={`Full Profile: ${skill.fullProfileCount}`}
                />
              )}
              
              {/* Labels inside bar */}
              <div className="relative h-full flex items-center px-2 text-xs font-medium text-white">
                {resumeWidth > 15 && (
                  <span className="relative z-10">{skill.resumeCount}</span>
                )}
              </div>
            </div>
            
            {/* Proficiency indicator */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="flex-1 flex items-center gap-1">
                {gapStatus === 'good' && (
                  <span className="text-green-600">✓ Strong match</span>
                )}
                {gapStatus === 'moderate' && (
                  <span className="text-orange-600">⚠ Could improve</span>
                )}
                {gapStatus === 'critical' && (
                  <span className="text-red-600">✗ Significant gap</span>
                )}
              </div>
              <span>
                {Math.round((skill.resumeCount / skill.jdCount) * 100)}% covered
              </span>
            </div>
          </div>
        );
      })}
      
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600 pt-3 border-t mt-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 opacity-30 rounded"></div>
          <span>JD Required</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Your Resume</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Full Profile</span>
        </div>
      </div>
    </div>
  );
}
