'use client';

import { ExternalLink } from 'lucide-react';

export interface ProfileEntity {
  entity: string; // "Company" | "Recruiter: Name" | "Peer: Name"
  facts: string[];
  sources: Array<{ url: string; title: string }>;
}

interface ProfileTableProps {
  profiles: ProfileEntity[];
  dryRun: boolean;
}

export default function ProfileTable({ profiles, dryRun }: ProfileTableProps) {
  if (profiles.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="profile-table">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Company & People Profiles
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Entity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Key Facts</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Sources</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 align-top whitespace-nowrap">
                  {profile.entity}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <ul className="list-disc list-inside space-y-1">
                    {profile.facts.map((fact, j) => (
                      <li key={j}>{fact}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 text-gray-600 align-top">
                  {!dryRun && profile.sources.length > 0 && (
                    <div className="space-y-1" data-testid="ai-sources">
                      {profile.sources.slice(0, 3).map((source, j) => (
                        <a
                          key={j}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {source.title || new URL(source.url).hostname}
                        </a>
                      ))}
                    </div>
                  )}
                  {dryRun && (
                    <span className="text-xs text-gray-400">Dry run</span>
                  )}
                  {!dryRun && profile.sources.length === 0 && (
                    <span className="text-xs text-gray-400">No sources</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

