"use client";

import { useCallback, useRef, useState } from "react";

type Kind = "resume" | "jd" | "cover_letter" | "other";

export default function UploadDropzone({
  kind,
  jobId,
  onUploaded,
}: {
  kind: Kind;
  jobId: string;
  onUploaded: (attachment: any) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const r = await fetch(`/api/jobs/${jobId}/attachments`, {
      method: "POST",
      body: fd,
    });
    if (!r.ok) throw new Error("upload failed");
    const j = await r.json();
    onUploaded?.(j.attachment);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setBusy(true);
    setProgress(0);
    for (let i = 0; i < arr.length; i++) {
      // server size limits enforced; client doesn't chunk
      await send(arr[i]);
      setProgress(Math.round(((i + 1) / arr.length) * 100));
    }
    setBusy(false);
    setTimeout(() => setProgress(0), 800);
  };

  const onInput = async (fl: FileList | null) => {
    if (fl) await handleFiles(fl);
  };

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) await handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
        dragOver ? "ring-2 ring-blue-400 bg-blue-50" : "border-gray-300"
      }`}
      data-testid={`drop-${kind}`}
      aria-label={`Upload ${kind}`}
    >
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          onClick={() => inputRef.current?.click()}
          type="button"
          data-testid={`btn-select-${kind}`}
        >
          Select files…
        </button>
        <span className="text-xs text-gray-600">
          or drag and drop (multiple files supported)
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => onInput(e.target.files)}
        accept=".pdf,.docx,.rtf,.txt,.md,.png,.jpg,.jpeg,.webp"
        className="hidden"
        aria-hidden="true"
        data-testid={`input-${kind}`}
      />
      {busy && (
        <div
          className="mt-2 text-sm font-medium text-blue-600"
          aria-live="polite"
          data-testid="upload-progress"
        >
          Uploading… {progress}%
        </div>
      )}
    </div>
  );
}

