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
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('../preview/PdfViewer'), { ssr: false });
const DocxViewer = dynamic(() => import('../preview/DocxViewer'), { ssr: false });

// Constants
const MAX_DOCX_PREVIEW_BYTES = 10 * 1024 * 1024;
const MAX_RTF_PREVIEW_BYTES = 10 * 1024 * 1024;

interface AttachmentViewerModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  mime: string;
  filename: string;
}

type FileType = 'pdf' | 'image' | 'text' | 'markdown' | 'docx' | 'rtf' | 'unsupported';

function getFileType(mime: string, filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';
  if (mime === 'text/markdown' || ext === 'md') return 'markdown';
  if (mime === 'text/plain' || ext === 'txt') return 'text';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') return 'docx';
  if (mime === 'application/rtf' || mime === 'text/rtf' || ext === 'rtf') return 'rtf';
  
  return 'unsupported';
}

// Helper to check if file is DOCX
const isDocx = (filename: string, mime: string): boolean => {
  return getFileType(mime, filename) === 'docx';
};

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
  const [docxContent, setDocxContent] = useState<string | null>(null);
  const [rtfContent, setRtfContent] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  
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
      const pdfjsLib = await import("pdfjs-dist");
      
      // Set worker - use CDN for reliability
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      }

      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const canvases: HTMLCanvasElement[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        
        const viewport = page.getViewport({ scale: 1 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        canvases.push(canvas);
      }
      
      setPdfPages(canvases);
    } catch (err) {
      console.error('PDF load error:', err);
      setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  // Load DOCX content
  const loadDocx = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get file size via HEAD request
      const headResponse = await fetch(src, { method: 'HEAD' });
      const size = parseInt(headResponse.headers.get('content-length') || '0');
      setFileSize(size);
      
      // Check size limit
      if (size > MAX_DOCX_PREVIEW_BYTES) {
        setError(`Preview not supported for large files (>10MB). Use Open externally.`);
        return;
      }
      
      // Fetch the file as ArrayBuffer
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      
      // Dynamically import mammoth
      const mammoth = await import("mammoth/mammoth.browser");
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      
      // Sanitize the HTML
      const sanitizedHtml = DOMPurify.sanitize(html);
      setDocxContent(sanitizedHtml);
    } catch (err) {
      setError('Failed to load DOCX file');
    } finally {
      setLoading(false);
    }
  }, [src]);

  // Load RTF content
  const loadRtf = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get file size via HEAD request
      const headResponse = await fetch(src, { method: 'HEAD' });
      const size = parseInt(headResponse.headers.get('content-length') || '0');
      setFileSize(size);
      
      // Check size limit
      if (size > MAX_RTF_PREVIEW_BYTES) {
        setError(`Preview not supported for large RTF files (>10MB). Use Open externally.`);
        return;
      }
      
      // Fetch the file as ArrayBuffer
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      
      // Basic plain-text extraction from RTF
      let text = '';
      try {
        // Try UTF-8 first, fallback to windows-1252
        let decoder = new TextDecoder('utf-8');
        text = decoder.decode(arrayBuffer);
        
        // If text looks corrupted (too many replacement chars), try windows-1252
        if ((text.match(/\uFFFD/g) || []).length > 10) {
          try {
            decoder = new TextDecoder('windows-1252');
            text = decoder.decode(arrayBuffer);
          } catch (_) {
            // Keep UTF-8 version
          }
        }
        
        // Strip RTF control sequences
        text = text
          // Remove destinations
          .replace(/\{\\\*[^}]*\}/g, '')
          // Remove control words
          .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
          // Convert common control sequences
          .replace(/\\par\b/g, '\n')
          .replace(/\\tab\b/g, '\t')
          // Remove enclosing braces
          .replace(/[{}]/g, '')
          // Trim extra whitespace
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        // Escape HTML for safe display
        const escapeHtml = (str: string) => {
          return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        };
        
        const escapedText = escapeHtml(text);
        const html = `<pre style="white-space: pre-wrap; font-family: monospace;">${escapedText}</pre>`;
        
        setRtfContent(html);
      } catch (err) {
        setError('Failed to load RTF file');
      }
    } catch (err) {
      setError('Failed to load RTF file');
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
    setDocxContent(null);
    setRtfContent(null);
    setFileSize(0);
    setError(null);
    
    if (fileType === 'pdf') {
      loadPDF();
    } else if (fileType === 'text' || fileType === 'markdown') {
      loadText();
    } else if (fileType === 'docx') {
      loadDocx();
    } else if (fileType === 'rtf') {
      loadRtf();
    }
  }, [open, fileType, loadPDF, loadText, loadDocx, loadRtf]);

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
          <div className="text-center" data-testid="viewer-docx-fallback">
            <div className="text-red-500 mb-4">{error}</div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleExternal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Externally
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (fileType) {
      case 'pdf':
        return (
          <div className="overflow-auto h-full p-4">
            <PdfViewer url={src} />
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
        const markdownHtml = content ? DOMPurify.sanitize(marked.parse(content) as string) : '';
        return (
          <div className="overflow-auto h-full p-4">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: markdownHtml }}
            />
          </div>
        );

      case 'text':
        if (!content || content.trim().length === 0) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500" data-testid="viewer-fallback">Empty file</div>
            </div>
          );
        }
        return (
          <div className="overflow-auto h-full p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {content}
            </pre>
          </div>
        );

      case 'docx':
        return (
          <div className="overflow-auto h-full p-4">
            <DocxViewer url={src} />
          </div>
        );

      case 'rtf':
        return (
          <div className="overflow-auto h-full p-4">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              dangerouslySetInnerHTML={{ __html: rtfContent || '' }}
            />
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500" data-testid="viewer-fallback">
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
