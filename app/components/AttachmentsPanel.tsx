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

interface UndoState {
  attachmentId: string;
  file: AttachmentFile;
  expiresAt: number;
}

const ACCEPT_FILES = ".pdf,.doc,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf,image/png,image/jpeg,image/webp";

export default function AttachmentsPanel({ jobId }: AttachmentsPanelProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string>("");
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      // Optimistically remove from list
      setFiles((prev) => prev.filter((f) => f.id !== file.id));

      // Set undo state with 10s expiry
      const expiresAt = Date.now() + 10000;
      setUndoState({ attachmentId: file.id, file, expiresAt });

      // Clear undo after 10s
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setUndoState(null);
      }, 10000);
    } catch (err) {
      console.error('Delete error:', err);
      handleError('Failed to delete attachment');
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;

    try {
      const res = await fetch(`/api/attachments/${undoState.attachmentId}/restore`, {
        method: 'POST',
      });

      if (!res.ok) {
        handleError('Undo failed - file may be permanently deleted');
        return;
      }

      // Restore file to list
      setFiles((prev) => [undoState.file, ...prev]);
      setUndoState(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    } catch (err) {
      console.error('Undo error:', err);
      handleError('Undo failed');
    }
  };

  const getFilesByKind = (kind: AttachmentKind) => {
    return files.filter((f) => f.kind === kind);
  };

  const renderFileList = (kind: AttachmentKind) => {
    const kindFiles = getFilesByKind(kind);
    if (kindFiles.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
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

      {undoState && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-2 rounded text-sm flex items-center justify-between">
          <span>Attachment deleted.</span>
          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium"
            data-testid="undo-delete-btn"
          >
            Undo (10s)
          </button>
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

