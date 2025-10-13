'use client';

import { AlertTriangle } from 'lucide-react';

interface SkillLevel {
  skill: string;
  jdLevel: number; // 0-100
  resumeLevel: number; // 0-100
  fullProfileLevel: number; // 0-100 (includes notes, coach data)
}

interface SkillThreeLevelChartProps {
  skills: SkillLevel[];
  maxSkills?: number;
}

export default function SkillThreeLevelChart({ skills, maxSkills = 8 }: SkillThreeLevelChartProps) {
  const displaySkills = skills.slice(0, maxSkills);

  const renderBar = (level: number, color: string, label: string) => {
    return (
      <div className="flex items-center gap-2 mb-1">
        <div className="w-24 text-xs text-gray-600 text-right">{label}:</div>
        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500 flex items-center justify-end pr-2`}
            style={{ width: `${level}%` }}
          >
            {level > 15 && (
              <span className="text-xs font-semibold text-white">{level}%</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="skill-three-level-chart">
      {displaySkills.map((skill) => {
        const hasHiddenStrength = skill.fullProfileLevel > skill.resumeLevel + 10;
        const resumeGap = skill.fullProfileLevel - skill.resumeLevel;

        return (
          <div key={skill.skill} className="pb-4 border-b border-gray-100 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">{skill.skill}</h4>
              {hasHiddenStrength && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Update Resume (+{resumeGap}%)
                </span>
              )}
            </div>

            {renderBar(skill.jdLevel, 'bg-blue-500', 'JD Wants')}
            {renderBar(skill.resumeLevel, 'bg-green-500', 'Resume Shows')}
            {renderBar(skill.fullProfileLevel, 'bg-purple-500', 'You Have')}

            {hasHiddenStrength && (
              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">
                💡 Hidden Strength: You have this skill but it&apos;s not prominent in your resume. 
                Consider adding specific examples or moving it higher in your resume.
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="pt-4 border-t border-gray-200">
        <h5 className="text-xs font-semibold text-gray-700 mb-2">Legend:</h5>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">JD Requirement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">On Resume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-gray-600">Full Profile</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">
          Full Profile includes resume + notes + Coach Mode data. Purple bars show your complete skill set.
        </p>
      </div>
    </div>
  );
}

