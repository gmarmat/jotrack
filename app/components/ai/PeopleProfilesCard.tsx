'use client';

import { Users, User, ExternalLink, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import PromptViewer from './PromptViewer';
import { LoadingShimmerCard } from '../LoadingShimmer';
import SourcesModal, { type Source } from './SourcesModal';
import AnalyzeButton from './AnalyzeButton';
import AnalysisExplanation from '../ui/AnalysisExplanation';
import CleanPeopleModal from '../people/CleanPeopleModal';

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
  analyzedAt?: number; // Timestamp when analysis was performed
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
  isAiPowered,
  analyzedAt 
}: PeopleProfilesCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localProfiles, setLocalProfiles] = useState<PersonProfile[] | null>(profiles);
  const [localInsights, setLocalInsights] = useState(overallInsights);
  const [error, setError] = useState<string | null>(null);

  // Format analyzed time
  const formatAnalyzedTime = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showCleanPeopleModal, setShowCleanPeopleModal] = useState(false);
  const [peopleCount, setPeopleCount] = useState(0);
  const [rawPeople, setRawPeople] = useState<any[]>([]);
  const [unoptimizedCount, setUnoptimizedCount] = useState(0);
  
  // Load people count and raw data on mount
  useEffect(() => {
    loadPeopleData();
  }, [jobId]);
  
  const loadPeopleData = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/people/manage`);
      const data = await res.json();
      if (data.success) {
        const people = data.people || [];
        setPeopleCount(people.length);
        setRawPeople(people);
        
        // Count unoptimized profiles
        const unoptimized = people.filter((p: any) => !p.isOptimized || p.isOptimized === 0).length;
        setUnoptimizedCount(unoptimized);
        
        console.log('📊 Loaded people data:', {
          total: people.length,
          optimized: people.length - unoptimized,
          unoptimized
        });
      }
    } catch (err) {
      console.error('Failed to load people data:', err);
    }
  };
  
  // Mock sources - in real implementation, from analysis data
  const sources: Source[] = [
    ...(recruiterUrl ? [{
      url: recruiterUrl,
      title: 'Recruiter LinkedIn Profile',
      type: 'linkedin' as const,
      dateAccessed: new Date().toISOString(),
      relevance: 'Primary recruiter contact'
    }] : []),
    ...peerUrls.map((url, idx) => ({
      url,
      title: `Peer LinkedIn Profile ${idx + 1}`,
      type: 'linkedin' as const,
      dateAccessed: new Date().toISOString(),
      relevance: 'Potential peer/teammate'
    })),
    ...skipLevelUrls.map((url, idx) => ({
      url,
      title: `Skip-Level Manager Profile ${idx + 1}`,
      type: 'linkedin' as const,
      dateAccessed: new Date().toISOString(),
      relevance: 'Leadership/management chain'
    }))
  ];

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

  // Priority sorting: recruiter > hiring_manager > peer > other
  const rolePriority = {
    'recruiter': 1,
    'hiring_manager': 2,
    'peer': 3,
    'other': 4
  };
  
  const allProfiles = localProfiles || profiles || defaultProfiles;
  const sortedProfiles = [...allProfiles].sort((a, b) => {
    const aPriority = rolePriority[a.role?.toLowerCase().replace(/\s/g, '_') as keyof typeof rolePriority] || 99;
    const bPriority = rolePriority[b.role?.toLowerCase().replace(/\s/g, '_') as keyof typeof rolePriority] || 99;
    return aPriority - bPriority;
  });
  
  // Limit to 4 profiles (2x2 grid) for display
  const displayProfiles = sortedProfiles.slice(0, 4);
  const hasMoreProfiles = sortedProfiles.length > 4;
  const totalProfiles = sortedProfiles.length;
  
  const displayInsights = localInsights || overallInsights || defaultInsights;

  const handleAnalyze = async () => {
    // Validate required data
    if (!jobDescription || jobDescription.trim() === '') {
      setError('Job Description is required for people analysis. Please add it in Coach Mode or upload a JD attachment.');
      return;
    }
    
    // Check if any people have been added
    const response = await fetch(`/api/jobs/${jobId}/people/manage`);
    if (response.ok) {
      const data = await response.json();
      if (!data.people || data.people.length === 0) {
        setError('No people profiles added yet. Click "Manage People" to add interview team members first.');
        return;
      }
      console.log(`📊 Found ${data.people.length} people for analysis`);
      
      // NEW: Check if all profiles are optimized
      const unoptimized = data.people.filter((p: any) => !p.isOptimized || p.isOptimized === 0).length;
      if (unoptimized > 0) {
        setError(
          `${unoptimized} profile${unoptimized > 1 ? 's are' : ' is'} not optimized yet. ` +
          `Click "Manage People" and click the Zap (⚡) icon to optimize all profiles before running analysis.`
        );
        return;
      }
    }
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const apiResponse = await fetch('/api/ai/people-analysis', {
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

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error Response:', {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Analysis failed (${apiResponse.status})`);
      }

      const data = await apiResponse.json();
      console.log('✅ AI Analysis Success:', data);
      setLocalProfiles(data.profiles);
      setLocalInsights(data.overallInsights);
    } catch (err: any) {
      console.error('❌ People analysis error:', {
        message: err.message,
        stack: err.stack,
        fullError: err
      });
      setError(`AI analysis failed: ${err.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 p-6" data-testid="people-profiles-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          People Profiles
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Analyzed badge or Sample Data badge - right before buttons */}
          {analyzedAt ? (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Analyzed {formatAnalyzedTime(analyzedAt)}
            </span>
          ) : profiles && profiles.length > 0 ? (
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              Sample Data
            </span>
          ) : null}

          {/* Standard button order: Manage -> Analyze -> Prompt -> Sources */}
          
          {/* Manage People - Position 0 (NEW) */}
          <button
            onClick={() => setShowCleanPeopleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-cyan-300 dark:border-cyan-600 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 font-medium"
            title="Add or remove people from interview team"
          >
            <UserPlus size={14} />
            <span className="text-xs">Manage People</span>
            {peopleCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-xs font-semibold">
                {peopleCount}
              </span>
            )}
          </button>
          
          {/* AI Analysis - Position 1 */}
          <AnalyzeButton
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            label="Analyze People Profiles"
            estimatedCost={0.06}
            estimatedSeconds={45}
          />

          {/* View Prompt - Position 2 */}
          <PromptViewer 
            promptKind="people" 
            version="v1"
            buttonLabel=""
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          />

          {/* View Sources - Position 3 */}
          <button
            onClick={() => setShowSourcesModal(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
            title="View Sources"
            data-testid="sources-button"
          >
            <AlertCircle size={14} />
          </button>
        </div>
      </div>
      
      {/* Sources Modal */}
      <SourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        title="People Profiles Sources"
        sources={sources}
      />

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Compact People Summary (before AI analysis) */}
      {rawPeople.length > 0 && !localProfiles && !profiles && !isAnalyzing && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {rawPeople.length} Team {rawPeople.length === 1 ? 'Member' : 'Members'} Added
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {rawPeople.length - unoptimizedCount} out of {rawPeople.length} ready for analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unoptimizedCount === 0 ? (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Ready
                </span>
              ) : (
                <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle size={12} />
                  {unoptimizedCount} pending
                </span>
              )}
              
              <button
                onClick={() => setShowCleanPeopleModal(true)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Manage →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && !profiles && !localProfiles && (
        <LoadingShimmerCard />
      )}

      {/* Content */}
      {(!isAnalyzing || profiles || localProfiles) && (<>
      {/* Individual Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {displayProfiles.map((person, idx) => {
          // Rotate through subtle background colors for each profile
          const bgColors = [
            'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-900/30',
            'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-900/30',
            'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-900/30',
            'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-900/30',
          ];
          const colorClass = bgColors[idx % bgColors.length];
          
          return (
            <div key={idx} className={`p-4 ${colorClass} rounded-lg border`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <User size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{person.name}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{person.role}</p>
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
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Background:</p>
                <ul className="space-y-0.5">
                  {person.background.map((item, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
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
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Expertise:</p>
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
              <p className="text-xs text-gray-700 dark:text-gray-300 italic">{person.whatThisMeans}</p>
            </div>
            </div>
          );
        })}
      </div>
      
      {/* "View all X profiles" link if more than 4 */}
      {hasMoreProfiles && (
        <div className="text-center mb-6">
          <button
            onClick={() => setShowCleanPeopleModal(true)}
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium inline-flex items-center gap-1"
          >
            <Users size={14} />
            View all {totalProfiles} profiles
          </button>
        </div>
      )}

      {/* Overall Insights */}
      {displayInsights && (
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Team Dynamics:</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">{displayInsights.teamDynamics}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">Cultural Fit:</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">{displayInsights.culturalFit}</p>
          </div>

          {displayInsights.preparationTips && displayInsights.preparationTips.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Preparation Tips:</p>
              <ol className="list-decimal list-inside space-y-1">
                {displayInsights.preparationTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-gray-700 dark:text-gray-300">{tip}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Standard Analysis Explanation - 2nd Last Position */}
      <AnalysisExplanation>
        <p>
          We analyze LinkedIn profiles of people you'll interview with (recruiters, hiring managers, 
          peers, skip-levels) to help you understand their backgrounds, communication styles, 
          and what they might value in a candidate.
        </p>
        
        <div>
          <p className="font-semibold mb-2">Our Analysis Methodology:</p>
          <ul className="space-y-1 text-xs">
            <li>• Profile Analysis: Education, career path, notable achievements from LinkedIn</li>
            <li>• Communication Style: Tech depth, formality, preferred topics (from posts/articles)</li>
            <li>• Common Ground: Shared schools, companies, interests, mutual connections</li>
            <li>• What They Value: Patterns from their career choices, posts, endorsements</li>
            <li>• Interview Prep: Suggested questions, talking points, topics to avoid</li>
          </ul>
        </div>
        
        <div>
          <p className="font-semibold mb-2">How to Use This:</p>
          <ul className="space-y-1 text-xs">
            <li>• Add LinkedIn profile URLs for each person you'll interview with</li>
            <li>• Review their background to find common ground</li>
            <li>• Tailor your communication style to match theirs</li>
            <li>• Prepare questions that align with their expertise and interests</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Note: Analysis is based on publicly available LinkedIn profile information.
        </p>
      </AnalysisExplanation>

      {/* Why This Matters - Last Position */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Understanding the people you'll interview with helps you tailor your communication style,
          prepare relevant questions, and build rapport based on their background and interests.
        </p>
      </div>
      </>)}
      
      {/* Manage People Modal */}
      <CleanPeopleModal
        jobId={jobId}
        isOpen={showCleanPeopleModal}
        onClose={() => setShowCleanPeopleModal(false)}
        onSave={() => {
          loadPeopleData(); // Refresh people data (count + raw profiles)
          setShowCleanPeopleModal(false);
        }}
      />
      
      {/* Sources Modal */}
      <SourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        sources={sources}
        title="People Profiles Sources"
      />
    </div>
  );
}

