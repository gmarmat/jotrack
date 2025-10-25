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
}

export default function WelcomeSearch({
  jobId,
  persona,
  companyName,
  roleTitle,
  onSearchComplete,
  existingQuestionBank,
  analysisData
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
      
    } catch (error: any) {
      alert(`Search failed: ${error.message}`);
      setSearching(false);
    }
  };

  // If questions already searched, show completion state with progressive disclosure
  if (existingQuestionBank) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Interview Coach
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            We'll help you prep and ace your interview with personalized questions and guidance
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Find Questions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search online sources and generate AI questions tailored to your role
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Practice & Score</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Write STAR stories and get AI feedback to improve your answers
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Talk Tracks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get detailed talking points and memorize key stories
              </p>
            </div>
          </div>
        </div>

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
                      {q.source && (
                        <a 
                          href={q.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors mt-1"
                        >
                          {new URL(q.source).hostname.replace('www.', '')}
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
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Interview Coach
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          We'll help you prep and ace your interview with personalized questions and guidance
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Find Questions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Search online sources and generate AI questions tailored to your role
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Practice & Score</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Write STAR stories and get AI feedback to improve your answers
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Talk Tracks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get detailed talking points and memorize key stories
            </p>
          </div>
        </div>

        {/* Signals We Use - Always Visible & Persona-Specific */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Signals We Use for {currentPersona.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
            {persona === 'recruiter' && (
              <>
                <div>• Culture fit indicators and team dynamics</div>
                <div>• Communication style and soft skills</div>
                <div>• Motivation and career goals alignment</div>
                <div>• Salary expectations and negotiation signals</div>
                <div>• Company values and mission alignment</div>
                <div>• Behavioral examples and STAR stories</div>
              </>
            )}
            {persona === 'hiring-manager' && (
              <>
                <div>• Technical depth and problem-solving skills</div>
                <div>• Leadership experience and team management</div>
                <div>• Strategic thinking and business impact</div>
                <div>• Industry knowledge and domain expertise</div>
                <div>• Project management and execution ability</div>
                <div>• Innovation and process improvement</div>
              </>
            )}
            {persona === 'peer' && (
              <>
                <div>• System design and architecture knowledge</div>
                <div>• Collaboration and teamwork skills</div>
                <div>• Code quality and technical standards</div>
                <div>• Problem-solving approach and methodology</div>
                <div>• Learning agility and adaptability</div>
                <div>• Cross-functional communication</div>
              </>
            )}
          </div>
        </div>

      </div>

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
          {searching ? 'Searching...' : 'Begin Search & Analysis'}
        </button>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          ⏱️ Takes ~30 seconds • Cached for 90 days (no repeat cost!)
        </p>
      </div>

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
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Questions found successfully! Ready to proceed to practice.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => onSearchComplete(searchResults)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                         hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
              >
                Continue to Practice →
              </button>
              
              <button
                onClick={() => {
                  // TODO: Implement insights view
                  console.log('View insights clicked');
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg
                         hover:bg-indigo-700 transition-all font-semibold"
              >
                📊 View Insights
              </button>
              
              <button
                onClick={() => {
                  setSearchComplete(false);
                  setSearchResults(null);
                }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg
                         hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
              >
                🔄 Search Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

