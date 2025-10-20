"use client";

import { useState } from 'react';
import { MessageSquare, BookOpen, List, Eye, EyeOff, Edit2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface TalkTrack {
  question: string;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
  longForm: {
    text: string;
    structure: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    wordCount: number;
    estimatedTime: string;
  };
  cheatSheet: {
    keyPoints?: string[];
    context?: string[];
    actions?: string[];
    results?: string[];
    memorableStat: string;
    openingLine: string;
    closingLine?: string;
  };
  coachingTips: {
    emphasisPoints: string[];
    avoidances: string[];
    pacing?: string;
    emphasis?: string;
  };
  generatedAt: number;
  questionId: string;
}

interface TalkTracksDisplayProps {
  jobId: string;
  talkTracks: TalkTrack[];
  onRegenerate?: (questionId: string, persona: string) => void;
}

export default function TalkTracksDisplay({
  jobId,
  talkTracks,
  onRegenerate
}: TalkTracksDisplayProps) {
  const [viewMode, setViewMode] = useState<'long' | 'cheat'>('long');
  const [practiceMode, setPracticeMode] = useState(false);
  const [revealedQuestions, setRevealedQuestions] = useState<Set<string>>(new Set());
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const toggleReveal = (questionId: string) => {
    const newRevealed = new Set(revealedQuestions);
    if (newRevealed.has(questionId)) {
      newRevealed.delete(questionId);
    } else {
      newRevealed.add(questionId);
    }
    setRevealedQuestions(newRevealed);
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case 'recruiter': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'hiring-manager': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'peer': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getPersonaLabel = (persona: string) => {
    switch (persona) {
      case 'recruiter': return '📞 Recruiter Screen';
      case 'hiring-manager': return '👔 Hiring Manager';
      case 'peer': return '👥 Peer/Panel';
      default: return persona;
    }
  };

  if (talkTracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full mb-4">
          <MessageSquare size={32} className="text-purple-600 dark:text-purple-400" />
        </div>
        
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Talk Tracks Generated Yet
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Generate personalized interview answers from your interview questions. Each answer will match your natural writing style!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare size={20} className="text-purple-600 dark:text-purple-400" />
          Your Talk Tracks ({talkTracks.length})
        </h3>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('long')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'long'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <BookOpen size={14} className="inline mr-1" />
              Long Form
            </button>
            <button
              onClick={() => setViewMode('cheat')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'cheat'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <List size={14} className="inline mr-1" />
              Cheat Sheet
            </button>
          </div>
          
          {/* Practice Mode Toggle */}
          <button
            onClick={() => {
              setPracticeMode(!practiceMode);
              if (!practiceMode) {
                setRevealedQuestions(new Set());
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              practiceMode
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {practiceMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {practiceMode ? 'Exit Practice' : 'Practice Mode'}
          </button>
        </div>
      </div>

      {/* Talk Tracks List */}
      <div className="space-y-4">
        {talkTracks.map((track) => {
          const isExpanded = expandedQuestion === track.questionId;
          const isRevealed = revealedQuestions.has(track.questionId);
          const showAnswer = !practiceMode || isRevealed;

          return (
            <div
              key={track.questionId}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Question Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPersonaColor(track.persona)}`}>
                        {getPersonaLabel(track.persona)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {track.longForm.estimatedTime}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {track.question}
                    </h4>
                  </div>
                  
                  {/* Practice Mode Reveal Button */}
                  {practiceMode && (
                    <button
                      onClick={() => toggleReveal(track.questionId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isRevealed
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isRevealed ? (
                        <>
                          <Eye size={12} className="inline mr-1" />
                          Hide Answer
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} className="inline mr-1" />
                          Reveal Answer
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Answer Content */}
              {showAnswer && (
                <div className="p-4">
                  {/* Long Form View */}
                  {viewMode === 'long' && (
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 p-4 rounded-lg mb-4">
                        <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {track.longForm.text}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>📊 {track.longForm.wordCount} words</span>
                          <span>⏱️ {track.longForm.estimatedTime}</span>
                        </div>
                      </div>
                      
                      {/* STAR Breakdown (expandable) */}
                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : track.questionId)}
                        className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-2"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        View STAR Breakdown
                      </button>
                      
                      {isExpanded && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Situation</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">{track.longForm.structure.situation}</p>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                            <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">Task</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">{track.longForm.structure.task}</p>
                          </div>
                          <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                            <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">Action</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">{track.longForm.structure.action}</p>
                          </div>
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">Result</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300">{track.longForm.structure.result}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cheat Sheet View */}
                  {viewMode === 'cheat' && (
                    <div className="space-y-3">
                      {/* Memorable Stat (Highlighted) */}
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg">
                        <p className="text-xs font-semibold mb-1">🎯 Memorable Stat</p>
                        <p className="text-lg font-bold">{track.cheatSheet.memorableStat}</p>
                      </div>
                      
                      {/* Opening Line */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">💬 Opening Line</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                          "{track.cheatSheet.openingLine}"
                        </p>
                      </div>
                      
                      {/* Key Points (Bulleted) */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">📝 Key Points</p>
                        <div className="space-y-1.5">
                          {(track.cheatSheet.keyPoints || 
                            [...(track.cheatSheet.context || []), 
                             ...(track.cheatSheet.actions || []), 
                             ...(track.cheatSheet.results || [])]
                          ).map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Closing Line */}
                      {track.cheatSheet.closingLine && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">🎬 Closing Line</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                            "{track.cheatSheet.closingLine}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Coaching Tips (always shown) */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 Coaching Tips</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">✅ Emphasize:</p>
                        <ul className="space-y-1">
                          {track.coachingTips.emphasisPoints.map((tip, idx) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">❌ Avoid:</p>
                        <ul className="space-y-1">
                          {track.coachingTips.avoidances.map((tip, idx) => (
                            <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => onRegenerate?.(track.questionId, track.persona)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium transition-colors"
                    >
                      <Sparkles size={12} />
                      Regenerate
                    </button>
                    
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium transition-colors"
                    >
                      <Edit2 size={12} />
                      Refine
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Practice Mode Instructions */}
      {practiceMode && (
        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
            🎯 Practice Mode Active
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300">
            Read each question, formulate your answer mentally, then click "Reveal Answer" to check against your prepared talk track. This helps build muscle memory for the interview!
          </p>
        </div>
      )}
      
      {/* Export/Print Button */}
      <div className="flex justify-center">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm"
        >
          📄 Export to PDF / Print
        </button>
      </div>
    </div>
  );
}

