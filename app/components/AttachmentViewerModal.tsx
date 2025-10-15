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

const PdfViewer = dynamic(() => import('./preview/PdfViewer'), { ssr: false });
const DocxViewer = dynamic(() => import('./preview/DocxViewer'), { ssr: false });

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
        
        await page.render({ canvasContext: context, viewport } as any).promise;
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
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-medium text-gray-600">Loading preview...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md" data-testid="viewer-docx-fallback">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Unavailable</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleExternal}
                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2 font-medium text-sm text-gray-700 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open Externally
              </button>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
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
          <div className="overflow-auto h-full p-8 flex justify-center">
            <div className="w-full max-w-4xl">
              <PdfViewer url={src} />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center h-full overflow-hidden p-8">
            <img
              src={src}
              alt={filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        );

      case 'markdown':
        const markdownHtml = content ? DOMPurify.sanitize(marked.parse(content) as string) : '';
        return (
          <div className="overflow-auto h-full p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
              <div 
                className="prose prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-gray-800 prose-code:bg-gray-100 prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: markdownHtml }}
              />
            </div>
          </div>
        );

      case 'text':
        if (!content || content.trim().length === 0) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-gray-400">📄</span>
                </div>
                <div className="text-sm font-medium text-gray-500" data-testid="viewer-fallback">Empty file</div>
              </div>
            </div>
          );
        }
        return (
          <div className="overflow-auto h-full p-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8">
              <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-100 leading-relaxed">
                {content}
              </pre>
            </div>
          </div>
        );

      case 'docx':
        return (
          <div className="overflow-auto h-full p-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8">
              <DocxViewer url={src} />
            </div>
          </div>
        );

      case 'rtf':
        return (
          <div className="overflow-auto h-full p-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm p-8">
              <div 
                className="prose prose-base max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                dangerouslySetInnerHTML={{ __html: rtfContent || '' }}
              />
            </div>
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md" data-testid="viewer-fallback">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📎</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Not Supported</h3>
              <p className="text-sm text-gray-600 mb-6">This file type cannot be previewed in the browser.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleExternal}
                  className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2 font-medium text-sm text-gray-700 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop - Apple-style blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Apple QuickLook inspired */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header - Clean and minimal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">{filename}</span>
            {fileType !== 'unsupported' && (
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                {Math.round(zoom * 100)}%
              </span>
            )}
          </div>
          
          {/* Toolbar - Apple-style icon buttons */}
          <div className="flex items-center space-x-0.5">
            {fileType !== 'unsupported' && (
              <>
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom Out (⌘−)"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom In (⌘+)"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Actual Size (⌘0)"
                  aria-label="Fit to Width"
                >
                  <ScanLine className="w-4 h-4 text-gray-700" />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-2" />
              </>
            )}
            
            <button
              onClick={handleDownload}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
              aria-label="Download"
            >
              <Download className="w-4 h-4 text-gray-700" />
            </button>
            
            <button
              onClick={handleExternal}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Open Externally"
              aria-label="Open Externally"
            >
              <ExternalLink className="w-4 h-4 text-gray-700" />
            </button>
            
            <div className="w-px h-5 bg-gray-300 mx-2" />
            
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Content - Light background like QuickLook */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900" ref={containerRef} data-testid="viewer-modal">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
