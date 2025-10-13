'use client';

import { useState, useEffect } from 'react';
import { Building2, User, Users, Loader2, RefreshCw } from 'lucide-react';
import AiSources from '../AiSources';
import ProfileTable, { ProfileEntity } from '../tables/ProfileTable';

interface ProfileStepProps {
  jobId: string;
  data: any;
  onUpdate: (updates: any) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function ProfileStep({ jobId, data, onUpdate, onComplete, onBack }: ProfileStepProps) {
  const [loading, setLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(data.companyProfile || null);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(data.recruiterProfile || null);
  const [peerProfiles, setPeerProfiles] = useState<any[]>(data.peerProfiles || []);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    // Auto-analyze when entering this step if not already done
    if (!companyProfile && data.jobDescription) {
      analyzeProfiles();
    }
  }, []);

  const analyzeProfiles = async () => {
    setLoading(true);

    try {
      // Analyze company profile
      const companyResponse = await fetch('/api/ai/analyze?dryRun=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          capability: 'company_profile',
          inputs: {
            companyName: extractCompanyName(data.jobDescription),
            context: data.jobDescription,
          },
          promptVersion: 'v1',
        }),
      });

      const companyData = await companyResponse.json();
      setCompanyProfile(companyData.result);
      
      // Extract sources from meta
      const metaSources = ['Job Description'];
      if (data.recruiterLinks?.length) metaSources.push(...data.recruiterLinks.slice(0, 2));
      if (data.peerLinks?.length) metaSources.push(...data.peerLinks.slice(0, 1));
      setSources(metaSources.slice(0, 3));

      // Analyze recruiter profile if provided
      if (data.recruiterLinks && data.recruiterLinks.length > 0) {
        const recruiterResponse = await fetch('/api/ai/analyze?dryRun=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            capability: 'recruiter_profile',
            inputs: {
              recruiterName: 'Recruiter',
              linkedinUrl: data.recruiterLinks[0],
            },
            promptVersion: 'v1',
          }),
        });

        const recruiterData = await recruiterResponse.json();
        setRecruiterProfile(recruiterData.result);
      }

      // Analyze peer profiles if provided
      if (data.peerLinks && data.peerLinks.length > 0) {
        const peerProfiles = [];
        for (const peerLink of data.peerLinks.slice(0, 3)) {
          peerProfiles.push({
            name: 'Peer',
            title: 'Team Member',
            summary: 'Experienced professional [DRY RUN]',
          });
        }
        setPeerProfiles(peerProfiles);
      }

      onUpdate({ companyProfile: companyData.result, recruiterProfile: recruiterProfile, peerProfiles });
    } catch (error) {
      console.error('Error analyzing profiles:', error);
      alert('Failed to analyze profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractCompanyName = (jd: string): string => {
    // Simple extraction - could be enhanced
    const lines = jd.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('company') || line.toLowerCase().includes('about us')) {
        return line.split(':')[1]?.trim() || 'Company';
      }
    }
    return 'Company';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="profile-loading">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing profiles...</p>
        </div>
      </div>
    );
  }

  // v1.1: Build structured profile data for table view
  const profileEntities: ProfileEntity[] = [];
  
  if (companyProfile) {
    profileEntities.push({
      entity: 'Company',
      facts: [
        `${companyProfile.industry || 'Technology'} • ${companyProfile.sizeBucket || 'Unknown size'}`,
        `HQ: ${companyProfile.hqCity || 'N/A'}, ${companyProfile.hqState || ''} ${companyProfile.hqCountry || ''}`.trim(),
        companyProfile.summary || 'No summary available',
        ...(companyProfile.principles || []).map((p: string) => `Principle: ${p}`),
      ].filter(Boolean),
      sources: sources.map(s => ({ url: s, title: s.includes('http') ? new URL(s).hostname : s })),
    });
  }

  if (recruiterProfile) {
    profileEntities.push({
      entity: `Recruiter: ${recruiterProfile.name || 'Unknown'}`,
      facts: [
        recruiterProfile.title || 'Recruiter',
        `Tech Depth: ${recruiterProfile.techDepth || 'Unknown'}`,
        recruiterProfile.summary || '',
        `Persona: ${recruiterProfile.persona || ''}`,
      ].filter(Boolean),
      sources: [],
    });
  }

  peerProfiles.forEach((peer: any, i: number) => {
    profileEntities.push({
      entity: `Peer ${i + 1}: ${peer.name || 'Unknown'}`,
      facts: [
        peer.title || 'Team Member',
        peer.summary || '',
      ].filter(Boolean),
      sources: [],
    });
  });

  const useTableView = profileEntities.length > 0;

  return (
    <div className="space-y-6" data-testid="profile-step">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Company & People Profiles</h2>
          <p className="text-gray-600">
            Understanding the company culture and key people you&apos;ll interact with.
          </p>
        </div>
        {companyProfile && (
          <button
            onClick={analyzeProfiles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            title="Refresh analysis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* v1.1: Use ProfileTable if we have structured data */}
      {useTableView && (
        <ProfileTable profiles={profileEntities} dryRun={true} />
      )}

      {/* Company Profile */}
      {companyProfile && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900">{companyProfile.name}</h4>
              <p className="text-sm text-gray-600">
                {companyProfile.industry} • {companyProfile.sizeBucket} employees
              </p>
              <p className="text-sm text-gray-600">
                📍 {companyProfile.hqCity}, {companyProfile.hqState}, {companyProfile.hqCountry}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-700">{companyProfile.summary}</p>
            </div>

            {companyProfile.principles && companyProfile.principles.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Core Principles</h5>
                <div className="flex flex-wrap gap-2">
                  {companyProfile.principles.map((principle: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {principle}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <AiSources sources={sources} />
          </div>
        </div>
      )}

      {/* Recruiter Profile */}
      {recruiterProfile && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recruiter Profile</h3>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900">{recruiterProfile.name}</h4>
              <p className="text-sm text-gray-600">{recruiterProfile.title}</p>
            </div>

            <div>
              <p className="text-sm text-gray-700">{recruiterProfile.summary}</p>
            </div>

            <div className="bg-gray-50 rounded-md p-3">
              <h5 className="text-sm font-semibold text-gray-900 mb-1">Communication Persona</h5>
              <p className="text-sm text-gray-700">{recruiterProfile.persona}</p>
            </div>
          </div>
        </div>
      )}

      {/* Peer Profiles */}
      {peerProfiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          </div>

          <div className="space-y-4">
            {peerProfiles.map((peer, i) => (
              <div key={i} className="border-l-2 border-blue-200 pl-4">
                <h4 className="font-semibold text-gray-900">{peer.name}</h4>
                <p className="text-sm text-gray-600">{peer.title}</p>
                <p className="text-sm text-gray-700 mt-1">{peer.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          onClick={onComplete}
          disabled={!companyProfile}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="profile-next-button"
        >
          Next: Fit Analysis →
        </button>
      </div>
    </div>
  );
}

