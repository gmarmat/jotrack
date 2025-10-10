"use client";

import { useEffect, useState } from "react";
import { JobStatus } from "@/lib/status";
import { allowsMultipleInterviewers } from "@/lib/statusJourney";
import type { InterviewerBlock } from "@/db/schema";
import { Plus, X, RefreshCw, GripVertical } from "lucide-react";
import Wordcloud from "./Wordcloud";

interface StatusDetailPanelProps {
  jobId: string;
  status: JobStatus;
}

type StatusDetails = {
  interviewerBlocks: InterviewerBlock[];
  aiBlob: string | null;
  keywordsAuto: string[];
  keywordsManual: string[];
  notes: string;
  notesHistory: Array<{ text: string; timestamp: number }>;
  aiRefreshedAt: number | null;
};

export default function StatusDetailPanel({
  jobId,
  status,
}: StatusDetailPanelProps) {
  const [details, setDetails] = useState<StatusDetails>({
    interviewerBlocks: [],
    aiBlob: null,
    keywordsAuto: [],
    keywordsManual: [],
    notes: "",
    notesHistory: [],
    aiRefreshedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load details
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/jobs/${jobId}/status-details?status=${status}`
        );
        const data = await res.json();
        setDetails(data);
      } catch (error) {
        console.error("Failed to load status details:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId, status]);

  // Save details (debounced autosave happens in real implementation)
  const save = async (updates: Partial<StatusDetails>) => {
    setSaving(true);
    const newDetails = { ...details, ...updates };
    setDetails(newDetails);

    try {
      await fetch(`/api/jobs/${jobId}/status-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...newDetails }),
      });
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  // Interviewer management
  const addInterviewer = () => {
    const newBlock: InterviewerBlock = {
      id: crypto.randomUUID(),
      name: "",
      title: "",
      linkedinUrl: "",
      email: "",
      notes: "",
    };
    save({ interviewerBlocks: [...details.interviewerBlocks, newBlock] });
  };

  const removeInterviewer = (id: string) => {
    save({
      interviewerBlocks: details.interviewerBlocks.filter((b) => b.id !== id),
    });
  };

  const updateInterviewer = (id: string, field: keyof InterviewerBlock, value: string) => {
    const updated = details.interviewerBlocks.map((b) =>
      b.id === id ? { ...b, [field]: value } : b
    );
    save({ interviewerBlocks: updated });
  };

  // Notes management with history
  const updateNotes = (text: string) => {
    const history = details.notesHistory.slice(-2); // Keep last 2
    if (details.notes && details.notes !== text) {
      history.push({ text: details.notes, timestamp: Date.now() });
    }
    save({ notes: text, notesHistory: history });
  };

  const undoNotes = () => {
    const history = details.notesHistory;
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setDetails({
        ...details,
        notes: previous.text,
        notesHistory: history.slice(0, -1),
      });
    }
  };

  // Keyword management
  const addKeyword = (keyword: string) => {
    if (!keyword.trim() || details.keywordsManual.includes(keyword.trim())) return;
    save({ keywordsManual: [...details.keywordsManual, keyword.trim()] });
  };

  const removeKeyword = (keyword: string) => {
    save({ keywordsManual: details.keywordsManual.filter((k) => k !== keyword) });
  };

  // Wordcloud click handler
  const handleWordcloudClick = (word: string) => {
    addKeyword(word);
  };

  // Interviewer reorder (drag and drop)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const blocks = [...details.interviewerBlocks];
    const [draggedBlock] = blocks.splice(draggedIndex, 1);
    blocks.splice(dropIndex, 0, draggedBlock);

    save({ interviewerBlocks: blocks });
    setDraggedIndex(null);
  };

  // AI refresh
  const refreshAI = async () => {
    try {
      const res = await fetch(`/api/ai/dry-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyzer: "status_analysis", jobId, status }),
      });
      const data = await res.json();
      
      save({
        aiBlob: `**Analysis Score:** ${data.sample.score}\n\n**Highlights:**\n${data.sample.highlights.map((h: string) => `- ${h}`).join("\n")}`,
        keywordsAuto: ["React", "TypeScript", "Leadership", "Communication", "Problem-solving"], // From AI
        aiRefreshedAt: Date.now(),
      });
    } catch (error) {
      console.error("AI refresh failed:", error);
    }
  };

  // Export notes
  const exportNotes = () => {
    const exportData = {
      jobId,
      status,
      notes: details.notes,
      interviewers: details.interviewerBlocks,
      keywords: [...details.keywordsAuto, ...details.keywordsManual],
      aiAnalysis: details.aiBlob,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(json);
    alert("Notes exported to clipboard!");
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  const canHaveInterviewers = allowsMultipleInterviewers(status);

  return (
    <div className="bg-white rounded-xl border shadow p-6 space-y-6" data-testid="status-detail-panel">
      {/* Interviewer Blocks */}
      {canHaveInterviewers && (
        <section data-testid="interviewer-section">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Interviewers</h3>
            <button
              onClick={addInterviewer}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              data-testid="add-interviewer"
            >
              <Plus size={14} />
              Add Interviewer
            </button>
          </div>

          <div className="space-y-3">
            {details.interviewerBlocks.map((interviewer, index) => (
              <div
                key={interviewer.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`border rounded-lg p-4 bg-gray-50 cursor-move transition-all ${
                  draggedIndex === index ? "opacity-50" : ""
                }`}
                data-testid={`interviewer-${interviewer.id}`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <div className="p-1 text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Interviewer Name"
                    value={interviewer.name}
                    onChange={(e) =>
                      updateInterviewer(interviewer.id, "name", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                  />
                  <button
                    onClick={() => removeInterviewer(interviewer.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    aria-label="Remove interviewer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Title"
                    value={interviewer.title}
                    onChange={(e) =>
                      updateInterviewer(interviewer.id, "title", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="url"
                    placeholder="LinkedIn URL"
                    value={interviewer.linkedinUrl || ""}
                    onChange={(e) =>
                      updateInterviewer(interviewer.id, "linkedinUrl", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={interviewer.email || ""}
                    onChange={(e) =>
                      updateInterviewer(interviewer.id, "email", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <textarea
                  placeholder="Notes about this interviewer..."
                  value={interviewer.notes || ""}
                  onChange={(e) =>
                    updateInterviewer(interviewer.id, "notes", e.target.value)
                  }
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>
            ))}

            {details.interviewerBlocks.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">
                No interviewers added yet
              </div>
            )}
          </div>
        </section>
      )}

      {/* AI Analysis */}
      <section data-testid="ai-analysis-section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">AI Analysis</h3>
          <button
            onClick={refreshAI}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
            data-testid="refresh-ai"
          >
            <RefreshCw size={14} />
            Refresh Analysis
          </button>
        </div>

        {details.aiBlob ? (
          <div className="prose prose-sm max-w-none bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div
              dangerouslySetInnerHTML={{ __html: details.aiBlob.replace(/\n/g, "<br/>") }}
            />
            {details.aiRefreshedAt && (
              <div className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(details.aiRefreshedAt).toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
            No analysis yet. Click Refresh Analysis to generate insights.
          </div>
        )}
      </section>

      {/* Keywords */}
      <section data-testid="keywords-section">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Keywords & Tags</h3>
        
        {/* Wordcloud (auto keywords) */}
        {details.keywordsAuto.length > 0 && (
          <div className="mb-4">
            <Wordcloud 
              words={details.keywordsAuto} 
              onWordClick={handleWordcloudClick}
              title="Auto-generated keywords (click to add to your tags)"
            />
          </div>
        )}

        {/* Manual keywords */}
        <div>
          <div className="text-xs text-gray-600 mb-2">Your tags:</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {details.keywordsManual.map((kw) => (
              <button
                key={kw}
                onClick={() => removeKeyword(kw)}
                className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-medium hover:bg-gray-300 flex items-center gap-1"
              >
                {kw}
                <X size={12} />
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add tag (press Enter)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addKeyword(e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            data-testid="add-keyword-input"
          />
        </div>
      </section>

      {/* Notes */}
      <section data-testid="notes-section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Notes</h3>
          <div className="flex items-center gap-2">
            {details.notesHistory.length > 0 && (
              <button
                onClick={undoNotes}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                title="Undo to previous version"
                data-testid="undo-notes"
              >
                ↩️ Undo
              </button>
            )}
            <button
              onClick={exportNotes}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              title="Export notes to clipboard"
              data-testid="export-notes"
            >
              📋 Export
            </button>
          </div>
        </div>

        <textarea
          value={details.notes}
          onChange={(e) => updateNotes(e.target.value)}
          placeholder={`Notes for ${status.replace("_", " ").toLowerCase()} stage...`}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          rows={6}
          data-testid="notes-textarea"
        />

        {details.notesHistory.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            {details.notesHistory.length} previous version(s) available
          </div>
        )}
      </section>

      {saving && (
        <div className="text-xs text-gray-500 text-center">Saving...</div>
      )}
    </div>
  );
}

