"use client";
import { useState, useEffect, useRef } from "react";
import { Eye, Download, Trash2, Undo2, ExternalLink, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import DropZone from "./DropZone";
import FileViewer from "./FileViewer";
import { useToast } from "./ToastProvider";
import type { AttachmentKind } from "@/db/schema";
import { isPreviewable, formatFileSize } from "@/lib/files";

interface AttachmentFile {
  id: string;
  filename: string;
  path?: string;
  size: number;
  kind: AttachmentKind;
  version: number;
  created_at: number;
  url: string;
}

interface VersionInfo {
  id: string;
  version: number;
  filename: string;
  path?: string;
  size: number;
  createdAt: number;
  deletedAt: number | null;
  isActive: boolean;
  kind: AttachmentKind;
}

interface AttachmentsPanelProps {
  jobId: string;
}

interface DeletePendingState {
  file: AttachmentFile;
  secondsRemaining: number;
}

const ACCEPT_FILES = ".pdf,.doc,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf,image/png,image/jpeg,image/webp";

export default function AttachmentsPanel({ jobId }: AttachmentsPanelProps) {
  const { showToast } = useToast();
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string>("");
  const [deletePending, setDeletePending] = useState<Map<string, DeletePendingState>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [versionsOpen, setVersionsOpen] = useState<Record<AttachmentKind, boolean>>({
    resume: false,
    jd: false,
    cover_letter: false,
    other: false,
  });
  const [versions, setVersions] = useState<Record<AttachmentKind, VersionInfo[]>>({
    resume: [],
    jd: [],
    cover_letter: [],
    other: [],
  });
  const [viewerFile, setViewerFile] = useState<AttachmentFile | null>(null);

  const loadAttachments = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else {
        setError("Failed to load attachments");
      }
    } catch (err) {
      console.error("Failed to load attachments:", err);
      setError("Failed to load attachments");
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [jobId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearInterval(timer));
      timersRef.current.clear();
    };
  }, []);

  const handleUploaded = (newFile: AttachmentFile) => {
    // Update files state immediately
    setFiles((prevFiles) => {
      const filteredFiles = prevFiles.filter(f => f.kind !== newFile.kind);
      return [...filteredFiles, newFile];
    });
    
    // Also update versions for the specific kind
    setVersions((prevVersions) => ({
      ...prevVersions,
      [newFile.kind]: [
        newFile, // New upload is always the latest version
        ...(prevVersions[newFile.kind] || []).filter(v => v.id !== newFile.id) // Ensure no duplicates
      ].sort((a, b) => b.version - a.version) // Sort by version descending
    }));
    
    setError("");
    showToast({ kind: 'success', title: `Uploaded ${newFile.filename}` });
  };

  const handleError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  const handleDelete = async (file: AttachmentFile) => {
    try {
      const res = await fetch(`/api/attachments/${file.id}/delete`, {
        method: 'POST',
      });

      if (!res.ok) {
        handleError('Failed to delete attachment');
        return;
      }

      // Remove from main list
      setFiles((prev) => prev.filter((f) => f.id !== file.id));

      // Add to pending delete with countdown
      const newPending = new Map(deletePending);
      newPending.set(file.id, { file, secondsRemaining: 10 });
      setDeletePending(newPending);

      // Start countdown timer
      const interval = setInterval(() => {
        setDeletePending((prev) => {
          const entry = prev.get(file.id);
          if (!entry || entry.secondsRemaining <= 1) {
            // Timer expired - remove from pending
            clearInterval(interval);
            timersRef.current.delete(file.id);
            const newMap = new Map(prev);
            newMap.delete(file.id);
            return newMap;
          }
          // Decrement
          const newMap = new Map(prev);
          newMap.set(file.id, { ...entry, secondsRemaining: entry.secondsRemaining - 1 });
          return newMap;
        });
      }, 1000);

      timersRef.current.set(file.id, interval);

      // Auto-promote: If we deleted the active file, promote the next highest non-deleted version
      await autoPromoteIfNeeded(file.kind);
    } catch (err) {
      console.error('Delete error:', err);
      handleError('Failed to delete attachment');
    }
  };

  const autoPromoteIfNeeded = async (kind: AttachmentKind) => {
    try {
      // Fetch current versions for this kind
      const res = await fetch(`/api/jobs/${jobId}/attachments/versions?kind=${kind}`);
      if (!res.ok) return;
      
      const data = await res.json();
      const versions = data.versions as VersionInfo[];
      
      // Find the highest non-deleted version that is NOT currently active
      const nonDeletedVersions = versions.filter(v => v.deletedAt === null);
      const hasActiveVersion = nonDeletedVersions.some(v => v.isActive);
      
      // If no active version exists and we have non-deleted versions, promote the highest
      if (!hasActiveVersion && nonDeletedVersions.length > 0) {
        const highest = nonDeletedVersions[0]; // Already sorted DESC by version
        await handleMakeActive(kind, highest.version);
      }
    } catch (err) {
      console.error('Auto-promote error:', err);
      // Silently fail - not critical
    }
  };

  const handleUndo = async (attachmentId: string) => {
    const pending = deletePending.get(attachmentId);
    if (!pending) return;

    try {
      const res = await fetch(`/api/attachments/${attachmentId}/restore`, {
        method: 'POST',
      });

      if (!res.ok) {
        handleError('Undo failed - file may be permanently deleted');
        return;
      }

      // Clear timer
      const timer = timersRef.current.get(attachmentId);
      if (timer) {
        clearInterval(timer);
        timersRef.current.delete(attachmentId);
      }

      // Remove from pending
      const newPending = new Map(deletePending);
      newPending.delete(attachmentId);
      setDeletePending(newPending);

      // Restore file to list
      setFiles((prev) => [pending.file, ...prev]);
    } catch (err) {
      console.error('Undo error:', err);
      handleError('Undo failed');
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearInterval(timer));
      timersRef.current.clear();
    };
  }, []);

  // Deep-link support: auto-expand versions if #versions is in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#versions') {
      // Open versions for all kinds that have files
      const kindsToOpen: AttachmentKind[] = ['resume', 'jd', 'cover_letter'];
      kindsToOpen.forEach(kind => {
        if (files.some(f => f.kind === kind)) {
          setVersionsOpen(prev => ({ ...prev, [kind]: true }));
          if (versions[kind].length === 0) {
            loadVersions(kind);
          }
        }
      });
    }
  }, []); // Run once on mount

  const loadVersions = async (kind: AttachmentKind) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments/versions?kind=${kind}`);
      if (res.ok) {
        const data = await res.json();
        setVersions((prev) => ({ ...prev, [kind]: data.versions }));
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  };

  const toggleVersions = (kind: AttachmentKind) => {
    const isOpening = !versionsOpen[kind];
    setVersionsOpen((prev) => ({ ...prev, [kind]: isOpening }));
    if (isOpening) {
      if (versions[kind].length === 0) {
        loadVersions(kind);
      }
      // Set hash when opening
      if (typeof window !== 'undefined') {
        window.location.hash = 'versions';
      }
    } else {
      // Clear hash when closing (only if all versions are closed)
      if (typeof window !== 'undefined') {
        const anyOpen = Object.values({ ...versionsOpen, [kind]: false }).some(v => v);
        if (!anyOpen) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  };

  const handleMakeActive = async (kind: AttachmentKind, version: number) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments/versions/make-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, version }),
      });

      if (!res.ok) {
        handleError('Failed to make version active');
        return;
      }

      // Reload both current files and versions list
      await loadAttachments();
      await loadVersions(kind);
    } catch (err) {
      console.error('Make active error:', err);
      handleError('Failed to make version active');
    }
  };

  const getFilesByKind = (kind: AttachmentKind) => {
    return files.filter((f) => f.kind === kind);
  };

  const getPendingByKind = (kind: AttachmentKind) => {
    return Array.from(deletePending.values()).filter((p) => p.file.kind === kind);
  };

  const renderFileList = (kind: AttachmentKind) => {
    const kindFiles = getFilesByKind(kind);
    const pendingFiles = getPendingByKind(kind);
    
    if (kindFiles.length === 0 && pendingFiles.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {/* Active files */}
        {kindFiles.map((file) => {
          const canPreview = isPreviewable(file.filename);
          const isImage = /\.(png|jpg|jpeg|webp)$/i.test(file.filename);
          const isNonPreviewable = /\.(doc|docx|rtf)$/i.test(file.filename);
          
          return (
            <div key={file.id} className="text-xs bg-gray-50 rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="font-medium text-gray-900 max-w-[30ch] md:max-w-[40ch] truncate" 
                      title={file.filename}
                      data-testid={`att-name-${file.id}`}
                    >
                      {file.filename}
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 font-mono flex-shrink-0">
                      v{file.version}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-1">
                    {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canPreview && (
                    <button
                      onClick={() => setViewerFile({
                        ...file,
                        url: file.url
                      })}
                      className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                      aria-label="Preview"
                      title="Preview"
                      data-testid={`att-preview-${file.id}`}
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  {isNonPreviewable && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                      aria-label="Open externally"
                      title="Open externally"
                      data-testid={`att-openext-${file.id}`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <a
                    href={file.url}
                    download={file.filename}
                    className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                    aria-label="Download"
                    title="Download"
                    data-testid={`att-download-${file.id}`}
                  >
                    <Download size={16} />
                  </a>
                  <button
                    onClick={() => handleDelete(file)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    aria-label="Delete"
                    title="Delete"
                    data-testid={`att-delete-${file.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {isImage && (
                <div className="mt-2 rounded overflow-hidden bg-white border">
                  <img 
                    src={file.url} 
                    alt={file.filename}
                    className="w-full h-auto max-h-32 object-contain"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Pending delete files with undo */}
        {pendingFiles.map((pending) => {
          const file = pending.file;
          return (
            <div key={file.id} className="text-xs bg-yellow-50 border border-yellow-300 rounded p-2 opacity-75">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700 truncate line-through">{file.filename}</div>
                  <div className="text-gray-500 text-[10px]">Deleted</div>
                </div>
                <button
                  onClick={() => handleUndo(file.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                  aria-label="Undo delete"
                  title="Undo delete"
                  data-testid={`att-undo-${file.id}`}
                >
                  <Undo2 size={14} />
                  Undo ({pending.secondsRemaining}s)
                </button>
              </div>
            </div>
          );
        })}

        {/* Versions section */}
        {kindFiles.length > 0 && (
          <div className="mt-3 border-t pt-2">
            <button
              onClick={() => toggleVersions(kind)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
              data-testid={`ver-toggle-${kind}`}
            >
              {versionsOpen[kind] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Versions ({versions[kind].length || '…'})</span>
            </button>

            {versionsOpen[kind] && (
              <div className="mt-2 space-y-1">
                {versions[kind].map((ver) => {
                  const isActiveVer = ver.isActive && ver.deletedAt === null;
                  const canPreview = isPreviewable(ver.filename);
                  const isNonPreviewable = /\.(doc|docx|rtf)$/i.test(ver.filename);
                  const verUrl = `/api/jobs/${jobId}/attachments?download=${ver.id}`;

                  if (ver.deletedAt !== null) {
                    // Skip deleted versions in the list for now (or show grayed out)
                    return null;
                  }

                  return (
                    <div key={ver.id} className="text-xs bg-blue-50 rounded p-3 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-center gap-3 mr-4">
                          <span className="font-mono text-blue-700 font-semibold">v{ver.version}</span>
                          {isActiveVer && (
                            <span className="px-2 py-1 text-[10px] bg-green-100 text-green-700 rounded font-medium">
                              Active
                            </span>
                          )}
                          <div 
                            className="font-medium text-gray-900 max-w-[25ch] md:max-w-[35ch] truncate" 
                            title={ver.filename}
                          >
                            {ver.filename}
                          </div>
                          <span className="text-gray-500 text-[10px]">
                            {formatFileSize(ver.size)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isActiveVer && (
                            <button
                              onClick={() => handleMakeActive(kind, ver.version)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                              aria-label="Make active"
                              title="Make active"
                              data-testid={`ver-makeactive-${kind}-${ver.version}`}
                            >
                              <RotateCcw size={12} />
                              Make Active
                            </button>
                          )}
                          {canPreview && (
                            <button
                              onClick={() => setViewerFile({
                                id: ver.id,
                                filename: ver.filename,
                                url: `/api/files/stream?path=${encodeURIComponent(ver.path || '')}`,
                                size: ver.size,
                                kind: ver.kind,
                                version: ver.version,
                                created_at: ver.createdAt,
                              })}
                              className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                              aria-label="Preview"
                              title="Preview"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {isNonPreviewable && (
                            <a
                              href={verUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-gray-100"
                              aria-label="Open externally"
                              title="Open externally"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <a
                            href={verUrl}
                            download={ver.filename}
                            className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-gray-100"
                            aria-label="Download"
                            title="Download"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4" data-testid="attachments-panel">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <DropZone
            jobId={jobId}
            kind="resume"
            label="📄 Resume"
            accept={ACCEPT_FILES}
            onUploaded={handleUploaded}
            onError={handleError}
          />
          {renderFileList("resume")}
        </div>

        <div>
          <DropZone
            jobId={jobId}
            kind="jd"
            label="📋 Job Description"
            accept={ACCEPT_FILES}
            onUploaded={handleUploaded}
            onError={handleError}
          />
          {renderFileList("jd")}
        </div>

        <div>
          <DropZone
            jobId={jobId}
            kind="cover_letter"
            label="✉️ Cover Letter"
            accept={ACCEPT_FILES}
            onUploaded={handleUploaded}
            onError={handleError}
          />
          {renderFileList("cover_letter")}
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewerFile && (
        <FileViewer
          file={viewerFile}
          isOpen={!!viewerFile}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  );
}
