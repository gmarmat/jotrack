"use client";

import { useEffect, useState } from "react";
import { STATUS_LABELS, type JobStatus } from "@/lib/status";
import { formatDateTime } from "@/lib/timeDelta";
import { Search, Download } from "lucide-react";

interface NotesHubProps {
  jobId: string;
  onJumpToStatus?: (status: JobStatus) => void;
}

type NoteItem = {
  id: string;
  status: string;
  excerpt: string;
  fullText: string;
  updatedAt: number;
};

export default function GlobalNotesHub({ jobId, onJumpToStatus }: NotesHubProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}/notes/all`);
        const data = await res.json();
        setNotes(data.notes || []);
      } catch (error) {
        console.error("Failed to load notes:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  const filteredNotes = notes.filter((note) =>
    note.fullText.toLowerCase().includes(search.toLowerCase()) ||
    note.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const exportData = {
      jobId,
      notes: notes.map((n) => ({
        status: n.status,
        notes: n.fullText,
        updatedAt: new Date(n.updatedAt).toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(json);
    alert("All notes copied to clipboard!");
  };

  const handleCopyAll = () => {
    const text = notes
      .map((n) => `=== ${STATUS_LABELS[n.status as JobStatus]} ===\n${n.fullText}\n`)
      .join("\n");

    navigator.clipboard.writeText(text);
    alert("All notes copied as plain text!");
  };

  if (loading) {
    return <div className="text-sm text-gray-600 text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-4" data-testid="global-notes-hub">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          data-testid="notes-hub-search"
        />
      </div>

      {/* Export Actions */}
      {notes.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-xs font-medium"
            data-testid="copy-all-notes"
          >
            Copy All
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium flex items-center gap-1"
            data-testid="export-notes-json"
          >
            <Download size={12} />
            Export JSON
          </button>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-2">
        {filteredNotes.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8">
            {search ? "No notes match your search" : "No notes yet"}
          </div>
        )}

        {filteredNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => onJumpToStatus?.(note.status as JobStatus)}
            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            data-testid="notes-hub-item"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-600">
                {STATUS_LABELS[note.status as JobStatus]}
              </span>
              <span className="text-xs text-gray-500">
                {formatDateTime(note.updatedAt)}
              </span>
            </div>
            <div className="text-sm text-gray-700 line-clamp-2">{note.excerpt}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

