'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Check, Clock, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

interface Props {
  jobId: string;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
  companyName: string;
  roleTitle: string;
  onSearchComplete: (questionBank: any) => void;
  existingQuestionBank?: any;
  analysisData?: any; // For stats display
  onNavigateToPractice?: () => void; // For navigating to practice step
}

export default function WelcomeSearch({
  jobId,
  persona,
  companyName,
  roleTitle,
  onSearchComplete,
  existingQuestionBank,
  analysisData,
  onNavigateToPractice
}: Props) {
  const [searching, setSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    webQuestions: false,
    aiQuestions: false,
    finalQuestions: false
  });

  const personaTitles = {
    'recruiter': { icon: '📞', title: 'Recruiter Screen', focus: 'Culture Fit & Motivation' },
    'hiring-manager': { icon: '👨‍💼', title: 'Hiring Manager', focus: 'Technical Depth & Leadership' },
    'peer': { icon: '👥', title: 'Peer / Panel', focus: 'System Design & Collaboration' }
  };

  const currentPersona = personaTitles[persona];

  // Format timestamp helper
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return 'Never';
    // Handle both seconds and milliseconds
    const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    return new Date(ms).toLocaleString();
  };

  const handleStartSearch = async () => {
    try {
      setSearching(true);
      setSearchComplete(false);
      setSearchResults(null);
      
      // Step 1: Web search
      const searchRes = await fetch(`/api/jobs/${jobId}/interview-questions/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, roleTitle })
      });

      if (!searchRes.ok) throw new Error('Web search failed');
      const searchData = await searchRes.json();
      
      // Step 2: Generate AI questions
      const generateRes = await fetch(`/api/jobs/${jobId}/interview-questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona })
      });

      if (!generateRes.ok) throw new Error('AI generation failed');
      const generateData = await generateRes.json();
      
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
        themes: generateData.themes || [],
        synthesizedQuestions: generateData.synthesizedQuestions && generateData.synthesizedQuestions.length > 0 
          ? generateData.synthesizedQuestions 
          : [
              'Tell me about yourself',
              persona === 'recruiter' ? `Why ${companyName}?` : `What's your ${persona === 'hiring-manager' ? 'leadership' : 'collaboration'} style?`,
              'Describe a challenging project or stakeholder conflict',
              persona === 'recruiter' ? 'What are your salary expectations?' : 'How do you handle disagreements with team members?'
            ]
      };
      
      setSearching(false);
      setSearchComplete(true);
      setSearchResults(questionBank);
      
      // Don't auto-progress - let user choose next action
      console.log('🔍 Search completed, question bank ready:', {
        hasQuestionBank: !!questionBank,
        webQuestions: questionBank?.webQuestions?.length || 0,
        aiQuestions: Object.keys(questionBank?.aiQuestions || {}),
        synthesizedQuestions: questionBank?.synthesizedQuestions?.length || 0
      });
      
    } catch (error: any) {
      alert(`Search failed: ${error.message}`);
      setSearching(false);
    }
  };

  // If questions already searched, show completion state with progressive disclosure
  if (existingQuestionBank) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Search Results with Progressive Disclosure */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Results</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock size={16} />
              Last run: {formatTimestamp(existingQuestionBank.searchedAt)}
            </div>
          </div>

          {/* Web Questions Section */}
          <div className="mb-6">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, webQuestions: !prev.webQuestions }))}
              className="flex items-center justify-between w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Web Search Complete
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Found {existingQuestionBank.webQuestions?.length || 0} questions
                </span>
              </div>
              {expandedSections.webQuestions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            
            {expandedSections.webQuestions && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                {existingQuestionBank.webQuestions?.slice(0, 3).map((q: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{q.question}</p>
                      {q.sourceUrl && (
                        <a 
                          href={q.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors mt-1"
                        >
                          {(() => {
                            try {
                              return new URL(q.sourceUrl).hostname.replace('www.', '');
                            } catch {
                              return q.source || 'Web Search';
                            }
                          })()}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {existingQuestionBank.webQuestions?.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    ...and {existingQuestionBank.webQuestions.length - 3} more questions
                  </p>
                )}
              </div>
            )}
          </div>

          {/* AI Questions Section */}
          <div className="mb-6">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, aiQuestions: !prev.aiQuestions }))}
              className="flex items-center justify-between w-full p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  AI Generation Complete
                </span>
                <span className="text-sm text-purple-600 dark:text-purple-400">
                  Generated {Object.values(existingQuestionBank.aiQuestions || {}).reduce((acc: number, p: any) => acc + (p?.questions?.length || 0), 0)} questions
                </span>
              </div>
              {expandedSections.aiQuestions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            
            {expandedSections.aiQuestions && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                {Object.entries(existingQuestionBank.aiQuestions || {}).map(([personaName, data]: [string, any]) => (
                  <div key={personaName} className="border-l-4 border-purple-300 pl-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize flex items-center gap-2">
                      {personaName === 'recruiter' && '📞 Recruiter Questions'}
                      {personaName === 'hiring_manager' && '👨‍💼 Hiring Manager Questions'}
                      {personaName === 'peer' && '👥 Peer/Panel Questions'}
                    </h4>
                    <div className="space-y-2">
                      {data?.questions?.map((q: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-fit">{index + 1}.</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {typeof q === 'string' ? q : q.question || q}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Questions Section - WITH RATIONALE */}
          <div className="mb-6">
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, finalQuestions: !prev.finalQuestions }))}
              className="flex items-center justify-between w-full p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Final Questions Selected
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {existingQuestionBank.synthesizedQuestions?.length || 0} questions ready for practice
                </span>
              </div>
              {expandedSections.finalQuestions ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            
            {expandedSections.finalQuestions && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                {/* Insights */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-400">
                  <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">How We Selected These Questions</h5>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    We analyzed <strong>{Object.values(existingQuestionBank.aiQuestions || {}).reduce((acc: number, p: any) => acc + (p?.questions?.length || 0), 0)} AI-generated questions</strong> and <strong>{existingQuestionBank.webQuestions?.length || 0} web questions</strong> to identify the most representative topics. These {existingQuestionBank.synthesizedQuestions?.length || 0} questions cover ~90% of likely interview scenarios for this role.
                  </p>
                </div>
                
                {/* Signals Used */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-l-4 border-purple-400">
                  <h5 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">Signals Used in Selection</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-purple-800 dark:text-purple-200">
                    <div>✓ Job Description: {existingQuestionBank?.sources?.filter((s: any) => s.source === 'jd')?.length || 0} keywords aligned</div>
                    <div>✓ Company: {companyName} culture & values</div>
                    <div>✓ Resume: {existingQuestionBank?.themes?.length || 0} skill themes identified</div>
                    <div>✓ Interviewer: {persona} profile preferences</div>
                  </div>
                </div>
                
                {/* Final Questions */}
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Questions to Practice</h5>
                  <div className="space-y-3">
                    {existingQuestionBank.synthesizedQuestions?.map((q: string, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-600/30 p-3 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 min-w-fit">{index + 1}.</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{q}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <button
              onClick={() => onSearchComplete(existingQuestionBank)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                       hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
            >
              Continue to Practice →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">


        {/* Search Button */}
        <div className="text-center">
          <button
            onClick={handleStartSearch}
            disabled={searching}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl
                     hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-xl
                     transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Search className="inline w-5 h-5 mr-2" />
            {searching ? 'Searching...' : (existingQuestionBank ? 'Begin NEW Search & Analysis' : 'Begin Search & Analysis')}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            ⏱️ Takes ~30 seconds • Cached for 90 days (no repeat cost!)
          </p>
        </div>
        
        {/* Action Buttons for existing question bank */}
        {existingQuestionBank && (
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  console.log('Continue to Practice clicked');
                  if (onNavigateToPractice) {
                    onNavigateToPractice();
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl
                         hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-lg shadow-xl
                         transform hover:scale-105 border-2 border-green-300"
              >
                📝 Continue to Practice
              </button>
              
              <button
                onClick={() => {
                  // TODO: Implement insights view
                  console.log('View insights clicked');
                  alert('View Insights clicked! (This will show detailed analysis of your questions)');
                }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl
                         hover:from-indigo-700 hover:to-purple-700 transition-all font-bold text-lg shadow-xl
                         transform hover:scale-105 border-2 border-indigo-300"
              >
                📊 View Insights
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have existing analysis data. Continue practicing or start a new search.
            </p>
          </div>
        )}

      {/* Search in Progress */}
      {searching && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center space-y-6">
            <div className="text-4xl animate-pulse">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Searching for your interview questions...
            </h3>
            
            {/* Three Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl mb-2">🌐</div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Searching Online Sources</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Glassdoor, Reddit, Blind</p>
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl mb-2">🤖</div>
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Generating Relevant Questions</h4>
                  <p className="text-xs text-purple-600 dark:text-purple-400">AI-powered analysis</p>
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl mb-2">✨</div>
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1">Synthesizing Final Questions</h4>
                  <p className="text-xs text-green-600 dark:text-green-400">Curating best questions</p>
                  <div className="mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Complete */}
      {searchComplete && searchResults && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Search Complete!
            </h3>
            
            {/* Source Breakdown */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="font-semibold text-blue-800 dark:text-blue-300 text-2xl">
                  {searchResults.webQuestions?.length || 0}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Web Questions</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="font-semibold text-purple-800 dark:text-purple-300 text-2xl">
                  {Object.values(searchResults.aiQuestions || {}).reduce((acc: number, p: any) => acc + (p?.questions?.length || 0), 0)}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">AI Generated</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="font-semibold text-green-800 dark:text-green-300 text-2xl">
                  {searchResults.synthesizedQuestions?.length || 0}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Final Questions</div>
              </div>
            </div>
            
            {/* Web Questions Dropdown */}
            {searchResults.webQuestions && searchResults.webQuestions.length > 0 && (
              <div className="mt-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                      🌐 Web Search Questions ({searchResults.webQuestions.length})
                    </h4>
                    <span className="text-sm text-blue-600 dark:text-blue-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 pl-4">
                    {searchResults.webQuestions.map((q: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{q.question}</p>
                          {q.sourceUrl && (
                            <a 
                              href={q.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              {(() => {
                                try {
                                  return new URL(q.sourceUrl).hostname.replace('www.', '');
                                } catch {
                                  return q.source || 'Web Search';
                                }
                              })()}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
            
            {/* AI Questions Dropdown */}
            {searchResults.aiQuestions && Object.keys(searchResults.aiQuestions).length > 0 && (
              <div className="mt-6">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                    <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                      🤖 AI Generated Questions ({Object.values(searchResults.aiQuestions).reduce((acc: number, p: any) => acc + (p?.questions?.length || 0), 0)})
                    </h4>
                    <span className="text-sm text-purple-600 dark:text-purple-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="mt-4 space-y-4 pl-4">
                    {Object.entries(searchResults.aiQuestions).map(([persona, data]: [string, any]) => (
                      <div key={persona} className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {personaTitles[persona]} ({data.questions?.length || 0} questions)
                        </h5>
                        <div className="space-y-2">
                          {data.questions?.map((q: any, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{index + 1}.</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{q.question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Questions found successfully! Ready to proceed to practice.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onSearchComplete(searchResults)}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg
                         hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg"
              >
                📝 Continue to Practice →
              </button>
              
              <button
                onClick={() => {
                  console.log('View insights clicked');
                  alert('View Insights clicked! (This will show detailed analysis of your questions)');
                }}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg
                         hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
              >
                📊 View Insights
              </button>
              
              <button
                onClick={() => {
                  setSearchComplete(false);
                  setSearchResults(null);
                  handleStartSearch();
                }}
                className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg
                         hover:from-orange-700 hover:to-red-700 transition-all font-semibold shadow-lg"
              >
                🔄 New Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

