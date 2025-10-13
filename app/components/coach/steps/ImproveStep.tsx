'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, BookOpen, Loader2, Check } from 'lucide-react';

interface ImproveStepProps {
  jobId: string;
  data: any;
  onUpdate: (updates: any) => void;
  onBack: () => void;
}

export default function ImproveStep({ jobId, data, onUpdate, onBack }: ImproveStepProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'improve' | 'skillpath' | null>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [skillPath, setSkillPath] = useState<any>(null);
  const [iterationCount, setIterationCount] = useState(0);

  const handleImprove = async () => {
    setLoading(true);
    setMode('improve');

    try {
      const response = await fetch('/api/ai/analyze?dryRun=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          capability: 'resume_improve',
          inputs: {
            jobDescription: data.jobDescription,
            resume: data.resume,
          },
          promptVersion: 'v1',
        }),
      });

      const result = await response.json();
      setSuggestions(result.result);
      setIterationCount(prev => prev + 1);
    } catch (error) {
      console.error('Error getting improvement suggestions:', error);
      alert('Failed to get suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAnyway = async () => {
    setLoading(true);
    setMode('skillpath');

    try {
      const response = await fetch('/api/ai/analyze?dryRun=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          capability: 'skill_path',
          inputs: {
            jobDescription: data.jobDescription,
            currentSkills: data.fitAnalysis?.keywordMatches?.found || [],
            missingSkills: data.fitAnalysis?.keywordMatches?.missing || [],
          },
          promptVersion: 'v1',
        }),
      });

      const result = await response.json();
      setSkillPath(result.result);
    } catch (error) {
      console.error('Error generating skill path:', error);
      alert('Failed to generate skill path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="improve-loading">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {mode === 'improve' ? 'Generating suggestions...' : 'Creating skill path...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="improve-step">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Improve or Apply</h2>
        <p className="text-gray-600">
          Choose to improve your resume iteratively or proceed with a skill development plan.
        </p>
      </div>

      {!mode && (
        <div className="grid grid-cols-2 gap-6">
          <button
            onClick={handleImprove}
            className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-blue-600 hover:shadow-md transition-all text-left"
            data-testid="improve-button"
          >
            <Sparkles className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Improve Resume</h3>
            <p className="text-sm text-gray-600">
              Get specific suggestions to enhance your resume and increase your fit score.
            </p>
          </button>

          <button
            onClick={handleApplyAnyway}
            className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-blue-600 hover:shadow-md transition-all text-left"
            data-testid="apply-anyway-button"
          >
            <BookOpen className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply Anyway</h3>
            <p className="text-sm text-gray-600">
              Get a fast upskilling plan and recruiter talk track for missing skills.
            </p>
          </button>
        </div>
      )}

      {/* Resume Improvement Suggestions */}
      {mode === 'improve' && suggestions && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Improvement Suggestions (Iteration {iterationCount})
              </h3>
            </div>

            <div className="space-y-4">
              {suggestions.suggestions?.map((suggestion: any, i: number) => (
                <div key={i} className="border-l-4 border-blue-200 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900 mb-1">{suggestion.section}</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Current</p>
                      <p className="text-sm text-gray-700 line-through">{suggestion.current}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 uppercase">Suggested</p>
                      <p className="text-sm text-green-700 font-medium">{suggestion.suggested}</p>
                    </div>
                    <p className="text-xs text-gray-600 italic">{suggestion.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>

            {suggestions.missingKeywords && suggestions.missingKeywords.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Consider adding these keywords:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions.missingKeywords.map((keyword: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Estimated New Score: {suggestions.estimatedNewScore}/100
                  </p>
                  <p className="text-xs text-gray-600">
                    +{suggestions.estimatedNewScore - (data.fitAnalysis?.overallScore || 0)} points
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setMode(null)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
            >
              ← Choose Different Path
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleImprove}
                disabled={iterationCount >= 5}
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Improve Again ({5 - iterationCount} left)
              </button>
              <button
                className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
                data-testid="apply-button"
              >
                <Check className="w-5 h-5 inline mr-2" />
                Apply with Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Path */}
      {mode === 'skillpath' && skillPath && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Fast Upskilling Plan</h3>
            </div>

            <div className="space-y-4">
              {skillPath.skills?.map((skill: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                      <p className="text-sm text-gray-600">
                        {skill.estimatedHours}h • Priority: {skill.priority}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        skill.priority === 'high'
                          ? 'bg-red-50 text-red-700'
                          : skill.priority === 'medium'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {skill.priority}
                    </span>
                  </div>

                  {skill.resources && skill.resources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {skill.resources.map((resource: any, j: number) => (
                        <a
                          key={j}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          📚 {resource.title} ({resource.duration}h) — {resource.provider}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Total Time Investment: {skillPath.totalHours}h
              </p>
              <p className="text-xs text-gray-600">
                You can complete this plan within a week while job searching.
              </p>
            </div>
          </div>

          {/* Recruiter Talk Track */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recruiter Talk Track</h3>
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <p className="text-sm text-gray-700 italic">{skillPath.talkTrack}</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setMode(null)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
            >
              ← Choose Different Path
            </button>
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
              data-testid="apply-button"
            >
              <Check className="w-5 h-5 inline mr-2" />
              Apply with Plan
            </button>
          </div>
        </div>
      )}

      {mode && (
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Fit Analysis
        </button>
      )}
    </div>
  );
}

