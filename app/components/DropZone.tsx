"use client";
import { useState, useRef } from "react";
import type { AttachmentKind } from "@/db/schema";
import { isAllowed } from "@/lib/files";

interface DropZoneProps {
  jobId: string;
  kind: AttachmentKind;
  label: string;
  accept: string;
  onUploaded: (file: any) => void;
  onError: (msg: string) => void;
}

export default function DropZone({ jobId, kind, label, accept, onUploaded, onError }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    const ext = file.name.split('.').pop() || '';
    const mime = file.type || '';

    if (!isAllowed(mime, ext)) {
      onError(`Unsupported file type. Allowed: ${accept}`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const res = await fetch(`/api/jobs/${jobId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        onError(errorData.error || 'Upload failed');
        return;
      }

      const data = await res.json();
      onUploaded(data);
    } catch (error) {
      console.error('Upload error:', error);
      onError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${isUploading ? 'opacity-50 cursor-wait' : ''}
      `}
      data-testid={`dropzone-${kind}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      <div className="text-xs text-gray-500">
        {isUploading ? 'Uploading...' : 'Click or drag & drop'}
      </div>
    </div>
  );
}

