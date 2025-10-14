'use client';

import { Users, Sparkles, User } from 'lucide-react';
import { useState } from 'react';
import PromptViewer from './PromptViewer';

interface PersonProfile {
  name: string;
  role: string;
  linkedInUrl?: string | null;
  background: string[];
  expertise: string[];
  communicationStyle?: string;
  whatThisMeans: string;
}

interface PeopleProfilesCardProps {
  jobId: string;
  jobDescription: string;
  recruiterUrl?: string;
  peerUrls?: string[];
  skipLevelUrls?: string[];
  profiles: PersonProfile[] | null;
  overallInsights?: {
    teamDynamics: string;
    culturalFit: string;
    preparationTips: string[];
  };
  isAiPowered: boolean;
}

export default function PeopleProfilesCard({ 
  jobId,
  jobDescription,
  recruiterUrl = '',
  peerUrls = [],
  skipLevelUrls = [],
  profiles,
  overallInsights,
  isAiPowered 
}: PeopleProfilesCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localProfiles, setLocalProfiles] = useState<PersonProfile[] | null>(profiles);
  const [localInsights, setLocalInsights] = useState(overallInsights);
  const [error, setError] = useState<string | null>(null);

  // Default sample data
  const defaultProfiles: PersonProfile[] = [
    {
      name: 'Jane Doe',
      role: 'Recruiter',
      background: [
        '8+ years in tech recruiting',
        'Previously at Google and Stripe',
        'Specializes in senior engineering roles'
      ],
      expertise: ['Technical recruiting', 'Engineering talent', 'Startup hiring'],
      communicationStyle: 'Professional',
      whatThisMeans: 'Jane has deep technical knowledge, so be prepared to discuss technical details and system design. Emphasize your senior-level experience and architectural decisions.'
    },
    {
      name: 'John Smith',
      role: 'Hiring Manager',
      background: [
        'Engineering Director with 12+ years experience',
        'Previously CTO at FinTech startup',
        'Stanford CS, MIT MBA'
      ],
      expertise: ['System architecture', 'Team scaling', 'Fintech domain'],
      communicationStyle: 'Technical',
      whatThisMeans: 'John will likely focus on scalability, architecture decisions, and your experience building reliable financial systems. Prepare examples of handling high-stakes technical challenges.'
    }
  ];

  const defaultInsights = {
    teamDynamics: 'Small, senior engineering team (5-8 people) with strong fintech background. Emphasis on quality and reliability over speed.',
    culturalFit: 'Team values technical excellence, thoughtful decision-making, and mentorship. Good fit for candidates who prioritize code quality and system design.',
    preparationTips: [
      'Research fintech regulations and compliance challenges',
      'Prepare examples of scaling systems under regulatory constraints',
      'Ask about technical debt priorities and architectural vision',
      'Discuss mentorship approach (team seems to value knowledge sharing)',
      'Show interest in financial domain knowledge'
    ]
  };

  const displayProfiles = localProfiles || profiles || defaultProfiles;
  const displayInsights = localInsights || overallInsights || defaultInsights;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/people-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobDescription,
          recruiterUrl,
          peerUrls,
          skipLevelUrls,
          dryRun: !isAiPowered
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setLocalProfiles(data.profiles);
      setLocalInsights(data.overallInsights);
    } catch (err: any) {
      console.error('People analysis error:', err);
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="people-profiles-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          People Profiles
        </h3>
        
        <div className="flex items-center gap-2">
          {!isAiPowered && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Sample Data
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              data-testid="analyze-people-button"
            >
              <Sparkles size={14} className={isAnalyzing ? 'animate-pulse' : ''} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            <PromptViewer 
              promptKind="people" 
              version="v1"
              buttonLabel=""
              className="px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Individual Profiles */}
      <div className="space-y-4 mb-6">
        {displayProfiles.map((person, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <User size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">{person.name}</h4>
                <p className="text-xs text-gray-600">{person.role}</p>
              </div>
              {person.communicationStyle && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {person.communicationStyle}
                </span>
              )}
            </div>

            {/* Background */}
            {person.background.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Background:</p>
                <ul className="space-y-0.5">
                  {person.background.map((item, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expertise */}
            {person.expertise.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Expertise:</p>
                <div className="flex flex-wrap gap-1.5">
                  {person.expertise.map((skill, i) => (
                    <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* What This Means */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-purple-700 mb-1">💡 What this means for you:</p>
              <p className="text-xs text-gray-700 italic">{person.whatThisMeans}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Insights */}
      {displayInsights && (
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-1">Team Dynamics:</p>
            <p className="text-xs text-gray-700">{displayInsights.teamDynamics}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-900 mb-1">Cultural Fit:</p>
            <p className="text-xs text-gray-700">{displayInsights.culturalFit}</p>
          </div>

          {displayInsights.preparationTips && displayInsights.preparationTips.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-2">Preparation Tips:</p>
              <ol className="list-decimal list-inside space-y-1">
                {displayInsights.preparationTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-gray-700">{tip}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Why This Matters (always expanded) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600">
          Understanding the people you&apos;ll interview with helps you tailor your communication style,
          prepare relevant questions, and build rapport based on their background and interests.
        </p>
      </div>
    </div>
  );
}

