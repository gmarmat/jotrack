'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Zap } from 'lucide-react';

interface Variant {
  variantType: 'raw' | 'ai_optimized';
  content: any;
  tokenCount?: number;
  createdAt: number;
}

interface DocumentVariants {
  kind: 'resume' | 'jd' | 'cover_letter';
  filename: string;
  attachmentId: string;
  raw?: Variant;
  aiOptimized?: Variant;
}

interface AllVariantsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
}

export default function AllVariantsViewerModal({
  isOpen,
  onClose,
  jobId,
}: AllVariantsViewerModalProps) {
  const [documents, setDocuments] = useState<DocumentVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDocTab, setActiveDocTab] = useState<'resume' | 'jd' | 'cover_letter'>('resume');
  const [activeVariantTab, setActiveVariantTab] = useState<'raw' | 'ai_optimized'>('ai_optimized');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchAllVariants();
    }
  }, [isOpen, jobId]);

  const fetchAllVariants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all active attachments
      const attachmentsRes = await fetch(`/api/jobs/${jobId}/attachments`);
      if (!attachmentsRes.ok) throw new Error('Failed to fetch attachments');
      
      const attachmentsData = await attachmentsRes.json();
      const activeAttachments = attachmentsData.attachments?.filter((a: any) => a.isActive) || [];
      
      // Fetch variants for each active attachment
      const docsWithVariants: DocumentVariants[] = [];
      
      for (const att of activeAttachments) {
        if (!['resume', 'jd', 'cover_letter'].includes(att.kind)) continue;
        
        try {
          const variantsRes = await fetch(`/api/attachments/${att.id}/variants`);
          if (!variantsRes.ok) continue;
          
          const variantsData = await variantsRes.json();
          const variants = variantsData.variants || [];
          
          docsWithVariants.push({
            kind: att.kind,
            filename: att.filename,
            attachmentId: att.id,
            raw: variants.find((v: Variant) => v.variantType === 'raw'),
            aiOptimized: variants.find((v: Variant) => v.variantType === 'ai_optimized'),
          });
        } catch (err) {
          console.error(`Failed to fetch variants for ${att.kind}:`, err);
        }
      }
      
      setDocuments(docsWithVariants);
      
      // Auto-select first available document
      if (docsWithVariants.length > 0) {
        setActiveDocTab(docsWithVariants[0].kind);
      }
    } catch (err: any) {
      console.error('Failed to fetch all variants:', err);
      setError(err.message || 'Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (variant: Variant | undefined) => {
    if (!variant) return 'Not available - Click "Refresh Data" to generate';
    
    // Handle different content formats
    if (typeof variant.content === 'string') {
      return variant.content;
    }
    
    // New format: { text: "...", wordCount: 123, variant: "normalized" }
    if (variant.content?.text && typeof variant.content.text === 'string') {
      return variant.content.text;
    }
    
    // Fallback
    return JSON.stringify(variant.content, null, 2);
  };

  const getCurrentDoc = () => {
    return documents.find(d => d.kind === activeDocTab);
  };

  const getCurrentVariant = () => {
    const doc = getCurrentDoc();
    if (!doc) return undefined;
    return activeVariantTab === 'raw' ? doc.raw : doc.aiOptimized;
  };

  if (!isOpen) return null;

  const docLabels = {
    resume: 'Resume',
    jd: 'Job Description',
    cover_letter: 'Cover Letter'
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Data Variants
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              2-variant system: Raw (local) + AI-Optimized (cleaned, token-efficient)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading variants...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="font-medium">Error loading variants</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Document Type Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
              {documents.map(doc => (
                <button
                  key={doc.kind}
                  onClick={() => setActiveDocTab(doc.kind)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeDocTab === doc.kind
                      ? 'border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {docLabels[doc.kind]}
                </button>
              ))}
              {documents.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  No documents with variants found
                </div>
              )}
            </div>

            {/* Content Area */}
            {getCurrentDoc() && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Filename */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">File:</span> {getCurrentDoc()?.filename}
                  </p>
                </div>

                {/* Variant Type Tabs */}
                <div className="flex gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800/30">
                  <button
                    onClick={() => setActiveVariantTab('raw')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeVariantTab === 'raw'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                    }`}
                  >
                    <FileText size={16} />
                    <span>Raw Text</span>
                    {getCurrentDoc()?.raw && (
                      <span className="text-xs opacity-70">
                        ({getCurrentDoc()?.raw?.tokenCount?.toLocaleString() || 0} tokens)
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveVariantTab('ai_optimized')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeVariantTab === 'ai_optimized'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800'
                    }`}
                  >
                    <Zap size={16} />
                    <span>AI-Optimized</span>
                    {getCurrentDoc()?.aiOptimized && (
                      <span className="text-xs opacity-70">
                        ({getCurrentDoc()?.aiOptimized?.tokenCount?.toLocaleString() || 0} tokens)
                      </span>
                    )}
                  </button>
                </div>

                {/* Variant Content */}
                <div className="flex-1 overflow-auto p-6">
                  <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {formatContent(getCurrentVariant())}
                  </pre>
                </div>

                {/* Footer Info */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p><strong>Raw Text:</strong> Locally extracted UTF-8 text (free, immediate, complete)</p>
                    <p><strong>AI-Optimized:</strong> Cleaned & condensed for efficient analysis (~$0.01, 75% fewer tokens)</p>
                  </div>
                </div>
              </div>
            )}

            {!getCurrentDoc() && !loading && (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="font-medium">No variants available</p>
                  <p className="text-sm mt-2">Click "Refresh Data" in the Data Pipeline section to generate variants</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

