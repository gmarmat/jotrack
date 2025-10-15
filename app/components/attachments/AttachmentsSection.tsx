"use client";

import UploadDropzone from "@/app/components/attachments/UploadDropzone";
import VersionsPanel from "@/app/components/attachments/VersionsPanel";
import { useVersions } from "@/app/hooks/useVersions";
import { Eye, Download, Trash2, Undo2, CheckCircle } from "lucide-react";
import { isPreviewable, formatFileSize } from "@/lib/files";
import { getMimeType } from "@/lib/mime";
import { useState } from "react";
import AttachmentViewerModal from "@/app/components/AttachmentViewerModal";

const formatTimestamp = (ms: number): string => {
  const date = new Date(ms);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  return `${time} ${dateStr}`;
};

export default function AttachmentsSection({ 
  jobId,
  onAttachmentChange 
}: { 
  jobId: string;
  onAttachmentChange?: () => void;
}) {
  const resume = useVersions(jobId, "resume");
  const jd = useVersions(jobId, "jd");
  const cover = useVersions(jobId, "cover_letter");

  const [modalProps, setModalProps] = useState<{
    src: string;
    mime: string;
    filename: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const onUploaded =
    (kind: "resume" | "jd" | "cover_letter") => (response: any) => {
      const hooks = { resume, jd, cover_letter: cover };
      const hook = hooks[kind];
      
      // Handle API response structure
      if (!response) {
        console.error("Upload response is undefined");
        return;
      }

      // API returns { attachment: {...} }
      const attachment = response.attachment || response;
      
      if (!attachment || !attachment.id) {
        console.error("Invalid attachment data:", response);
        return;
      }
      
      // Transform API response to VersionRec format
      const versionRec = {
        id: attachment.id,
        version: attachment.version,
        filename: attachment.original_name || attachment.filename,
        path: attachment.path,
        size: attachment.size,
        createdAt: attachment.created_at,
        deletedAt: null,
        isActive: attachment.is_active || false,
        kind: attachment.kind,
      };
      
      hook.upsertLocal(versionRec);
      hook.refresh();
      onAttachmentChange?.(); // Trigger callback to refresh attachment count
    };

  const openPreview = (path: string, filename: string) => {
    setModalProps({
      src: `/api/files/stream?path=${encodeURIComponent(path)}`,
      mime: getMimeType(filename),
      filename,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, kind: "resume" | "jd" | "cover_letter") => {
    try {
      const response = await fetch(`/api/attachments/${id}/delete`, {
        method: "POST",
      });
      if (response.ok) {
        const hooks = { resume, jd, cover_letter: cover };
        hooks[kind].removeLocal(id);
        hooks[kind].refresh();
        onAttachmentChange?.(); // Trigger callback to refresh attachment count
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleRestore = async (id: string, kind: "resume" | "jd" | "cover_letter") => {
    try {
      const response = await fetch(`/api/attachments/${id}/restore`, {
        method: "POST",
      });
      if (response.ok) {
        const hooks = { resume, jd, cover_letter: cover };
        hooks[kind].refresh();
        onAttachmentChange?.(); // Trigger callback to refresh attachment count
      }
    } catch (error) {
      console.error("Failed to restore:", error);
    }
  };

  const handleMakeActive = async (
    jobId: string,
    kind: string,
    version: number,
    targetKind: "resume" | "jd" | "cover_letter"
  ) => {
    try {
      const response = await fetch(
        `/api/jobs/${jobId}/attachments/versions/make-active`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, version }),
        }
      );
      if (response.ok) {
        const hooks = { resume, jd, cover_letter: cover };
        hooks[targetKind].setActiveLocal(version);
        hooks[targetKind].refresh();
      }
    } catch (error) {
      console.error("Failed to make active:", error);
    }
  };

  const renderVersion = (
    rec: any,
    kind: "resume" | "jd" | "cover_letter"
  ) => {
    const canPreview = rec.path && isPreviewable(rec.filename, rec.size);

    return (
      <>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {rec.filename}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            v{rec.version} • {formatFileSize(rec.size)} • {formatTimestamp(rec.createdAt)}
            {rec.isActive && " • active"}
            {rec.deletedAt && " • deleted"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!rec.deletedAt && canPreview && (
            <button
              onClick={() => openPreview(rec.path, rec.filename)}
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="Preview"
              title="Preview"
            >
              <Eye size={16} />
            </button>
          )}
          {!rec.deletedAt && (
            <a
              href={`/api/files/stream?path=${encodeURIComponent(rec.path)}`}
              download={rec.filename}
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="Download"
              title="Download"
            >
              <Download size={16} />
            </a>
          )}
          {!rec.deletedAt && !rec.isActive && (
            <button
              onClick={() =>
                handleMakeActive(jobId, kind, rec.version, kind)
              }
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="Make Active"
              title="Make Active"
            >
              <CheckCircle size={16} />
            </button>
          )}
          {!rec.deletedAt && (
            <button
              onClick={() => handleDelete(rec.id, kind)}
              className="p-1.5 rounded hover:bg-gray-100 text-red-600"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
          {rec.deletedAt && (
            <button
              onClick={() => handleRestore(rec.id, kind)}
              className="p-1.5 rounded hover:bg-gray-100 text-blue-600"
              aria-label="Undo"
              title="Restore"
            >
              <Undo2 size={16} />
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <section data-testid="attachments-section" className="space-y-4">
        {/* Common instructions above all dropzones */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Upload Instructions:</strong> Drag and drop files or click Upload. 
            Multiple files supported. Formats: PDF, DOCX, RTF, TXT, MD, images.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div data-testid="zone-resume">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-3">
              Resume
            </h3>
            <UploadDropzone
              kind="resume"
              jobId={jobId}
              onUploaded={onUploaded("resume")}
            />
            {resume.data.length > 0 && (
              <div className="mt-3">
                <VersionsPanel jobId={jobId} kind="resume">
                  {(rec) => renderVersion(rec, "resume")}
                </VersionsPanel>
              </div>
            )}
          </div>

          <div data-testid="zone-jd">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-3">
              Job Description
            </h3>
            <UploadDropzone
              kind="jd"
              jobId={jobId}
              onUploaded={onUploaded("jd")}
            />
            {jd.data.length > 0 && (
              <div className="mt-3">
                <VersionsPanel jobId={jobId} kind="jd">
                  {(rec) => renderVersion(rec, "jd")}
                </VersionsPanel>
              </div>
            )}
          </div>

          <div data-testid="zone-cover">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-3">
              Cover Letter
            </h3>
            <UploadDropzone
              kind="cover_letter"
              jobId={jobId}
              onUploaded={onUploaded("cover_letter")}
            />
            {cover.data.length > 0 && (
              <div className="mt-3">
                <VersionsPanel jobId={jobId} kind="cover_letter">
                  {(rec) => renderVersion(rec, "cover_letter")}
                </VersionsPanel>
              </div>
            )}
          </div>
        </div>
      </section>

      {modalOpen && modalProps && (
        <AttachmentViewerModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          src={modalProps.src}
          mime={modalProps.mime}
          filename={modalProps.filename}
        />
      )}
    </>
  );
}

