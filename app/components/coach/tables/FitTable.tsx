'use client';

import { ChevronDown, ChevronUp, Info, RefreshCw, Code, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import AiSources from '../AiSources';
import ProviderBadge from '../ProviderBadge';

interface FitDimension {
  param: string;
  weight: number;
  jdEvidence: string;
  resumeEvidence: string;
  score: number;
  reasoning: string;
  sources?: string[];
}

interface FitTableProps {
  overall: number;
  threshold: number;
  breakdown: FitDimension[];
  sources: string[];
  dryRun: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  rawJson?: any; // v1.3: Optional raw JSON for debugging
}

export default function FitTable({ overall, threshold, breakdown, sources, dryRun, onRefresh, refreshing = false, rawJson }: FitTableProps) {
  const [showExplain, setShowExplain] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false); // v1.3: JSON debug toggle

  const scoreLevel = overall >= threshold ? 'Great' : overall >= threshold * 0.8 ? 'Medium' : 'Low';
  const scoreColor = overall >= threshold ? 'text-green-600' : overall >= threshold * 0.8 ? 'text-yellow-600' : 'text-red-600';

  const topContributors = [...breakdown]
    .sort((a, b) => (b.weight * b.score) - (a.weight * a.score))
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="fit-table">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Fit Matrix (25 Parameters)
            </h3>
            <ProviderBadge provider={dryRun ? 'local' : 'remote'} />
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="ml-auto flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                title="Refresh analysis"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Fit (estimate): {(overall * 100).toFixed(0)}%. Calculated from 25 job-relevant signals found <strong>only in your JD/Resume</strong>.
            {' '}See &apos;Explain&apos; for details.
          </p>
        </div>
        <div className={`text-3xl font-bold ${scoreColor}`}>
          {(overall * 100).toFixed(0)}%
        </div>
      </div>

      {/* Explain Accordion */}
      <button
        onClick={() => setShowExplain(!showExplain)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
        data-testid="fit-explain"
      >
        {showExplain ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span>Explain: How we calculated this</span>
      </button>

      {showExplain && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">
          <p className="font-semibold text-gray-900 mb-2">Formula</p>
          <code className="block bg-white p-2 rounded border mb-3 font-mono text-xs">
            Overall FIT = Σ(weight_i × score_i) for i=1 to 25
          </code>
          
          <p className="font-semibold text-gray-900 mb-2">Top 3 Contributors</p>
          <ul className="space-y-1">
            {topContributors.map((item, i) => (
              <li key={i} className="text-gray-700">
                <span className="font-medium">{item.param}</span>: 
                {` ${(item.weight * 100).toFixed(0)}% weight × ${(item.score * 100).toFixed(0)}% score = ${(item.weight * item.score * 100).toFixed(1)}% contribution`}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-gray-600">
            Threshold: {(threshold * 100).toFixed(0)}%. 
            Your score is <strong>{scoreLevel}</strong> ({overall >= threshold ? 'above' : 'below'} threshold).
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Parameter</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Weight</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">JD Evidence</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Resume Evidence</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Score</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Notes</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.param}</td>
                <td className="px-4 py-3 text-center text-gray-600">{(item.weight * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={item.jdEvidence}>
                  {item.jdEvidence}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={item.resumeEvidence}>
                  {item.resumeEvidence}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${item.score * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-900 font-medium">{(item.score * 100).toFixed(0)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {item.reasoning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sources */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          {!dryRun && sources.length > 0 && <AiSources sources={sources} />}
          
          {/* v1.3: Unverified badge when remote but no sources */}
          {!dryRun && sources.length === 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full" data-testid="unverified-badge">
              <AlertCircle className="w-3 h-3" />
              Unverified (no sources)
            </div>
          )}
          
          {dryRun && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              <Info className="w-3 h-3" />
              Local fixture (no sources)
            </div>
          )}
        </div>

        {/* v1.3: Show raw JSON toggle */}
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          data-testid="toggle-raw-json"
          title="Show raw JSON response (for debugging)"
        >
          <Code className="w-3 h-3" />
          {showRawJson ? 'Hide' : 'Show'} JSON
        </button>
      </div>

      {/* v1.3: Raw JSON display */}
      {showRawJson && (
        <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-xs font-mono max-h-96" data-testid="raw-json-display">
          <pre>{JSON.stringify(rawJson || { fit: { overall, threshold, breakdown }, sources }, null, 2)}</pre>
        </div>
      )}

      {/* Why This Matters */}
      <details className="mt-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
          Why this matters
        </summary>
        <p className="text-sm text-gray-600 mt-2">
          The fit matrix evaluates your profile against 25 job-relevant dimensions, weighted by importance. 
          Scores above {(threshold * 100).toFixed(0)}% indicate strong alignment. Focus on low-scoring high-weight parameters for maximum impact.
        </p>
      </details>
    </div>
  );
}

