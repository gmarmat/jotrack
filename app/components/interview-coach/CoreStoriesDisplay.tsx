'use client';

import { useState } from 'react';
import { BookOpen, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';

interface CoreStoriesDisplayProps {
  jobId: string;
  interviewCoachState: any;
  setInterviewCoachState: (state: any) => void;
  readyForExtraction: boolean;
}

/**
 * Core Stories Display
 * Shows 2-3 extracted core stories with question mapping
 */
export function CoreStoriesDisplay({
  jobId,
  interviewCoachState,
  setInterviewCoachState,
  readyForExtraction
}: CoreStoriesDisplayProps) {
  const [extracting, setExtracting] = useState(false);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  
  const coreStories = interviewCoachState.coreStories || [];
  const storyMapping = interviewCoachState.storyMapping || {};
  const coverageAnalysis = interviewCoachState.coverageAnalysis || {};
  
  const handleExtract = async () => {
    try {
      setExtracting(true);
      
      const res = await fetch(`/api/interview-coach/${jobId}/extract-core-stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStoryCount: 3 })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Extraction failed');
      }
      
      const data = await res.json();
      
      // Update state
      setInterviewCoachState((prev: any) => ({
        ...prev,
        coreStories: data.coreStories,
        storyMapping: data.storyMapping,
        coverageAnalysis: data.coverageAnalysis,
        memorializationPlan: data.memorializationPlan,
        recommendedPracticeOrder: data.recommendedPracticeOrder,
        coreStoriesExtractedAt: data.extractedAt,
        progress: {
          ...prev.progress,
          coreStoriesExtracted: true,
          coreStoriesCount: data.coreStories.length
        }
      }));
      
      alert(`✅ Extracted ${data.coreStories.length} core stories!`);
    } catch (error: any) {
      alert(`Failed to extract core stories: ${error.message}`);
    } finally {
      setExtracting(false);
    }
  };
  
  if (!readyForExtraction) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Core Stories Locked 🔒
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Generate at least 3 talk tracks before extracting core stories.
        </p>
        <div className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Progress: {interviewCoachState.progress?.talkTracksGenerated || 0} / 3 talk tracks
          </p>
        </div>
      </div>
    );
  }
  
  if (coreStories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
        <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Ready to Extract Core Stories!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You have {interviewCoachState.progress?.talkTracksGenerated || 0} talk tracks ready.
          Let's identify your 2-3 core stories that can answer 90% of questions!
        </p>
        <button
          onClick={handleExtract}
          disabled={extracting}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl
                   font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50
                   disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2 mx-auto"
        >
          {extracting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Extracting Stories...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Extract Core Stories (2-3)
            </>
          )}
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Your Core Stories</h2>
        <p className="text-purple-100 mb-4">
          {coreStories.length} stories that cover {coverageAnalysis.coveragePercentage || 0}% of your interview questions
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-3xl font-bold">{coreStories.length}</div>
            <div className="text-sm text-purple-100">Core Stories</div>
          </div>
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-3xl font-bold">{coverageAnalysis.questionsCovered || 0}</div>
            <div className="text-sm text-purple-100">Questions Covered</div>
          </div>
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-3xl font-bold">{coverageAnalysis.coveragePercentage || 0}%</div>
            <div className="text-sm text-purple-100">Coverage</div>
          </div>
        </div>
      </div>
      
      {/* Core Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coreStories.map((story: any, index: number) => (
          <div
            key={story.id}
            onClick={() => setSelectedStory(selectedStory === story.id ? null : story.id)}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 cursor-pointer
                       transition-all hover:shadow-2xl ${
                         selectedStory === story.id ? 'ring-2 ring-purple-500' : ''
                       }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl
                            flex items-center justify-center text-white font-bold text-xl">
                {index + 1}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {story.questionCoverage}
                </div>
                <div className="text-xs text-gray-500">questions</div>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {story.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {story.oneLiner}
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {story.memorableStat}
              </p>
            </div>
            
            {/* Themes */}
            <div className="mt-4 flex flex-wrap gap-2">
              {story.themes.slice(0, 3).map((theme: string) => (
                <span
                  key={theme}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full
                           text-gray-700 dark:text-gray-300"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected Story Details */}
      {selectedStory && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {(() => {
            const story = coreStories.find((s: any) => s.id === selectedStory);
            if (!story) return null;
            
            return (
              <>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {story.title}
                </h3>
                
                {/* Full STAR Story */}
                <div className="space-y-4 mb-8">
                  <div>
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Situation
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {story.fullStory.situation}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Task
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {story.fullStory.task}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Action
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {story.fullStory.action}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      Result
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {story.fullStory.result}
                    </p>
                  </div>
                </div>
                
                {/* Cheat Sheet */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
                    📋 Cheat Sheet (Memorize This!)
                  </h4>
                  <ul className="space-y-2">
                    {story.cheatSheet.map((item: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Questions This Story Answers */}
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Questions This Story Answers
                  </h4>
                  <div className="space-y-3">
                    {story.coversQuestions.map((qId: string) => {
                      const mapping = storyMapping[qId];
                      return (
                        <div
                          key={qId}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {qId.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          {mapping && (
                            <>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                                "{mapping.openingLine}"
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {mapping.emphasisPoints?.slice(0, 2).map((point: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30
                                             rounded-full text-purple-700 dark:text-purple-300"
                                  >
                                    {point}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
      
      {/* Practice Recommendations */}
      {interviewCoachState.recommendedPracticeOrder && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            Recommended Practice Plan
          </h3>
          <ul className="space-y-2">
            {interviewCoachState.recommendedPracticeOrder.map((step: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

