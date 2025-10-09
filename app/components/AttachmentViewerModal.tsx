"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ZoomOut, 
  ZoomIn, 
  ScanLine, 
  Download, 
  ExternalLink, 
  X 
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface AttachmentViewerModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  mime: string;
  filename: string;
}

type FileType = 'pdf' | 'image' | 'text' | 'markdown' | 'unsupported';

function getFileType(mime: string, filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';
  if (mime === 'text/markdown' || ext === 'md') return 'markdown';
  if (mime === 'text/plain' || ext === 'txt') return 'text';
  
  return 'unsupported';
}

export default function AttachmentViewerModal({
  open,
  onClose,
  src,
  mime,
  filename
}: AttachmentViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fileType = getFileType(mime, filename);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        setZoom(prev => Math.min(prev + 0.25, 3));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom(prev => Math.max(prev - 0.25, 0.25));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Load PDF content
  const loadPDF = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
      const worker = await import("pdfjs-dist/legacy/build/pdf.worker");
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;

      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      const canvases: HTMLCanvasElement[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        
        const viewport = page.getViewport({ scale: 1 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport }).promise;
        canvases.push(canvas);
      }
      
      setPdfPages(canvases);
    } catch (err) {
      setError('Failed to load PDF');
    } finally {
      setLoading(false);
    }
  }, [src]);

  // Load text content
  const loadText = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(src);
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  }, [src]);

  // Load content based on file type
  useEffect(() => {
    if (!open) return;
    
    setZoom(1);
    setContent(null);
    setPdfPages([]);
    setError(null);
    
    if (fileType === 'pdf') {
      loadPDF();
    } else if (fileType === 'text' || fileType === 'markdown') {
      loadText();
    }
  }, [open, fileType, loadPDF, loadText]);

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    link.click();
  };

  // Handle external link
  const handleExternal = () => {
    window.open(src, '_blank');
  };

  if (!open) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }

    switch (fileType) {
      case 'pdf':
        return (
          <div className="overflow-auto h-full">
            <div 
              className="space-y-4 p-4"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              {pdfPages.map((canvas, index) => (
                <div key={index} className="shadow-sm border">
                  <canvas 
                    ref={canvas => {
                      if (canvas && pdfPages[index]) {
                        const ctx = canvas.getContext('2d')!;
                        canvas.width = pdfPages[index].width;
                        canvas.height = pdfPages[index].height;
                        ctx.drawImage(pdfPages[index], 0, 0);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center h-full overflow-hidden">
            <img
              src={src}
              alt={filename}
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        );

      case 'markdown':
        const markdownHtml = content ? DOMPurify.sanitize(marked(content)) : '';
        return (
          <div className="overflow-auto h-full p-4">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: markdownHtml }}
            />
          </div>
        );

      case 'text':
        return (
          <div className="overflow-auto h-full p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {content}
            </pre>
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="mb-2">Preview not supported</div>
              <div className="text-sm">Use Open externally or Download</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-screen-lg w-full mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm truncate">{filename}</span>
            {fileType !== 'unsupported' && (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {Math.round(zoom * 100)}%
              </span>
            )}
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center space-x-1">
            {fileType !== 'unsupported' && (
              <>
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                  title="Fit to Width"
                  aria-label="Fit to Width"
                >
                  <ScanLine className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-zinc-600 mx-1" />
              </>
            )}
            
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
              title="Download"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleExternal}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
              title="Open Externally"
              aria-label="Open Externally"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-zinc-600 mx-1" />
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden" ref={containerRef} data-testid="viewer-modal">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
