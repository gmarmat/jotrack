"use client";
import { useState, useEffect } from "react";
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

const ACCEPT_FILES = ".pdf,.doc,.docx,.txt,.md,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf";

export default function AttachmentsPanel({ jobId }: AttachmentsPanelProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string>("");

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

  const getFilesByKind = (kind: AttachmentKind) => {
    return files.filter((f) => f.kind === kind);
  };

  const renderFileList = (kind: AttachmentKind) => {
    const kindFiles = getFilesByKind(kind);
    if (kindFiles.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {kindFiles.map((file) => {
          const canPreview = isPreviewable(file.filename);
          return (
            <div key={file.id} className="text-xs bg-gray-50 rounded p-2 flex items-center justify-between">
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

