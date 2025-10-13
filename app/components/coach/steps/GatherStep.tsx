'use client';

import { useState } from 'react';
import { FileText, Link as LinkIcon, Upload, User, Users, Building2 } from 'lucide-react';

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
  const [peerUrls, setPeerUrls] = useState<Array<{url: string; role: string}>>(data.peerUrls || []);
  const [skipLevelUrls, setSkipLevelUrls] = useState<string[]>(data.skipLevelUrls || []);
  const [otherCompanyUrls, setOtherCompanyUrls] = useState<string[]>(data.otherCompanyUrls || []);
  
  const [currentPeerUrl, setCurrentPeerUrl] = useState('');
  const [currentPeerRole, setCurrentPeerRole] = useState('');
  const [currentSkipUrl, setCurrentSkipUrl] = useState('');
  const [currentOtherCoUrl, setCurrentOtherCoUrl] = useState('');

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

  const addPeer = () => {
    if (currentPeerUrl.trim()) {
      setPeerUrls([...peerUrls, { url: currentPeerUrl.trim(), role: currentPeerRole.trim() || 'Peer' }]);
      setCurrentPeerUrl('');
      setCurrentPeerRole('');
    }
  };

  const addSkipLevel = () => {
    if (currentSkipUrl.trim()) {
      setSkipLevelUrls([...skipLevelUrls, currentSkipUrl.trim()]);
      setCurrentSkipUrl('');
    }
  };

  const addOtherCompany = () => {
    if (currentOtherCoUrl.trim()) {
      setOtherCompanyUrls([...otherCompanyUrls, currentOtherCoUrl.trim()]);
      setCurrentOtherCoUrl('');
    }
  };

  return (
    <div className="space-y-6" data-testid="gather-step">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gather Sources</h2>
        <p className="text-gray-600">
          Provide the job description, your resume, and optional LinkedIn links for context.
        </p>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste JD or enter URL
            </label>
            <input
              type="text"
              placeholder="https://company.com/job-posting"
              value={jdUrl}
              onChange={e => setJdUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="jd-url-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or paste text directly
            </label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the job description here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              data-testid="jd-textarea"
            />
          </div>
        </div>

        <details className="mt-3">
          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
            Why this matters
          </summary>
          <p className="text-sm text-gray-600 mt-2">
            We analyze the job description to extract key skills, requirements, and company culture
            signals to help you tailor your application.
          </p>
        </details>
      </div>

      {/* Resume */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Resume</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paste resume text
          </label>
          <textarea
            value={resume}
            onChange={e => setResume(e.target.value)}
            rows={10}
            placeholder="Paste your resume here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            data-testid="resume-textarea"
          />
        </div>
      </div>

      {/* Recruiter URL */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recruiter (Optional)</h3>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            LinkedIn URL or paste profile
          </label>
          <input
            type="text"
            placeholder="https://linkedin.com/in/recruiter-name"
            value={recruiterUrl}
            onChange={e => setRecruiterUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="gather-recruiter-url"
          />
          <p className="text-xs text-gray-500">
            Helps understand communication style and technical depth
          </p>
        </div>
      </div>

      {/* Peer URLs with roles */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Team Members / Peers (Optional)</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[1fr,auto,auto] gap-2">
            <input
              type="text"
              placeholder="https://linkedin.com/in/peer-name"
              value={currentPeerUrl}
              onChange={e => setCurrentPeerUrl(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addPeer()}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="gather-peer-url"
            />
            <input
              type="text"
              placeholder="Role (optional)"
              value={currentPeerRole}
              onChange={e => setCurrentPeerRole(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addPeer()}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={addPeer}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {peerUrls.length > 0 && (
            <ul className="space-y-1">
              {peerUrls.map((peer, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <LinkIcon className="w-4 h-4" />
                  <span className="flex-1 truncate">{peer.url}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{peer.role}</span>
                  <button
                    onClick={() => setPeerUrls(peerUrls.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500">
            Understand team dynamics and role expectations
          </p>
        </div>
      </div>

      {/* Skip-level URLs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Skip-Level / Leadership (Optional)</h3>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://linkedin.com/in/manager-name"
              value={currentSkipUrl}
              onChange={e => setCurrentSkipUrl(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addSkipLevel()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="gather-skip-url"
            />
            <button
              onClick={addSkipLevel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {skipLevelUrls.length > 0 && (
            <ul className="space-y-1">
              {skipLevelUrls.map((url, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <LinkIcon className="w-4 h-4" />
                  <span className="flex-1 truncate">{url}</span>
                  <button
                    onClick={() => setSkipLevelUrls(skipLevelUrls.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500">
            Context on strategic priorities and org culture
          </p>
        </div>
      </div>

      {/* Other Company URLs (Context Triad) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Context Companies (Optional)</h3>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://company.com or LinkedIn company page"
              value={currentOtherCoUrl}
              onChange={e => setCurrentOtherCoUrl(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addOtherCompany()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="gather-otherco-url"
            />
            <button
              onClick={addOtherCompany}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {otherCompanyUrls.length > 0 && (
            <ul className="space-y-1">
              {otherCompanyUrls.map((url, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <Building2 className="w-4 h-4" />
                  <span className="flex-1 truncate">{url}</span>
                  <button
                    onClick={() => setOtherCompanyUrls(otherCompanyUrls.filter((_, idx) => idx !== i))}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500">
            Competitors, partners, or similar companies for context (max 3 recommended)
          </p>
        </div>
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

