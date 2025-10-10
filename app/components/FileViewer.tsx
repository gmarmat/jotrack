"use client";
import { useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";

interface FileViewerProps {
  file: {
    id: string;
    filename: string;
    url: string;
    size: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isImage = /\.(png|jpg|jpeg|webp)$/i.test(file.filename);
  const isPdf = /\.pdf$/i.test(file.filename);
  const isText = /\.(txt|md)$/i.test(file.filename);
  const isOffice = /\.(doc|docx|rtf)$/i.test(file.filename);

  const handleClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.filename;
    link.click();
  };

  const handleOpenExternal = () => {
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {file.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isOffice ? (
              <button
                onClick={handleOpenExternal}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ExternalLink size={16} />
                Open
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                <Download size={16} />
                Download
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading...</div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-600 mb-2">Failed to load preview</div>
                <button
                  onClick={handleOpenExternal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <ExternalLink size={16} />
                  Open in new tab
                </button>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {isImage && (
            <div className="h-full flex items-center justify-center p-4">
              <img
                src={file.url}
                alt={file.filename}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Failed to load image');
                }}
              />
            </div>
          )}

          {/* PDF Preview */}
          {isPdf && (
            <div className="h-full flex flex-col">
              {!error && (
                <iframe
                  src={`${file.url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="flex-1 border-0"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Failed to load PDF in browser');
                  }}
                  title={file.filename}
                  style={{ minHeight: '500px' }}
                />
              )}
              {error && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-500 mb-4">
                      PDF cannot be displayed in browser
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        <Download size={16} />
                        Download PDF
                      </button>
                      <button
                        onClick={handleOpenExternal}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <ExternalLink size={16} />
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Preview */}
          {isText && (
            <div className="h-full overflow-auto p-4">
              <iframe
                src={file.url}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Failed to load text file');
                }}
                title={file.filename}
              />
            </div>
          )}

          {/* Office files - show message */}
          {isOffice && (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <div className="text-gray-500 mb-4">
                  Office documents cannot be previewed in the browser
                </div>
                <button
                  onClick={handleOpenExternal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ExternalLink size={16} />
                  Open in {file.filename.endsWith('.docx') ? 'Word' : file.filename.endsWith('.rtf') ? 'Word' : 'Default App'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
