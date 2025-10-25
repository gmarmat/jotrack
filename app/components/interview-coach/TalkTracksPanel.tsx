'use client';

import { useState, useEffect } from 'react';
import { GitCompare } from 'lucide-react';

interface TalkTracksPanelProps {
  jobId: string;
  interviewCoachState: any;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
}

export default function TalkTracksPanel({ jobId, interviewCoachState, persona }: TalkTracksPanelProps) {
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<Record<string, number>>({});
  const [showCompare, setShowCompare] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Countdown timer for AI operations (countdown, not countup)
  const estimatedTime = 30; // Estimated time for story generation in seconds
  const remainingSeconds = Math.max(0, estimatedTime - elapsedSeconds);
  
  useEffect(() => {
    if (loading && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else if (!loading) {
      setElapsedSeconds(0);
      setStartTime(null);
    }
  }, [loading, startTime]);
  
  // V2: Calculate confidence from interview coach state
  const calculateConfidence = () => {
    if (!interviewCoachState.answers) return 0.5;
    
    const answers = Object.values(interviewCoachState.answers);
    if (answers.length === 0) return 0.2;
    
    let totalConfidence = 0;
    let validAnswers = 0;
    
    answers.forEach((answerData: any) => {
      if (answerData.scores && answerData.scores.length > 0) {
        const latestScore = answerData.scores[answerData.scores.length - 1];
        const confidence = latestScore.confidence || 0.5;
        totalConfidence += confidence;
        validAnswers++;
      }
    });
    
    // If user has provided answers, be more generous with confidence
    if (validAnswers > 0) {
      const averageConfidence = totalConfidence / validAnswers;
      // Boost confidence if user has actually provided answers
      const boostedConfidence = Math.max(averageConfidence, 0.4); // Minimum 40% if answers exist
      return Math.min(boostedConfidence, 1.0); // Cap at 100%
    }
    
    return 0.3;
  };
  
  const confidence = calculateConfidence();

  async function generate() {
    setLoading(true);
    setStartTime(Date.now());
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
      
      // V2: Handle new response format
      if (data.success === false && data.code === 'NO_ANSWERS') {
        alert(data.message);
        return;
      }
      
      setStories(data.stories || data.coreStories || []);
      setCoverage(data.coverageMap || {});
      
      // Show success message
      if (data.stories && data.stories.length > 0) {
        console.log('✅ Successfully generated stories:', data.stories.length);
      }
    } catch (error) {
      console.error('Failed to generate core stories:', error);
      alert('Failed to generate stories. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Core Stories</h2>
        <div className="flex items-center gap-2">
          <button
            data-testid="compare-personas-toggle"
            onClick={() => setShowCompare(!showCompare)}
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
              showCompare 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            Compare Personas
          </button>
          <button 
            data-testid="generate-talk-tracks"
            onClick={generate} 
            disabled={loading}
            className="rounded-md bg-slate-900 text-white px-4 py-2 disabled:opacity-60 hover:bg-slate-800 transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-xs font-semibold tabular-nums">
                  {remainingSeconds > 0 ? `${remainingSeconds}s` : 'Starting...'}
                </span>
              </span>
            ) : 'Generate Stories'}
          </button>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div className="text-blue-800 dark:text-blue-200">
              <strong>Generating your core stories...</strong>
              <br />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Analyzing your answers and creating personalized talk tracks
              </span>
            </div>
          </div>
        </div>
      )}

      {/* V2: Confidence info banner (not a blocker) */}
      {!loading && confidence < 0.1 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-amber-600 dark:text-amber-400 text-sm">💡</div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>We'll generate tracks, but consider adding quantification for stronger results.</strong>
              <br />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Current confidence: {Math.round(confidence * 100)}% • Add specific metrics and numbers to improve story quality
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!loading && stories.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="text-green-600 dark:text-green-400 text-sm">✅</div>
            <div className="text-sm text-green-800 dark:text-green-200">
              <strong>Successfully generated {stories.length} core stories!</strong>
              <br />
              <span className="text-xs text-green-600 dark:text-green-400">
                Your personalized talk tracks are ready below
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Persona Compare View */}
      {showCompare && stories.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Cross-Persona Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['recruiter', 'hiring-manager', 'peer'].map(p => (
              <div key={p} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {p === 'recruiter' ? '🤝' : p === 'hiring-manager' ? '💼' : '👥'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {p === 'hiring-manager' ? 'Hiring Manager' : p}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {p === 'recruiter' && 'Focus on culture fit and communication skills'}
                  {p === 'hiring-manager' && 'Focus on technical depth and team leadership'}
                  {p === 'peer' && 'Focus on collaboration and day-to-day work'}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {p === persona ? 'Current' : 'Alternative'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stories.length > 0 && (
        <div className="space-y-6">
          {stories.map((story, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4" data-testid="talk-track-story">
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
              <div className="grid md:grid-cols-1 gap-4 mt-4">
                {[persona].map(p => (
                  <div key={p} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3" data-testid="persona-variant">
                    <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
                      {p === 'hiring-manager' ? 'Hiring Manager' : p}
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
                      {story.variants?.[p]?.long || story[p]?.long || story.long || 'Story content not available'}
                    </div>
                    {story.variants?.[p]?.short && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 p-2 rounded">
                        <strong>Short:</strong> {story.variants[p].short.join(', ')}
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
