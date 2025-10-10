"use client";

import { useState, useEffect } from "react";
import { FileText, Info, StickyNote, ChevronRight, ChevronLeft } from "lucide-react";
import { useVersions } from "@/app/hooks/useVersions";
import { formatFileSize } from "@/lib/files";
import { formatDateTime } from "@/lib/timeDelta";

type Tab = "files" | "meta" | "notes";

interface UtilityRailProps {
  jobId: string;
  job: any;
}

export default function UtilityRail({ jobId, job }: UtilityRailProps) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const resume = useVersions(jobId, "resume");
  const jd = useVersions(jobId, "jd");
  const cover = useVersions(jobId, "cover_letter");

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return; // Don't interfere with text input
      }

      if (e.key === "f") {
        e.preventDefault();
        setActiveTab("files");
        setCollapsed(false);
      } else if (e.key === "m") {
        e.preventDefault();
        setActiveTab("meta");
        setCollapsed(false);
      } else if (e.key === "g") {
        e.preventDefault();
        setActiveTab("notes");
        setCollapsed(false);
      } else if (e.key === "Escape" && !collapsed) {
        e.preventDefault();
        setCollapsed(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [collapsed]);

  const renderFiles = () => {
    const allFiles = [
      ...resume.data.map((v) => ({ ...v, kind: "resume" })),
      ...jd.data.map((v) => ({ ...v, kind: "jd" })),
      ...cover.data.map((v) => ({ ...v, kind: "cover_letter" })),
    ];

    if (allFiles.length === 0) {
      return <div className="text-sm text-gray-500 text-center py-8">No files uploaded</div>;
    }

    return (
      <div className="space-y-2">
        {allFiles.map((file) => (
          <a
            key={file.id}
            href={`/api/files/stream?path=${encodeURIComponent(file.path)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            data-testid={`file-${file.id}`}
          >
            <div className="text-sm font-medium text-gray-900 truncate">{file.filename}</div>
            <div className="text-xs text-gray-600 mt-1">
              {file.kind} • v{file.version} • {formatFileSize(file.size)}
            </div>
          </a>
        ))}
      </div>
    );
  };

  const renderMeta = () => {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium text-gray-700">Job ID:</div>
          <div className="text-gray-600 font-mono text-xs truncate">{job.id}</div>

          <div className="font-medium text-gray-700">Title:</div>
          <div className="text-gray-600">{job.title}</div>

          <div className="font-medium text-gray-700">Company:</div>
          <div className="text-gray-600">{job.company}</div>

          <div className="font-medium text-gray-700">Status:</div>
          <div className="text-gray-600">{job.status.replace("_", " ")}</div>

          <div className="font-medium text-gray-700">Created:</div>
          <div className="text-gray-600">{formatDateTime(job.created_at || job.createdAt)}</div>

          <div className="font-medium text-gray-700">Updated:</div>
          <div className="text-gray-600">{formatDateTime(job.updated_at || job.updatedAt)}</div>
        </div>

        {job.posting_url && (
          <div className="pt-3 border-t">
            <a
              href={job.posting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              View original posting →
            </a>
          </div>
        )}
      </div>
    );
  };

  const renderGlobalNotes = () => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-700">
          Aggregated notes from all statuses will appear here.
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            💡 <strong>Feature placeholder:</strong> This will show all per-status notes
            in one view for easy export/review.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Collapsed Icon Bar */}
      {collapsed && (
        <div 
          className="fixed right-0 top-32 flex flex-col gap-2 bg-white border-l border-gray-300 shadow-lg rounded-l-lg p-2 z-30"
          data-testid="utility-rail-collapsed"
        >
          <button
            onClick={() => { setActiveTab("files"); setCollapsed(false); }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Files (press 'f')"
            aria-label="Open files"
          >
            <FileText size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => { setActiveTab("meta"); setCollapsed(false); }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Meta (press 'm')"
            aria-label="Open meta"
          >
            <Info size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => { setActiveTab("notes"); setCollapsed(false); }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Global Notes (press 'g')"
            aria-label="Open global notes"
          >
            <StickyNote size={20} className="text-gray-700" />
          </button>
        </div>
      )}

      {/* Expanded Rail */}
      {!collapsed && (
        <div 
          className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-300 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300"
          data-testid="utility-rail-expanded"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {activeTab === "files" && "Files"}
              {activeTab === "meta" && "Job Metadata"}
              {activeTab === "notes" && "Global Notes"}
            </h2>
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close rail"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("files")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "files"
                  ? "bg-white border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              data-testid="tab-files"
            >
              <FileText size={16} className="inline mr-1" />
              Files
            </button>
            <button
              onClick={() => setActiveTab("meta")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "meta"
                  ? "bg-white border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              data-testid="tab-meta"
            >
              <Info size={16} className="inline mr-1" />
              Meta
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "notes"
                  ? "bg-white border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              data-testid="tab-notes"
            >
              <StickyNote size={16} className="inline mr-1" />
              Notes
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === "files" && renderFiles()}
            {activeTab === "meta" && renderMeta()}
            {activeTab === "notes" && renderGlobalNotes()}
          </div>

          {/* Footer Hint */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="text-xs text-gray-600 text-center">
              Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

