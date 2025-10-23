'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Zap, FileCode } from 'lucide-react';

interface Variant {
  variantType: 'raw' | 'ai_optimized' | 'detailed';
  content: any;
  tokenCount?: number;
  createdAt: number;
}

interface VariantViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachmentId: string;
  filename: string;
  kind: string;
}

export default function VariantViewerModal({
  isOpen,
  onClose,
  attachmentId,
  filename,
  kind,
}: VariantViewerModalProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'raw' | 'ai_optimized' | 'detailed'>('ai_optimized');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attachmentId) {
      fetchVariants();
    }
  }, [isOpen, attachmentId]);

  const fetchVariants = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/variants`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch variants');
      }
      
      const data = await res.json();
      setVariants(data.variants || []);
      
      // Auto-select first available variant
      if (data.variants?.length > 0) {
        const order: ('ai_optimized' | 'raw' | 'detailed')[] = ['ai_optimized', 'raw', 'detailed'];
        const firstAvailable = order.find(type => 
          data.variants.some((v: Variant) => v.variantType === type)
        );
        if (firstAvailable) {
          setActiveTab(firstAvailable);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch variants:', err);
      setError(err.message || 'Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const getVariant = (type: string) => {
    const variantsOfType = variants.filter(v => v.variantType === type);
    if (variantsOfType.length === 0) return undefined;
    
    // For ai_optimized, prefer variants with text field
    if (type === 'ai_optimized') {
      const withText = variantsOfType.find(v => v.content?.text && typeof v.content.text === 'string');
      if (withText) return withText;
    }
    
    // Fallback to most recent (highest createdAt)
    return variantsOfType.sort((a, b) => b.createdAt - a.createdAt)[0];
  };

  const formatContent = (variant: Variant | undefined) => {
    if (!variant) return 'No data available';
    
    // Handle different content formats
    if (typeof variant.content === 'string') {
      return variant.content;
    }
    
    // New format: { text: "...", wordCount: 123, variant: "normalized" }
    if (variant.content?.text && typeof variant.content.text === 'string') {
      return variant.content.text;
    }
    
    // Old format: structured JSON or fallback
    return JSON.stringify(variant.content, null, 2);
  };

  const getVariantStats = (variant: Variant | undefined) => {
    if (!variant) return null;
    
    const tokens = variant.tokenCount || 0;
    const date = new Date(variant.createdAt).toLocaleString();
    
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-4">
        <span>📊 {tokens.toLocaleString()} tokens</span>
        <span>🕒 {date}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Data Variants
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filename} <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{kind}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Three-Column Layout */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4 h-full">
              {/* Column 1: Raw */}
              <div className="flex flex-col border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-sm text-blue-900 dark:text-blue-200">Raw</span>
                  </div>
                  {getVariant('raw') && (
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {getVariant('raw')?.tokenCount?.toLocaleString() || 0} tokens
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-3 bg-white dark:bg-gray-900">
                  {!getVariant('raw') ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Not extracted yet
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {formatContent(getVariant('raw'))}
                    </pre>
                  )}
                </div>
              </div>

              {/* Column 2: Normalized */}
              <div className="flex flex-col border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
                <div className="bg-purple-100 dark:bg-purple-900/30 px-3 py-2 border-b border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-sm text-purple-900 dark:text-purple-200">Normalized</span>
                  </div>
                  {getVariant('ai_optimized') && (
                    <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      {getVariant('ai_optimized')?.tokenCount?.toLocaleString() || 0} tokens
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-3 bg-white dark:bg-gray-900">
                  {!getVariant('ai_optimized') ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Not available - Click "Refresh Data" in Data Pipeline section
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {formatContent(getVariant('ai_optimized'))}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="mb-1"><strong>📄 Raw:</strong> Local text extraction (free, fast)</p>
            <p className="mb-1"><strong>🤖 Normalized:</strong> Structured data for AI analysis (token-efficient)</p>
            <p><strong>📋 Detailed:</strong> Full extraction with all metadata</p>
          </div>
        </div>
      </div>
    </div>
  );
}

