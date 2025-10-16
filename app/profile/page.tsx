'use client';

import { useState, useEffect } from 'react';
import { User, TrendingUp, Briefcase, Award, Target } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <User size={32} />
              Your Global Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Insights accumulated across all your job applications
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Jobs
          </Link>
        </div>

        {/* Profile Content */}
        {!profile || !profile.profileData ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                No Profile Data Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your profile will build automatically as you:
              </p>
              <ul className="text-left text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Upload resumes and run analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Use Coach Mode to share more about yourself</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Apply to multiple jobs (insights compound!)</span>
                </li>
              </ul>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Your First Job
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-blue-600" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {profile.profileData.totalJobs || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Jobs Analyzed</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <Target className="text-green-600" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {profile.profileData.totalSkills || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Skills Tracked</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <Award className="text-purple-600" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {profile.profileData.totalStories || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">STAR Stories</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-orange-600" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {profile.profileData.avgMatchScore || 0}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Avg Match Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Data */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Profile Data (JSON)
              </h2>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-xs overflow-auto font-mono text-gray-900 dark:text-gray-100 max-h-[600px]">
                {JSON.stringify(profile.profileData, null, 2)}
              </pre>
            </div>

            {/* Coming Soon */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                🚧 Coming Soon
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Visual skills timeline</li>
                <li>• STAR stories library</li>
                <li>• Career trajectory analysis</li>
                <li>• Skill gap identification</li>
                <li>• Interview prep recommendations</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

