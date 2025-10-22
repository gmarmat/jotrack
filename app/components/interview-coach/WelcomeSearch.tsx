'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Check, Clock } from 'lucide-react';

interface Props {
  jobId: string;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
  companyName: string;
  roleTitle: string;
  onSearchComplete: (questionBank: any) => void;
  existingQuestionBank?: any;
}

export default function WelcomeSearch({
  jobId,
  persona,
  companyName,
  roleTitle,
  onSearchComplete,
  existingQuestionBank
}: Props) {
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState({ step: '', percent: 0 });
  const [autoTriggered, setAutoTriggered] = useState(false);

  const personaTitles = {
    'recruiter': { icon: '📞', title: 'Recruiter Screen', focus: 'Culture Fit & Motivation' },
    'hiring-manager': { icon: '👨‍💼', title: 'Hiring Manager', focus: 'Technical Depth & Leadership' },
    'peer': { icon: '👥', title: 'Peer / Panel', focus: 'System Design & Collaboration' }
  };

  const currentPersona = personaTitles[persona];

  // Auto-trigger search if no existing question bank
  useEffect(() => {
    if (!existingQuestionBank && !autoTriggered && !searching) {
      console.log('🚀 Auto-triggering Interview Coach search...');
      setAutoTriggered(true);
      handleSearch();
    }
  }, [existingQuestionBank, autoTriggered, searching]);

  // If questions already searched, show completion state
  if (existingQuestionBank) {
    const questionCount = 
      (existingQuestionBank.webQuestions?.length || 0) +
      (existingQuestionBank.aiQuestions?.recruiter?.questions?.length || 0) +
      (existingQuestionBank.aiQuestions?.hiringManager?.questions?.length || 0) +
      (existingQuestionBank.aiQuestions?.peer?.questions?.length || 0);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Questions Already Found!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We found <strong>{questionCount} questions</strong> for you.
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-300">
                <Clock size={16} />
                Cached - no repeat search needed!
              </div>
            </div>

            <button
              onClick={() => onSearchComplete(existingQuestionBank)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                       hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
            >
              Continue to Question Selection →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartSearch = async () => {
    try {
      setSearching(true);
      
      // Step 1: Web search
      setProgress({ step: 'Searching Glassdoor, Reddit, Blind...', percent: 20 });
      
      const searchRes = await fetch(`/api/jobs/${jobId}/interview-questions/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, roleTitle })
      });

      if (!searchRes.ok) throw new Error('Web search failed');
      
      const searchData = await searchRes.json();
      setProgress({ step: 'Web search complete! Analyzing patterns...', percent: 50 });
      
      // Step 2: Generate AI questions
      setProgress({ step: 'Generating persona-specific questions...', percent: 70 });
      
      const generateRes = await fetch(`/api/jobs/${jobId}/interview-questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personas: { 
            [persona]: true,
            'hiring-manager': persona === 'hiring-manager',
            'peer': persona === 'peer',
            'recruiter': persona === 'recruiter'
          } 
        })
      });

      if (!generateRes.ok) throw new Error('AI generation failed');
      
      const generateData = await generateRes.json();
      setProgress({ step: 'Complete! Preparing questions...', percent: 100 });
      
      // Combine results
      const totalQuestions = (searchData.questions?.length || 0) + 
                            Object.values(generateData.questions || {}).reduce((acc: number, p: any) => 
                              acc + (p?.questions?.length || 0), 0);
      
      const questionBank = {
        webQuestions: searchData.questions || [],
        aiQuestions: generateData.questions || {},
        sources: searchData.sources || [],
        searchedAt: searchData.searchedAt,
        generatedAt: generateData.generatedAt,
        persona,
        // AI Synthesis data (for insights page)
        // TODO: Backend should return these, using smart defaults for now
        themes: generateData.themes || [
          { 
            theme: 'Culture Fit & Motivation', 
            questionCount: Math.ceil(totalQuestions * 0.35), 
            representative: persona === 'recruiter' ? 'Why this company?' : 'Tell me about your leadership style',
            sampleQuestions: searchData.questions?.slice(0, 3).map((q: any) => q.question) || []
          },
          { 
            theme: 'Past Experience & Skills', 
            questionCount: Math.ceil(totalQuestions * 0.30), 
            representative: 'Tell me about yourself',
            sampleQuestions: searchData.questions?.slice(3, 6).map((q: any) => q.question) || []
          },
          { 
            theme: 'Behavioral (STAR)', 
            questionCount: Math.ceil(totalQuestions * 0.25), 
            representative: 'Describe a challenging project or conflict',
            sampleQuestions: searchData.questions?.slice(6, 9).map((q: any) => q.question) || []
          },
          { 
            theme: 'Logistics & Compensation', 
            questionCount: Math.ceil(totalQuestions * 0.10), 
            representative: 'What are your salary expectations?',
            sampleQuestions: []
          }
        ],
        synthesizedQuestions: generateData.synthesizedQuestions || [
          'Tell me about yourself',
          persona === 'recruiter' ? `Why ${companyName}?` : `What's your ${persona === 'hiring-manager' ? 'leadership' : 'collaboration'} style?`,
          'Describe a challenging project or stakeholder conflict',
          persona === 'recruiter' ? 'What are your salary expectations?' : 'How do you handle disagreements with team members?'
        ]
      };
      
      // Transition to insights page (not immediate selection)
      setTimeout(() => {
        onSearchComplete(questionBank);
      }, 1000);
      
    } catch (error: any) {
      alert(`Search failed: ${error.message}`);
      setSearching(false);
      setProgress({ step: '', percent: 0 });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                    rounded-2xl shadow-xl p-8 border border-purple-200 dark:border-purple-800">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{currentPersona.icon}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {currentPersona.title} Interview Prep
          </h2>
          <p className="text-lg text-purple-600 dark:text-purple-400 font-medium">
            {currentPersona.focus}
          </p>
        </div>

        {!searching ? (
          <>
            {/* Welcome content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Let's find the best interview questions
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <p className="font-semibold">Multi-Source Web Search</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Search Glassdoor, Reddit, Blind for real interview experiences at {companyName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-semibold">AI Analysis & Filtering</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Analyze 50-100 questions, filter by relevance to {roleTitle} role
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <p className="font-semibold">Persona-Specific Generation</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Generate 10 additional questions tailored for {currentPersona.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Check size={16} />
                  <strong>Result: 10-15 high-quality questions curated for YOUR interview</strong>
                </p>
              </div>
            </div>

            {/* Call to action */}
            <div className="text-center">
              {!autoTriggered ? (
                <>
                  <button
                    onClick={handleStartSearch}
                    className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl
                             hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-xl
                             transform hover:scale-105"
                  >
                    <Search className="inline w-5 h-5 mr-2" />
                    Find Interview Questions
                  </button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    ⏱️ Takes ~30 seconds • Cached for 90 days (no repeat cost!)
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-100 to-blue-100 
                                   dark:from-purple-900/50 dark:to-blue-900/50 text-purple-700 dark:text-purple-300 
                                   font-bold text-lg rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    Auto-searching...
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    🚀 Automatically finding the best questions for you
                  </p>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Search in progress */}
            <div className="text-center space-y-6">
              <div className="text-4xl animate-pulse">🔍</div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {progress.step}
              </h3>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {progress.percent}% complete
              </p>

              {/* Live status updates */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-left space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${progress.percent >= 20 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {progress.percent >= 20 ? <Check size={16} /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  Searching Glassdoor reviews
                </div>
                <div className={`flex items-center gap-2 ${progress.percent >= 30 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {progress.percent >= 30 ? <Check size={16} /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  Searching Reddit experiences
                </div>
                <div className={`flex items-center gap-2 ${progress.percent >= 40 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {progress.percent >= 40 ? <Check size={16} /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  Searching Blind discussions
                </div>
                <div className={`flex items-center gap-2 ${progress.percent >= 50 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {progress.percent >= 50 ? <Check size={16} /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full animate-spin" />}
                  Analyzing question patterns
                </div>
                <div className={`flex items-center gap-2 ${progress.percent >= 70 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {progress.percent >= 70 ? <Check size={16} /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  Generating AI questions ({currentPersona.title})
                </div>
                <div className={`flex items-center gap-2 ${progress.percent >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {progress.percent >= 100 ? <Check size={16} /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  Finalizing question list
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

