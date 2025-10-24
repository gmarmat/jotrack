'use client';

import { useState } from 'react';

interface TalkTracksPanelProps {
  jobId: string;
  interviewCoachState: any;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
}

export default function TalkTracksPanel({ jobId, interviewCoachState, persona }: TalkTracksPanelProps) {
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<Record<string, number>>({});

  async function generate() {
    setLoading(true);
    try {
      // Gather inputs from interview coach state
      const answers: any[] = [];
      
      // Collect answers from state
      if (interviewCoachState.answers) {
        Object.entries(interviewCoachState.answers).forEach(([questionId, answerData]: [string, any]) => {
          if (answerData.answer) {
            answers.push({
              id: questionId,
              text: answerData.answer
            });
          }
        });
      }
      
      // If no answers in state, try to get from current textarea
      if (answers.length === 0) {
        const answerText = (document.getElementById('answer-textarea') as HTMLTextAreaElement)?.value || '';
        if (answerText.trim()) {
          answers.push({
            id: 'a1',
            text: answerText
          });
        }
      }
      
      // Derive themes from lowest subscores
      const themes = ['impact', 'ownership', 'ambiguity_resolution', 'cost'];
      
      // If we have scores, derive themes from lowest subscores
      if (interviewCoachState.answers) {
        const allSubscores: Record<string, number> = {};
        Object.values(interviewCoachState.answers).forEach((answerData: any) => {
          if (answerData.scores?.[0]?.subscores) {
            Object.entries(answerData.scores[0].subscores).forEach(([dim, score]: [string, any]) => {
              allSubscores[dim] = Math.min(allSubscores[dim] || 100, score);
            });
          }
        });
        
        // Sort by score and take lowest 4 dimensions
        const sortedDims = Object.entries(allSubscores)
          .sort(([,a], [,b]) => a - b)
          .slice(0, 4)
          .map(([dim]) => dim);
        
        if (sortedDims.length > 0) {
          themes.splice(0, sortedDims.length, ...sortedDims);
        }
      }

      const res = await fetch(`/api/interview-coach/${jobId}/extract-core-stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers, 
          themes, 
          persona 
        })
      });
      
      const data = await res.json();
      setStories(data.coreStories || []);
      setCoverage(data.coverageMap || {});
    } catch (error) {
      console.error('Failed to generate core stories:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Core Stories</h2>
        <button 
          onClick={generate} 
          disabled={loading}
          className="rounded-md bg-slate-900 text-white px-4 py-2 disabled:opacity-60 hover:bg-slate-800 transition-colors"
        >
          {loading ? 'Generating…' : 'Generate Stories'}
        </button>
      </div>

      {stories.length > 0 && (
        <div className="space-y-6">
          {stories.map((story, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="font-semibold text-gray-900 dark:text-white mb-2">{story.title}</div>
              
              {/* Coverage indicators */}
              {story.coverage && story.coverage.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Coverage:</div>
                  <div className="flex flex-wrap gap-1">
                    {story.coverage.map((cov: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {cov}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Persona variants */}
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                {['recruiter', 'hiring-manager', 'peer'].map(p => (
                  <div key={p} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
                      {p === 'hiring-manager' ? 'Hiring Manager' : p}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
                      {story[p]?.long || story.long || 'Story content not available'}
                    </div>
                    {story[p]?.short && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 p-2 rounded">
                        <strong>Short:</strong> {story[p].short}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Coverage map */}
          {Object.keys(coverage).length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Coverage Map:</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {JSON.stringify(coverage, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
      
      {stories.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Click "Generate Stories" to create core stories from your practice answers.
        </div>
      )}
    </div>
  );
}
