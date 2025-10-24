'use client';

import { useState, useEffect } from 'react';
import { History, Eye, GitCompare, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Snapshot {
  id: string;
  persona: string;
  label: string;
  score: number;
  confidence: number;
  flags: string[];
  at: number;
}

interface YourWorkDrawerProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectSnapshot: (snapshot: Snapshot) => void;
}

export default function YourWorkDrawer({ jobId, isOpen, onSelectSnapshot, onClose }: YourWorkDrawerProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<Snapshot[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Load snapshots from coach state
  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, jobId]);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coach/${jobId}/snapshots`);
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSnapshot = (snapshot: Snapshot) => {
    if (selectedSnapshots.length === 0) {
      setSelectedSnapshots([snapshot]);
    } else if (selectedSnapshots.length === 1) {
      setSelectedSnapshots([...selectedSnapshots, snapshot]);
      setShowCompare(true);
    } else {
      setSelectedSnapshots([snapshot]);
    }
  };

  const handleCompare = () => {
    if (selectedSnapshots.length === 2) {
      setShowCompare(true);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPersonaIcon = (persona: string) => {
    switch (persona) {
      case 'recruiter': return '🤝';
      case 'hiring-manager': return '💼';
      case 'peer': return '👥';
      default: return '👤';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Work</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No snapshots yet</p>
                <p className="text-sm">Save your first answer to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    data-testid="snapshot-card"
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedSnapshots.some(s => s.id === snapshot.id)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                    }`}
                    onClick={() => handleSelectSnapshot(snapshot)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getPersonaIcon(snapshot.persona)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {snapshot.persona === 'hiring-manager' ? 'Hiring Manager' : snapshot.persona}
                          </span>
                          <span className={`text-sm font-semibold ${getScoreColor(snapshot.score)}`}>
                            {snapshot.score}/100
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {snapshot.label}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Confidence: {Math.round(snapshot.confidence * 100)}%</span>
                          <span>{formatDate(snapshot.at)}</span>
                        </div>
                        {(snapshot.flags ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(snapshot.flags ?? []).slice(0, 3).map((flag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSnapshot(snapshot);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedSnapshots.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedSnapshots.length} selected
                </span>
                <div className="flex gap-2">
                  {selectedSnapshots.length === 2 && (
                    <button
                      onClick={handleCompare}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      <GitCompare className="w-4 h-4" />
                      Compare
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSnapshots([])}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compare Modal */}
      {showCompare && selectedSnapshots.length === 2 && (
        <SnapshotCompareModal
          snapshots={selectedSnapshots}
          onClose={() => {
            setShowCompare(false);
            setSelectedSnapshots([]);
          }}
        />
      )}
    </>
  );
}

// Snapshot Compare Modal Component
function SnapshotCompareModal({ snapshots, onClose }: { snapshots: Snapshot[]; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getPersonaIcon = (persona: string) => {
    switch (persona) {
      case 'recruiter': return '🤝';
      case 'hiring-manager': return '💼';
      case 'peer': return '👥';
      default: return '👤';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreDelta = () => {
    return snapshots[1].score - snapshots[0].score;
  };

  const getConfidenceDelta = () => {
    return snapshots[1].confidence - snapshots[0].confidence;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4" data-testid="snapshot-compare-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Snapshot Comparison</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {snapshots.map((snapshot, index) => (
              <div key={snapshot.id} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{getPersonaIcon(snapshot.persona)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {snapshot.persona === 'hiring-manager' ? 'Hiring Manager' : snapshot.persona}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{snapshot.label}</p>
                  </div>
                </div>

                {/* Score Comparison */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(snapshot.score)}`}>
                      {snapshot.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        snapshot.score >= 80 ? 'bg-green-500' :
                        snapshot.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${snapshot.score}%` }}
                    />
                  </div>
                </div>

                {/* Confidence */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</span>
                    <span className="text-lg font-bold text-blue-600">
                      {Math.round(snapshot.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${snapshot.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Flags/Issues */}
                {snapshot.flags.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Areas to Improve</h5>
                    <div className="flex flex-wrap gap-1">
                      {snapshot.flags.map((flag, flagIndex) => (
                        <span
                          key={flagIndex}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Delta Summary */}
          <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Comparison Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {getScoreDelta() > 0 ? '+' : ''}{getScoreDelta()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score Change</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getConfidenceDelta() > 0 ? '+' : ''}{Math.round(getConfidenceDelta() * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Confidence Change</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
