'use client';

import { useState, useEffect } from 'react';
import { X, Key, Database, Sliders, Code, Sparkles, Download, Upload, Trash2, Clock, RefreshCw, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

const PromptEditor = dynamic(() => import('./ai/PromptEditor'), { ssr: false });

type SettingsTab = 'ai' | 'data' | 'preferences' | 'developer';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

export default function GlobalSettingsModal({ isOpen, onClose, initialTab = 'ai' }: GlobalSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      data-testid="global-settings-modal"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            aria-label="Close settings"
            data-testid="close-global-settings"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('ai')}
            data-testid="settings-tab-ai"
          >
            <div className="flex items-center gap-2">
              <Key size={16} />
              AI & Privacy
            </div>
          </button>
          
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('data')}
            data-testid="settings-tab-data"
          >
            <div className="flex items-center gap-2">
              <Database size={16} />
              Data Management
            </div>
          </button>
          
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preferences'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('preferences')}
            data-testid="settings-tab-preferences"
          >
            <div className="flex items-center gap-2">
              <Sliders size={16} />
              Preferences
            </div>
          </button>
          
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'developer'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('developer')}
            data-testid="settings-tab-developer"
          >
            <div className="flex items-center gap-2">
              <Code size={16} />
              Developer
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'ai' && <AITab />}
          {activeTab === 'data' && <DataTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'developer' && <DeveloperTab />}
        </div>
      </div>
    </div>
  );
}

