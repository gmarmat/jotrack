'use client';

import { Check, X } from 'lucide-react';

export interface Keyword {
  term: string;
  inJD: boolean;
  inResume: boolean;
  importance: number; // 0-3
  action: 'add' | 'emphasize' | 'ok';
}

interface HeatmapTableProps {
  keywords: Keyword[];
}

export default function HeatmapTable({ keywords }: HeatmapTableProps) {
  if (keywords.length === 0) return null;

  const getImportanceColor = (importance: number) => {
    if (importance >= 3) return 'bg-red-100 text-red-800';
    if (importance >= 2) return 'bg-yellow-100 text-yellow-800';
    if (importance >= 1) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionBadge = (action: string) => {
    const colors = {
      add: 'bg-red-50 text-red-700 border-red-200',
      emphasize: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ok: 'bg-green-50 text-green-700 border-green-200',
    };
    return colors[action as keyof typeof colors] || colors.ok;
  };

  const getActionText = (action: string, term: string) => {
    switch (action) {
      case 'add':
        return `Add "${term}" to resume with specific examples`;
      case 'emphasize':
        return `Emphasize "${term}" more prominently`;
      case 'ok':
        return 'Good coverage';
      default:
        return action;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="heatmap-table">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Keyword Heatmap
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Keyword</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">In JD?</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">In Resume?</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Importance</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{kw.term}</td>
                <td className="px-4 py-3 text-center">
                  {kw.inJD ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {kw.inResume ? (
                    <Check className="w-5 h-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${getImportanceColor(kw.importance)}`}>
                    {kw.importance}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded border ${getActionBadge(kw.action)}`}>
                    {getActionText(kw.action, kw.term)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-600">
        <strong>Note:</strong> Keywords extracted directly from JD and Resume. Importance based on presence patterns.
        High importance (3) = in JD but missing from resume.
      </p>
    </div>
  );
}

