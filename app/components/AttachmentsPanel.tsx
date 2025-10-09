"use client";
import { useState, useEffect, useRef } from "react";
import DropZone from "./DropZone";
import type { AttachmentKind } from "@/db/schema";
import { isPreviewable, formatFileSize } from "@/lib/files";

interface AttachmentFile {
  id: string;
  filename: string;
  size: number;
  kind: AttachmentKind;
  created_at: number;
  url: string;
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
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string>("");
  const [deletePending, setDeletePending] = useState<Map<string, DeletePendingState>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const loadAttachments = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error("Failed to load attachments:", err);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [jobId]);

  const handleUploaded = (newFile: AttachmentFile) => {
    setFiles((prev) => [newFile, ...prev]);
    setError("");
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
    } catch (err) {
      console.error('Delete error:', err);
      handleError('Failed to delete attachment');
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
          
          return (
            <div key={file.id} className="text-xs bg-gray-50 rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{file.filename}</div>
                  <div className="text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  {canPreview && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      data-testid={`preview-${file.id}`}
                    >
                      Preview
                    </a>
                  )}
                  <a
                    href={file.url}
                    download={file.filename}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    data-testid={`download-${file.id}`}
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(file)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    data-testid={`delete-${file.id}`}
                  >
                    Delete
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
                  className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium"
                  data-testid={`undo-btn-${file.id}`}
                >
                  Undo ({pending.secondsRemaining}s)
                </button>
              </div>
            </div>
          );
        })}
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
    </div>
  );
}

