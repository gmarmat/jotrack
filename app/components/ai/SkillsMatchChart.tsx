'use client';

interface Skill {
  term: string;
  jdCount: number;
  resumeCount: number;
}

interface SkillsMatchChartProps {
  skills: Skill[];
  maxSkills?: number;
}

export default function SkillsMatchChart({ skills, maxSkills = 10 }: SkillsMatchChartProps) {
  const topSkills = skills.slice(0, maxSkills);
  const maxCount = Math.max(...topSkills.flatMap(s => [s.jdCount, s.resumeCount]));

  return (
    <div className="space-y-3" data-testid="skills-match-chart">
      {topSkills.map((skill, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-900">{skill.term}</span>
            <span className="text-xs text-gray-500">
              JD: {skill.jdCount} | Resume: {skill.resumeCount}
            </span>
          </div>
          
          <div className="flex gap-2">
            {/* JD bar */}
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(skill.jdCount / maxCount) * 100}%` }}
              />
            </div>
            
            {/* Resume bar */}
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(skill.resumeCount / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600 pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Job Description</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Your Resume</span>
        </div>
      </div>
    </div>
  );
}