// AI & Privacy Tab
function AITab() {
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [provider, setProvider] = useState('claude');
  const [claudeModel, setClaudeModel] = useState('claude-3-5-sonnet-20240620');
  const [claudeKey, setClaudeKey] = useState('');
  const [hasExistingClaudeKey, setHasExistingClaudeKey] = useState(false);
  const [isSavingClaude, setIsSavingClaude] = useState(false);
  const [claudeTestResult, setClaudeTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availableClaudeModels, setAvailableClaudeModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  const [tavilyKey, setTavilyKey] = useState('');
  const [hasExistingTavilyKey, setHasExistingTavilyKey] = useState(false);
  const [isSavingTavily, setIsSavingTavily] = useState(false);
  const [tavilyTestResult, setTavilyTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [openaiKey, setOpenaiKey] = useState('');
  const [hasExistingOpenaiKey, setHasExistingOpenaiKey] = useState(false);
  const [isSavingOpenai, setIsSavingOpenai] = useState(false);
  const [openaiTestResult, setOpenaiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load existing settings and auto-fetch models on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/ai/keyvault/get');
        if (res.ok) {
          const data = await res.json();
          setNetworkEnabled(data.networkEnabled || false);
          setProvider(data.provider || 'claude');
          setClaudeModel(data.claudeModel || 'claude-3-5-sonnet-20240620');
          setOpenaiModel(data.openaiModel || 'gpt-4o-mini');
          setHasExistingClaudeKey(!!data.hasClaudeKey);
          setHasExistingTavilyKey(!!data.hasTavilyKey);
          setHasExistingOpenaiKey(!!data.hasOpenaiKey);
          // Don't set the actual API keys for security
          
          // Auto-load Claude models if key exists
          if (data.hasClaudeKey && data.provider === 'claude') {
            try {
              const modelsRes = await fetch('/api/ai/claude/models');
              if (modelsRes.ok) {
                const modelsData = await modelsRes.json();
                const models = modelsData.models.map((m: any) => ({
                  id: m.id,
                  label: m.label,
                  category: m.category,
                }));
                setAvailableClaudeModels(models);
                // Use recommended model if available
                const defaultModel = modelsData.recommended || models[0]?.id;
                if (defaultModel && !data.claudeModel) {
                  setClaudeModel(defaultModel);
                }
              }
            } catch (error) {
              console.log('Could not auto-load models, user can refresh manually');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save handlers for each service
  const handleSaveClaude = async () => {
    setIsSavingClaude(true);
    setClaudeTestResult(null);
    try {
      const trimmedKey = claudeKey.trim();
      await fetch('/api/ai/keyvault/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'claude',
          claudeKey: trimmedKey || undefined,
          claudeModel,
          networkEnabled 
        }),
      });
      if (trimmedKey) {
        setHasExistingClaudeKey(true);
        setClaudeKey('');
      }
      setClaudeTestResult({ success: true, message: 'Saved!' });
      // Auto-hide success message after 3 seconds
      setTimeout(() => setClaudeTestResult(null), 3000);
    } catch (error) {
      setClaudeTestResult({ success: false, message: 'Failed to save' });
    } finally {
      setIsSavingClaude(false);
    }
  };

  const handleSaveTavily = async () => {
    setIsSavingTavily(true);
    setTavilyTestResult(null);
    try {
      const trimmedKey = tavilyKey.trim();
      await fetch('/api/ai/keyvault/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tavilyKey: trimmedKey || undefined,
        }),
      });
      if (trimmedKey) {
        setHasExistingTavilyKey(true);
        setTavilyKey('');
      }
      setTavilyTestResult({ success: true, message: 'Saved!' });
      setTimeout(() => setTavilyTestResult(null), 3000);
    } catch (error) {
      setTavilyTestResult({ success: false, message: 'Failed to save' });
    } finally {
      setIsSavingTavily(false);
    }
  };

  const handleSaveOpenai = async () => {
    setIsSavingOpenai(true);
    setOpenaiTestResult(null);
    try {
      const trimmedKey = openaiKey.trim();
      await fetch('/api/ai/keyvault/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: 'openai',
          openaiKey: trimmedKey || undefined,
          openaiModel,
        }),
      });
      if (trimmedKey) {
        setHasExistingOpenaiKey(true);
        setOpenaiKey('');
      }
      setOpenaiTestResult({ success: true, message: 'Saved!' });
      setTimeout(() => setOpenaiTestResult(null), 3000);
    } catch (error) {
      setOpenaiTestResult({ success: false, message: 'Failed to save' });
    } finally {
      setIsSavingOpenai(false);
    }
  };

  const handleRefreshModels = async () => {
    setIsLoadingModels(true);
    setClaudeTestResult(null);
    try {
      const res = await fetch('/api/ai/claude/models');
      if (res.ok) {
        const data = await res.json();
        // Use the label and category directly from the API response
        const models = data.models.map((m: any) => ({
          id: m.id,
          label: m.label,
          category: m.category,
        }));
        setAvailableClaudeModels(models);
        // Use the recommended model from API or fallback to first
        const defaultModel = data.recommended || models[0]?.id;
        if (defaultModel) setClaudeModel(defaultModel);
      } else {
        const errorData = await res.json();
        setClaudeTestResult({ success: false, message: `Failed: ${errorData.error}` });
      }
    } catch (error: any) {
      setClaudeTestResult({ success: false, message: `Failed: ${error.message}` });
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with explanation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          AI Configuration
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          JoTrack uses a <strong>two-tier AI system</strong> for maximum accuracy:
        </p>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
          <li>• <strong>Tavily</strong> - Searches the web for real-time company data (CEO, funding, news)</li>
          <li>• <strong>Claude/OpenAI</strong> - Analyzes documents and generates insights</li>
        </ul>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          All keys stored encrypted, never sent to browser. Cost: ~$0.24 per job analysis.
        </p>
      </div>

      {/* Network Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable AI Analysis</label>
          <p className="text-xs text-gray-600 dark:text-gray-400">Use AI for advanced insights</p>
        </div>
        <button
          onClick={() => setNetworkEnabled(!networkEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            networkEnabled ? 'bg-green-600' : 'bg-gray-300'
          }`}
          data-testid="ai-toggle"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              networkEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {networkEnabled && (
        <>
          {/* Two-Column Layout for API Keys */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Section 1: Primary Analysis Engine */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                🧠 Primary Analysis Engine
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Analyzes resumes, JDs, and generates insights. Recommended: Claude for best accuracy.
              </p>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="ai-provider"
              >
                <option value="claude">Claude (Anthropic) - Recommended ⭐</option>
                <option value="openai">OpenAI (Fallback)</option>
              </select>
            </div>

            {/* Claude Model Selection */}
            {provider === 'claude' && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">Claude Model</label>
                    <button
                      onClick={handleRefreshModels}
                      disabled={isLoadingModels || !hasExistingClaudeKey}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={!hasExistingClaudeKey ? "Save Claude key first" : "Refresh model list from Claude API"}
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    </button>
                    {availableClaudeModels.length > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {availableClaudeModels.length} models loaded
                      </span>
                    )}
                  </div>
                  <select
                    value={claudeModel}
                    onChange={(e) => setClaudeModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="claude-model"
                  >
                    {availableClaudeModels.length > 0 ? (
                      // Group models by category
                      <>
                        {['Recommended', 'Budget', 'Best Quality', 'Other'].map(category => {
                          const categoryModels = availableClaudeModels.filter(m => m.category === category);
                          if (categoryModels.length === 0) return null;
                          return (
                            <optgroup key={category} label={category}>
                              {categoryModels.map(model => (
                                <option key={model.id} value={model.id}>
                                  {model.label}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        <optgroup label="Recommended">
                          <option value="claude-3-5-sonnet-20240620">3.5 Sonnet ~ $0.03/job</option>
                        </optgroup>
                        <optgroup label="Budget">
                          <option value="claude-3-haiku-20240307">3 Haiku ~ $0.01/job</option>
                        </optgroup>
                        <optgroup label="Best Quality">
                          <option value="claude-3-opus-20240229">3 Opus ~ $0.15/job</option>
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>

                {/* Claude API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Claude API Key</label>
                  {hasExistingClaudeKey && claudeKey.trim() === '' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
                        ••••••••••••••••••••••••••
                      </div>
                      <button
                        onClick={() => setClaudeKey(' ')}
                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <input
                      type="password"
                      value={claudeKey.trim()}
                      onChange={(e) => setClaudeKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="claude-key"
                    />
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get your key at <span className="font-medium">console.anthropic.com</span> • Pay-as-you-go, no monthly fee
                  </p>
                </div>

                {/* Claude Save Button */}
                <div>
                  <button
                    onClick={handleSaveClaude}
                    disabled={isSavingClaude || (!claudeKey.trim() && !hasExistingClaudeKey)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isSavingClaude ? 'Saving...' : 'Save'}
                    {claudeTestResult?.success && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {/* OpenAI Model Selection */}
            {provider === 'openai' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">OpenAI Model</label>
                  <select
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="openai-model"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Budget) - ~$0.02/job 💰</option>
                    <option value="gpt-4o">GPT-4o (Balanced) - ~$0.10/job</option>
                    <option value="o1-preview">GPT-o1 Preview (Reasoning) - ~$1.00/job</option>
                  </select>
                </div>

                {/* OpenAI API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">OpenAI API Key</label>
                  {hasExistingOpenaiKey && openaiKey.trim() === '' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
                        ••••••••••••••••••••••••••
                      </div>
                      <button
                        onClick={() => setOpenaiKey(' ')}
                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <input
                      type="password"
                      value={openaiKey.trim()}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="openai-key"
                    />
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get your key at <span className="font-medium">platform.openai.com/api-keys</span>
                  </p>
                </div>

                {/* OpenAI Save Button */}
                <div>
                  <button
                    onClick={handleSaveOpenai}
                    disabled={isSavingOpenai || (!openaiKey.trim() && !hasExistingOpenaiKey)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isSavingOpenai ? 'Saving...' : 'Save'}
                    {openaiTestResult?.success && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>

            {/* Section 2: Web Search Engine (Tavily) */}
            <div className="border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 space-y-4 bg-emerald-50/30 dark:bg-emerald-900/10">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                🌐 Web Search (Required for Real Data)
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Tavily searches the web for current company data (CEO, funding, news from Oct 2025). Without this, analysis uses AI training data only (may be outdated).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">Tavily API Key</label>
              {hasExistingTavilyKey && tavilyKey.trim() === '' ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
                    ••••••••••••••••••••••••••
                  </div>
                  <button
                    onClick={() => setTavilyKey(' ')}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <input
                  type="password"
                  value={tavilyKey.trim()}
                  onChange={(e) => setTavilyKey(e.target.value)}
                  placeholder="tvly-..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  data-testid="tavily-key"
                />
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Get free key at <span className="font-medium">app.tavily.com</span> • Free tier: 1000 searches (200 jobs) • Cost after: ~$0.01/job
              </p>
            </div>

            {/* Tavily Save Button */}
            <div>
              <button
                onClick={handleSaveTavily}
                disabled={isSavingTavily || (!tavilyKey.trim() && !hasExistingTavilyKey)}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {isSavingTavily ? 'Saving...' : 'Save'}
                {tavilyTestResult?.success && <Check className="w-4 h-4" />}
              </button>
            </div>
            </div>
          </div>

          {/* Cost Estimate - Full Width Below */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">💰 Estimated Cost Per Job</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Analysis Engine:</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {provider === 'claude' 
                    ? claudeModel.includes('sonnet') ? '~$0.03' : claudeModel.includes('haiku') ? '~$0.01' : '~$0.15'
                    : openaiModel.includes('mini') ? '~$0.02' : openaiModel.includes('gpt-4o') ? '~$0.10' : '~$1.00'
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Web Search:</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {hasExistingTavilyKey || tavilyKey ? '~$0.01' : '$0 (no search)'}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                <p className="text-gray-600 dark:text-gray-400">Total per job:</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
                  ~${(
                    (provider === 'claude' 
                      ? claudeModel.includes('sonnet') ? 0.03 : claudeModel.includes('haiku') ? 0.01 : 0.15
                      : openaiModel.includes('mini') ? 0.02 : openaiModel.includes('gpt-4o') ? 0.10 : 1.00) +
                    (hasExistingTavilyKey || tavilyKey ? 0.01 : 0)
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  50 jobs/year = ${(
                    ((provider === 'claude' 
                      ? claudeModel.includes('sonnet') ? 0.03 : claudeModel.includes('haiku') ? 0.01 : 0.15
                      : openaiModel.includes('mini') ? 0.02 : openaiModel.includes('gpt-4o') ? 0.10 : 1.00) +
                    (hasExistingTavilyKey || tavilyKey ? 0.01 : 0)
                  ) * 50).toFixed(2)} (vs $500+ interview coach!)
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Usage Dashboard */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Usage Monitor</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-400">Today</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">2,340</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">tokens</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-xs text-purple-700 dark:text-purple-400">This Month</p>
            <p className="text-lg font-bold text-purple-900 dark:text-purple-300">45,678</p>
            <p className="text-xs text-purple-600 dark:text-purple-400">tokens</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-400">Est. Cost</p>
            <p className="text-lg font-bold text-green-900 dark:text-green-300">$2.34</p>
            <p className="text-xs text-green-600 dark:text-green-400">this month</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Note: Usage tracking will be implemented in v2.8. These are sample values.
        </p>
      </div>
    </div>
  );
}

// Data Management Tab
function DataTab() {
  const handleBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jotrack-backup-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Backup failed');
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/restore/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          alert('Restore complete! Refreshing...');
          window.location.reload();
        } else {
          alert('Restore failed');
        }
      } catch (error) {
        alert('Restore failed');
      }
    };
    input.click();
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/export/csv');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jotrack-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Backup & Restore
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Protect your data with backups and restore from previous versions.
        </p>
      </div>

      {/* Backup */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Create Backup</h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Download a complete backup of your database and attachments
            </p>
          </div>
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            data-testid="backup-button"
          >
            <Download size={16} />
            Backup Now
          </button>
        </div>
      </div>

      {/* Restore */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">Restore from Backup</h4>
            <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
              Upload a backup file to restore your data
            </p>
          </div>
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            data-testid="restore-button"
          >
            <Upload size={16} />
            Restore
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-300">Export to CSV</h4>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              Export all jobs and metadata to a CSV file
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            data-testid="export-csv-button"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stale Threshold */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-gray-600 dark:text-gray-400" />
          Staleness Settings
        </h4>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 dark:text-gray-300">Mark jobs as stale after:</label>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-red-200 dark:border-red-800">
        <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-3 flex items-center gap-2">
          <Trash2 size={16} />
          Danger Zone
        </h4>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300 mb-3">
            Permanently delete all jobs in trash (5+ days old)
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm transition-colors">
            Purge Trash
          </button>
        </div>
      </div>
    </div>
  );
}

// Preferences Tab
function PreferencesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Customize your JoTrack experience
        </p>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          Theme settings, notifications, and other preferences coming soon...
        </p>
      </div>
    </div>
  );
}

// Developer Tab
function DeveloperTab() {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedPromptKind, setSelectedPromptKind] = useState('');

  const prompts = [
    { kind: 'analyze', label: 'Job Analysis' },
    { kind: 'compare', label: 'Resume Comparison' },
    { kind: 'improve', label: 'Resume Improvement' },
    { kind: 'company', label: 'Company Intelligence' },
    { kind: 'people', label: 'People Profiles' },
    { kind: 'matchSignals', label: 'Match Signals (50)' },
  ];

  const handleOpenPromptEditor = (kind: string) => {
    setSelectedPromptKind(kind);
    setShowPromptEditor(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Code className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          Developer Tools
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Advanced settings for debugging and prompt management
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Prompt Editor</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Edit AI prompts with Monaco Editor, version control, and live testing
          </p>
          <div className="grid grid-cols-2 gap-2">
            {prompts.map(({ kind, label }) => (
              <button
                key={kind}
                onClick={() => handleOpenPromptEditor(kind)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-left transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Rate Limits</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Current: 1000 AI calls per 5 minutes
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Debug Mode</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Show raw JSON responses from AI (for troubleshooting)
          </p>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable debug logging</span>
          </label>
        </div>
      </div>

      {/* Prompt Editor Modal */}
      {showPromptEditor && selectedPromptKind && (
        <PromptEditor
          isOpen={showPromptEditor}
          onClose={() => setShowPromptEditor(false)}
          promptKind={selectedPromptKind}
        />
      )}
    </div>
  );
}

