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
    return variants.find(v => v.variantType === type);
  };

  const formatContent = (variant: Variant | undefined) => {
    if (!variant) return 'No data available';
    
    if (variant.variantType === 'raw') {
      // Raw text - show as plain text
      return typeof variant.content === 'string' 
        ? variant.content 
        : variant.content?.text || JSON.stringify(variant.content, null, 2);
    }
    
    // AI variants - show formatted JSON
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('raw')}
            disabled={!getVariant('raw')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            } ${!getVariant('raw') ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileText size={18} />
            <span className="font-medium">Raw Text</span>
            {!getVariant('raw') && <span className="text-xs">(not extracted)</span>}
          </button>

          <button
            onClick={() => setActiveTab('ai_optimized')}
            disabled={!getVariant('ai_optimized')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'ai_optimized'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            } ${!getVariant('ai_optimized') ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Zap size={18} />
            <span className="font-medium">AI-Optimized</span>
            {!getVariant('ai_optimized') && <span className="text-xs">(not generated)</span>}
          </button>

          <button
            onClick={() => setActiveTab('detailed')}
            disabled={!getVariant('detailed')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'detailed'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            } ${!getVariant('detailed') ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileCode size={18} />
            <span className="font-medium">Detailed</span>
            {!getVariant('detailed') && <span className="text-xs">(not generated)</span>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
              {error}
            </div>
          ) : (
            <div>
              {getVariantStats(getVariant(activeTab))}
              <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs overflow-auto font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {formatContent(getVariant(activeTab))}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="mb-1"><strong>📄 Raw:</strong> Local text extraction (free, fast)</p>
            <p className="mb-1"><strong>🤖 AI-Optimized:</strong> Structured data for AI analysis (token-efficient)</p>
            <p><strong>📋 Detailed:</strong> Full extraction with all metadata</p>
          </div>
        </div>
      </div>
    </div>
  );
}

