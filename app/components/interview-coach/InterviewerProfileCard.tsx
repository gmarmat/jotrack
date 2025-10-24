'use client';

import { useState, useEffect } from 'react';
import { User, Target, Heart, Brain, Users } from 'lucide-react';

interface InterviewerProfile {
  id: string;
  name: string;
  role: string;
  values: string[];
  focusAreas: string[];
  communicationStyle: string;
  decisionFactors: string[];
  experience: string;
}

interface InterviewerProfileCardProps {
  jobId: string;
  persona: 'recruiter' | 'hiring-manager' | 'peer';
}

export default function InterviewerProfileCard({ jobId, persona }: InterviewerProfileCardProps) {
  const [profiles, setProfiles] = useState<InterviewerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<InterviewerProfile | null>(null);

  useEffect(() => {
    loadInterviewerProfiles();
  }, [jobId]);

  const loadInterviewerProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/interviewer-profiles`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
        
        // Auto-select profile based on persona
        const matchingProfile = data.profiles?.find((p: InterviewerProfile) => 
          p.role.toLowerCase().includes(persona.replace('-', ' '))
        );
        if (matchingProfile) {
          setSelectedProfile(matchingProfile);
        }
      }
    } catch (error) {
      console.error('Failed to load interviewer profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPersonaIcon = (persona: string) => {
    switch (persona) {
      case 'recruiter': return '🤝';
      case 'hiring-manager': return '💼';
      case 'peer': return '👥';
      default: return '👤';
    }
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case 'recruiter': return 'text-blue-600';
      case 'hiring-manager': return 'text-purple-600';
      case 'peer': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return null; // Don't show card if no profiles
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4" data-testid="interviewer-profile-card">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Interviewer Profile</h3>
      </div>

      {selectedProfile ? (
        <div className="space-y-3">
          {/* Profile Header */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{getPersonaIcon(persona)}</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedProfile.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProfile.role}
              </div>
            </div>
          </div>

          {/* Values */}
          {selectedProfile.values && selectedProfile.values.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Values</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedProfile.values.slice(0, 3).map((value, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-full"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {selectedProfile.focusAreas && selectedProfile.focusAreas.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Focus Areas</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedProfile.focusAreas.slice(0, 3).map((area, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Communication Style */}
          {selectedProfile.communicationStyle && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Brain className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Communication Style</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProfile.communicationStyle}
              </p>
            </div>
          )}

          {/* Decision Factors */}
          {selectedProfile.decisionFactors && selectedProfile.decisionFactors.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Decision Factors</span>
              </div>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {selectedProfile.decisionFactors.slice(0, 2).map((factor, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Experience */}
          {selectedProfile.experience && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Experience:</span> {selectedProfile.experience}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No interviewer profile available</p>
        </div>
      )}

      {/* Profile Selector */}
      {profiles.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Switch Profile:</div>
          <div className="flex gap-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedProfile?.id === profile.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {profile.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
