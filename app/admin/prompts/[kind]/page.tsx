'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Save, RotateCcw, Eye, AlertCircle, CheckCircle } from 'lucide-react';

const ALLOWED_KINDS = ['analyze', 'compare', 'improve', 'skillpath', 'persona'];

interface PromptEditorProps {
  params: Promise<{ kind: string }> | { kind: string };
}

export default function PromptEditor({ params }: PromptEditorProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const kind = resolvedParams.kind;
  const router = useRouter();

  const [version, setVersion] = useState('v1');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, [kind, version]);

  const loadPrompt = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/prompts?kind=${kind}&version=${version}`);
      
      if (!response.ok) {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to load prompt' });
        setContent('');
        setOriginalContent('');
        return;
      }

      const data = await response.json();
      setContent(data.content);
      setOriginalContent(data.content);
    } catch (error) {
      console.error('Error loading prompt:', error);
      setMessage({ type: 'error', text: 'Failed to load prompt' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Generate new version
    const newVersion = incrementVersion(version);

    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          version: newVersion,
          content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save prompt' });
        return;
      }

      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      setVersion(newVersion);
      setOriginalContent(content);
    } catch (error) {
      console.error('Error saving prompt:', error);
      setMessage({ type: 'error', text: 'Failed to save prompt' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setContent(originalContent);
    setMessage({ type: 'success', text: 'Reverted to saved version' });
  };

  const hasChanges = content !== originalContent;

  // Check if kind is valid
  if (!ALLOWED_KINDS.includes(kind)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Invalid Prompt Kind</h2>
            </div>
            <p className="text-red-700">
              Kind must be one of: {ALLOWED_KINDS.join(', ')}
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Prompt Editor: {kind}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Edit AI prompt templates. Saving creates a new version.
              </p>
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Settings
            </button>
          </div>

          {/* Version selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Version:</label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="v1">v1</option>
              <option value="v1a">v1a</option>
              <option value="v1b">v1b</option>
              <option value="v2">v2</option>
            </select>
            <button
              onClick={loadPrompt}
              disabled={loading}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Reload
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : `Save as ${incrementVersion(version)}`}
              </button>
              <button
                onClick={handleRevert}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Revert
              </button>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-gray-200">
            {/* Editor */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Editor</h3>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[600px] p-4 font-mono text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Prompt content will appear here..."
                  spellCheck={false}
                />
              )}
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview (Markdown)</h3>
                <div className="prose prose-sm max-w-none h-[600px] overflow-auto p-4 bg-gray-50 rounded-md border border-gray-200">
                  <pre className="whitespace-pre-wrap text-xs">{content}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use <code>{'{'}{'{'} placeholders {'}'}{'}'}</code> for dynamic values (e.g., {'{'}{'{'} jobTitle {'}'}{'}'})</li>
            <li>Include the output contract in JSON format for AI to follow</li>
            <li>Saving creates a new version - old versions are preserved</li>
            <li>Test prompts using the evaluation harness: <code>npm run eval:prompts</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function incrementVersion(version: string): string {
  const match = version.match(/^v(\d+)([a-z]?)$/);
  if (!match) return 'v1a';

  const num = match[1];
  const letter = match[2];

  if (!letter) {
    return `v${num}a`;
  }

  const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
  return `v${num}${nextLetter}`;
}

