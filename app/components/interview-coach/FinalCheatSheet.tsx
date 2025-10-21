'use client';

import { Printer, Mail, ArrowLeft } from 'lucide-react';

interface CoreStory {
  id: string;
  title: string;
  oneLiner: string;
  keyStat: string;
  coversQuestions: string[];
}

interface TalkTrack {
  questionId: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  storyId: string;
}

interface Props {
  coreStories: CoreStory[];
  talkTracks: TalkTrack[];
  storyMapping: Record<string, { storyId: string; adaptationTips: string[] }>;
  onBack: () => void;
}

/**
 * Final Cheat Sheet - Printable Summary
 * 
 * Shows:
 * - Core stories (2-3)
 * - Full STAR talk tracks (4)
 * - Story mapping (which story for which question)
 * - Print/Email buttons
 */
export default function FinalCheatSheet({
  coreStories,
  talkTracks,
  storyMapping,
  onBack
}: Props) {
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleEmail = () => {
    // TODO: Implement email functionality
    alert('Email functionality coming soon!');
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Print-friendly header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-xl p-8 mb-6 print:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📄 Interview Cheat Sheet</h1>
            <p className="text-purple-100">Recruiter Round Prep - Ready to Print!</p>
          </div>
          
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold
                       hover:bg-purple-50 transition-colors shadow-lg"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            
            <button
              onClick={handleEmail}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-semibold
                       hover:bg-white/30 transition-colors border border-white/40"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-semibold
                       hover:bg-white/30 transition-colors border border-white/40"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>
      
      {/* Core Stories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 print:shadow-none print:border print:border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          🧠 Core Stories ({coreStories.length})
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Memorize these {coreStories.length} stories. You can adapt them to answer 90% of interview questions.
        </p>
        
        <div className="space-y-4">
          {coreStories.map((story, i) => (
            <div key={story.id} className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20
                                         rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
              <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                Story {i + 1}: {story.title}
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-24">One-liner:</span>
                  <span className="text-gray-900 dark:text-white flex-1">{story.oneLiner}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-24">Key stat:</span>
                  <span className="text-gray-900 dark:text-white flex-1 font-bold">{story.keyStat}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 w-24">Use for:</span>
                  <span className="text-gray-900 dark:text-white flex-1">
                    {story.coversQuestions.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Talk Tracks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 print:shadow-none print:border print:border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          📝 Full Talk Tracks (STAR Format)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Polished answers ready to deliver. Natural flow, weaves in company culture.
        </p>
        
        <div className="space-y-8">
          {talkTracks.map((track, i) => (
            <div key={track.questionId} className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-0">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Q{i + 1}: {track.question}
                </h3>
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 
                               px-3 py-1 rounded-full font-medium whitespace-nowrap">
                  Use Story {coreStories.findIndex(s => s.id === track.storyId) + 1}
                </span>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 
                                px-2 py-1 rounded text-xs font-bold mb-2">
                    SITUATION
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {track.situation}
                  </p>
                </div>
                
                <div>
                  <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 
                                px-2 py-1 rounded text-xs font-bold mb-2">
                    TASK
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {track.task}
                  </p>
                </div>
                
                <div>
                  <div className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 
                                px-2 py-1 rounded text-xs font-bold mb-2">
                    ACTION
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {track.action}
                  </p>
                </div>
                
                <div>
                  <div className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 
                                px-2 py-1 rounded text-xs font-bold mb-2">
                    RESULT
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {track.result}
                  </p>
                </div>
              </div>
              
              {/* Adaptation tips for this question */}
              {storyMapping[track.questionId]?.adaptationTips && (
                <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 
                              rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    💡 Adaptation Tips:
                  </p>
                  <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                    {storyMapping[track.questionId].adaptationTips.map((tip, idx) => (
                      <li key={idx}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Tips Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 
                    rounded-2xl p-6 border border-green-200 dark:border-green-800 print:shadow-none print:border">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          💡 Quick Tips for Interview Day
        </h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">1.</span>
            <span>Practice each core story until you can tell it naturally (not memorized word-for-word)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">2.</span>
            <span>These {coreStories.length} stories cover 90% of likely questions - adapt based on interviewer's focus</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">3.</span>
            <span>Keep answers 2-3 minutes max (recruiter screens are fast-paced)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">4.</span>
            <span>Reference the company's principles naturally (we've woven them into your talk tracks)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">5.</span>
            <span>Have questions ready for the interviewer (shows engagement and research)</span>
          </li>
        </ul>
      </div>
      
      {/* Bottom Actions (Print) */}
      <div className="mt-8 text-center print:hidden">
        <button
          onClick={handlePrint}
          className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl
                   hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-xl
                   transform hover:scale-105"
        >
          <Printer className="inline w-5 h-5 mr-2" />
          Print This Cheat Sheet
        </button>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
          💡 Print and review 30 minutes before your interview
        </p>
      </div>
      
      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .dark\\:bg-gray-800 { background: white !important; color: black !important; }
          .dark\\:text-white { color: black !important; }
          .dark\\:border-gray-700 { border-color: #d1d5db !important; }
        }
      `}</style>
    </div>
  );
}

