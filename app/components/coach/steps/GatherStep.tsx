'use client';

import { useState, useEffect } from 'react';
import { FileText, Link as LinkIcon, Upload, User, Users, Building2, Sparkles } from 'lucide-react';
import ResumeJdPreview from '../ResumeJdPreview';
import TokenOptimizer from '../TokenOptimizer';
import URLFetchField from '../URLFetchField';
import DynamicList from '../DynamicList';

interface GatherStepProps {
  jobId: string;
  data: any;
  onUpdate: (updates: any) => void;
  onComplete: () => void;
}

export default function GatherStep({ jobId, data, onUpdate, onComplete }: GatherStepProps) {
  const [jobDescription, setJobDescription] = useState(data.jobDescription || '');
  const [jdUrl, setJdUrl] = useState('');
  const [resume, setResume] = useState(data.resume || '');
  const [recruiterUrl, setRecruiterUrl] = useState(data.recruiterUrl || '');
  const [recruiterProfile, setRecruiterProfile] = useState(data.recruiterProfile || '');
  const [peerUrls, setPeerUrls] = useState<Array<{url: string; role?: string}>>(data.peerUrls || []);
  const [skipLevelUrls, setSkipLevelUrls] = useState<Array<{url: string; role?: string}>>(
    (data.skipLevelUrls || []).map((url: string) => typeof url === 'string' ? { url, role: '' } : url)
  );
  const [otherCompanyUrls, setOtherCompanyUrls] = useState<Array<{url: string; role?: string}>>(
    (data.otherCompanyUrls || []).map((url: string) => typeof url === 'string' ? { url, role: '' } : url)
  );
  
  const [aiConfigured, setAiConfigured] = useState(false);
  const [checkingAiStatus, setCheckingAiStatus] = useState(true);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Sync local state changes to parent (for auto-save)
  useEffect(() => {
    onUpdate({
      jobDescription,
      resume,
      recruiterUrl,
      recruiterProfile,
      peerUrls,
      skipLevelUrls,
      otherCompanyUrls,
    });
  }, [jobDescription, resume, recruiterUrl, recruiterProfile, peerUrls, skipLevelUrls, otherCompanyUrls]);

  // Check AI configuration status
  useEffect(() => {
    const checkAiStatus = async () => {
      try {
      const res = await fetch('/api/ai/keyvault/status');
      const data = await res.json();
      setAiConfigured(data.hasApiKey && data.networkEnabled);
      } catch (error) {
        console.error('Failed to check AI status:', error);
      } finally {
        setCheckingAiStatus(false);
      }
    };
    checkAiStatus();
  }, []);

  const handleAnalyzeAll = async () => {
    if (!jobDescription.trim() || !resume.trim()) {
      setAnalyzeError('Please fill in both Job Description and Resume');
      return;
    }

    setIsAnalyzingAll(true);
    setAnalyzeError(null);

    try {
      const res = await fetch('/api/ai/analyze-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobDescription,
          resume,
          companyName: data.companyName || '',
          companyUrls: otherCompanyUrls.map(u => u.url),
          recruiterUrl,
          peerUrls: peerUrls.map(p => p.url),
          skipLevelUrls: skipLevelUrls.map(s => s.url),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await res.json();
      alert('All analyses complete! Navigate through the wizard to see results.');
      onComplete(); // Move to next step
    } catch (error: any) {
      setAnalyzeError(error.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const handleAnalyze = () => {
    if (!jobDescription.trim() || !resume.trim()) {
      alert('Please provide both Job Description and Resume');
      return;
    }

    onUpdate({
      jobDescription,
      resume,
      recruiterUrl,
      peerUrls,
      skipLevelUrls,
      otherCompanyUrls,
    });
    onComplete();
  };


  return (
    <div className="space-y-6" data-testid="gather-step">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gather Sources</h2>
        <p className="text-gray-600">
          Provide the job description, your resume, and optional LinkedIn links for context.
        </p>
        
        {/* Conditional AI Status Indicator */}
        {!checkingAiStatus && (
          <div className={`mt-4 p-4 border rounded-lg ${
            aiConfigured 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${aiConfigured ? 'text-green-600' : 'text-blue-600'}`} />
                <div>
                  {aiConfigured ? (
                    <>
                      <h4 className="text-sm font-semibold text-green-900">AI Powered Analysis</h4>
                      <p className="text-sm text-green-700">
                        Your insights will use advanced AI for personalized recommendations.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-semibold text-blue-900">Enable AI for Best Results</h4>
                      <p className="text-sm text-blue-700">
                        Get AI-powered insights by configuring your API key in Settings.
                      </p>
                    </>
                  )}
                </div>
              </div>
              {!aiConfigured && (
                <a
                  href="/settings/ai"
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap"
                  data-testid="enable-ai-link"
                >
                  Configure AI
                </a>
              )}
              {aiConfigured && (
                <button
                  onClick={handleAnalyzeAll}
                  disabled={isAnalyzingAll}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-md hover:from-purple-700 hover:to-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50"
                  data-testid="analyze-all-now-button"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzingAll ? 'animate-pulse' : ''}`} />
                  {isAnalyzingAll ? 'Analyzing...' : 'Analyze All Now'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Analyze All Button (when AI is ready) */}
        {!checkingAiStatus && aiConfigured && (
          <div className="mt-4">
            <button
              onClick={handleAnalyzeAll}
              disabled={!jobDescription.trim() || !resume.trim() || isAnalyzingAll}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold flex items-center justify-center gap-2"
              data-testid="quick-analyze-all"
            >
              <Sparkles className={`w-5 h-5 ${isAnalyzingAll ? 'animate-pulse' : ''}`} />
              {isAnalyzingAll ? 'Analyzing All Data...' : '✨ Run AI Analysis on All Data'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Analyzes company, people, match score, and skills in one go
            </p>
            {analyzeError && (
              <p className="text-sm text-red-600 text-center mt-2">{analyzeError}</p>
            )}
          </div>
        )}
      </div>

      {/* Job Description - Smart Pre-fill */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
        </div>

        <ResumeJdPreview
          label="Job Description"
          jobId={jobId}
          kind="jd"
          value={jobDescription}
          onChange={setJobDescription}
        />

        {jobDescription.trim() && (
          <div className="mt-4">
            <TokenOptimizer
              originalText={jobDescription}
              onOptimize={setJobDescription}
              label="Job Description"
            />
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600">
          <p className="font-medium mb-1">Why this matters:</p>
          <p>
            We analyze the job description to extract key skills, requirements, and company culture
            signals to help you tailor your application.
          </p>
        </div>
      </div>

      {/* Resume - Smart Pre-fill */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Resume</h3>
        </div>

        <ResumeJdPreview
          label="Resume"
          jobId={jobId}
          kind="resume"
          value={resume}
          onChange={setResume}
        />

        {resume.trim() && (
          <div className="mt-4">
            <TokenOptimizer
              originalText={resume}
              onOptimize={setResume}
              label="Resume"
            />
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600">
          <p className="font-medium mb-1">Why this matters:</p>
          <p>
            We compare your resume against the job description to identify strengths, gaps, and
            improvement opportunities.
          </p>
        </div>
      </div>

      {/* Recruiter Profile - Auto-Fetch */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recruiter (Optional)</h3>
        </div>

        <URLFetchField
          label="LinkedIn URL"
          value={recruiterProfile}
          onChange={setRecruiterProfile}
          placeholder="https://linkedin.com/in/recruiter-name"
          testId="gather-recruiter"
        />

        <p className="text-xs text-gray-500 mt-2">
          Auto-fetches profile data or paste manually. Helps understand communication style and technical depth.
        </p>
      </div>

      {/* Peer URLs with roles - Dynamic List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Team Members / Peers (Optional)</h3>
        </div>

        <DynamicList
          label="Peer"
          items={peerUrls}
          onChange={setPeerUrls}
          showRoleField={true}
          placeholder="https://linkedin.com/in/peer-name"
          rolePlaceholder="Role/Title"
          testId="gather-peer"
        />

        <p className="text-xs text-gray-500 mt-3">
          Understand team dynamics and role expectations
        </p>
      </div>

      {/* Skip-level URLs - Dynamic List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Skip-Level / Leadership (Optional)</h3>
        </div>

        <DynamicList
          label="Skip-Level"
          items={skipLevelUrls}
          onChange={setSkipLevelUrls}
          showRoleField={true}
          placeholder="https://linkedin.com/in/manager-name"
          rolePlaceholder="Title"
          testId="gather-skip"
        />

        <p className="text-xs text-gray-500 mt-3">
          Context on strategic priorities and org culture
        </p>
      </div>

      {/* Other Company URLs - Dynamic List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Context Companies (Optional)</h3>
        </div>

        <DynamicList
          label="Company"
          items={otherCompanyUrls}
          onChange={setOtherCompanyUrls}
          showRoleField={false}
          placeholder="https://company.com or LinkedIn company page"
          testId="gather-company"
        />

        <p className="text-xs text-gray-500 mt-3">
          Competitors, partners, or similar companies for context (max 3 recommended)
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAnalyze}
          disabled={!jobDescription.trim() || !resume.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="analyze-button"
        >
          Analyze →
        </button>
      </div>
    </div>
  );
}

