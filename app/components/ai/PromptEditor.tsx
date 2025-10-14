'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Play, Eye, Code2, FileText, History, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, AlertCircle, Check, Copy, Download, Upload
} from 'lucide-react';
import Editor from '@monaco-editor/react';

export interface PromptVersion {
  version: string;
  content: string;
  createdAt: string;
  createdBy: string;
  description?: string;
  isActive: boolean;
}

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  promptKind: string;
  initialVersion?: string;
}

type EditorMode = 'markdown' | 'json';
type ViewMode = 'split' | 'editor' | 'preview';

export default function PromptEditor({ 
  isOpen, 
  onClose, 
  promptKind,
  initialVersion = 'v1'
}: PromptEditorProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>('markdown');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(initialVersion);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Test playground state
  const [testData, setTestData] = useState({
    jobDescription: 'Sample job description...',
    resume: 'Sample resume...',
    companyName: 'Example Corp'
  });

  const editorRef = useRef<any>(null);

  // Load prompt content
  useEffect(() => {
    if (isOpen) {
      loadPrompt();
      loadVersions();
    }
  }, [isOpen, promptKind, currentVersion]);

  // Check for changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const loadPrompt = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ai/prompts/view?kind=${promptKind}&version=${currentVersion}`);
      if (!res.ok) throw new Error('Failed to load prompt');
      const data = await res.json();
      setContent(data.content || '');
      setOriginalContent(data.content || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      const res = await fetch(`/api/ai/prompts/versions?kind=${promptKind}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  };

  const handleSave = async () => {
    if (!saveDescription.trim()) {
      setShowSaveDialog(true);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/prompts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: promptKind,
          content,
          description: saveDescription,
          version: currentVersion
        })
      });

      if (!res.ok) throw new Error('Failed to save prompt');
      
      setOriginalContent(content);
      setSaveDescription('');
      setShowSaveDialog(false);
      await loadVersions();
      
      // Show success
      setError('');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setError('');
    
    try {
      const res = await fetch('/api/ai/prompts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: promptKind,
          prompt: content,
          testData,
          mode: editorMode
        })
      });

      if (!res.ok) throw new Error('Test failed');
      
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setError(`Test error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleVersionSwitch = (version: string) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Switch version anyway?')) {
        return;
      }
    }
    setCurrentVersion(version);
    setShowVersions(false);
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches.map(m => m.slice(2, -2)))] : [];
  };

  const renderPreview = () => {
    let preview = content;
    
    // Substitute variables with test data
    Object.entries(testData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return preview;
  };

  const variables = extractVariables(content);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-[95vh] max-w-[95vw] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Prompt Editor</h2>
              <p className="text-sm text-gray-600">
                {promptKind} - {currentVersion}
                {hasChanges && <span className="ml-2 text-orange-600">• Unsaved changes</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              title="View template variables"
            >
              <Eye className="w-4 h-4" />
              Variables ({variables.length})
            </button>
            
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              title="Version history"
            >
              <History className="w-4 h-4" />
              Versions
            </button>
            
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              <Play className="w-4 h-4" />
              {isTesting ? 'Testing...' : 'Test'}
            </button>
            
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={!hasChanges || isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md p-1">
              <button
                onClick={() => setEditorMode('markdown')}
                className={`px-3 py-1 text-sm rounded ${
                  editorMode === 'markdown'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Markdown
              </button>
              <button
                onClick={() => setEditorMode('json')}
                className={`px-3 py-1 text-sm rounded ${
                  editorMode === 'json'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Code2 className="w-4 h-4 inline mr-1" />
                JSON
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md p-1">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'editor' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Editor only"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'split' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Split view"
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 text-xs rounded ${viewMode === 'preview' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Preview only"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Variables or Versions */}
          {(showVariables || showVersions) && (
            <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              {showVariables && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Template Variables</h3>
                  {variables.length === 0 ? (
                    <p className="text-xs text-gray-500">No variables found</p>
                  ) : (
                    <div className="space-y-2">
                      {variables.map((v) => (
                        <div key={v} className="p-2 bg-white border border-gray-200 rounded text-xs font-mono">
                          {'{{' + v + '}}'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {showVersions && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Version History</h3>
                  {versions.length === 0 ? (
                    <p className="text-xs text-gray-500">No versions found</p>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((v) => (
                        <button
                          key={v.version}
                          onClick={() => handleVersionSwitch(v.version)}
                          className={`w-full text-left p-2 rounded text-xs ${
                            v.version === currentVersion
                              ? 'bg-purple-100 border border-purple-300'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold">{v.version}</div>
                          {v.description && (
                            <div className="text-gray-600 mt-1">{v.description}</div>
                          )}
                          <div className="text-gray-500 mt-1">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Editor Panel */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r border-gray-200' : ''}`}>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={editorMode === 'json' ? 'json' : 'markdown'}
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                  }}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                />
              </div>
            </div>
          )}

          {/* Preview/Test Panel */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
              <div className="border-b border-gray-200 bg-white px-4 py-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {testResult ? 'Test Results' : 'Live Preview'}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {testResult ? (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Response:</h4>
                      <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap text-gray-800">
                      {renderPreview()}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Prompt Version</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version Description
              </label>
              <textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Describe what changed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!saveDescription.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

