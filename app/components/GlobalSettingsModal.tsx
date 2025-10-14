'use client';

import { useState, useEffect } from 'react';
import { X, Key, Database, Sliders, Code, Sparkles, Download, Upload, Trash2, Clock } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      data-testid="global-settings-modal"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close settings"
            data-testid="close-global-settings"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    // Save logic (reuse from existing settings page)
    try {
      await fetch('/api/ai/keyvault/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey, networkEnabled }),
      });
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey }),
      });
      
      const data = await res.json();
      setTestResult({
        success: res.ok,
        message: res.ok ? 'Connection successful!' : data.error || 'Connection failed'
      });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Configuration
        </h3>
        <p className="text-sm text-gray-600">
          Configure AI analysis for Coach Mode. Keys are stored securely and never sent to the browser.
        </p>
      </div>

      {/* Network Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-900">Enable AI Analysis</label>
          <p className="text-xs text-gray-600">Use AI for advanced insights</p>
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
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              data-testid="ai-provider"
            >
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              data-testid="ai-model"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              data-testid="ai-key"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API key is encrypted and stored securely on the server
            </p>
          </div>

          {/* Test & Save */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={isTesting || !apiKey}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.message}
            </div>
          )}
        </>
      )}

      {/* Usage Dashboard */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Usage Monitor</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">Today</p>
            <p className="text-lg font-bold text-blue-900">2,340</p>
            <p className="text-xs text-blue-600">tokens</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700">This Month</p>
            <p className="text-lg font-bold text-purple-900">45,678</p>
            <p className="text-xs text-purple-600">tokens</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-700">Est. Cost</p>
            <p className="text-lg font-bold text-green-900">$2.34</p>
            <p className="text-xs text-green-600">this month</p>
          </div>
        </div>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Backup & Restore
        </h3>
        <p className="text-sm text-gray-600">
          Protect your data with backups and restore from previous versions.
        </p>
      </div>

      {/* Backup */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Create Backup</h4>
            <p className="text-xs text-blue-700 mt-1">
              Download a complete backup of your database and attachments
            </p>
          </div>
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            data-testid="backup-button"
          >
            <Download size={16} />
            Backup Now
          </button>
        </div>
      </div>

      {/* Restore */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-purple-900">Restore from Backup</h4>
            <p className="text-xs text-purple-700 mt-1">
              Upload a backup file to restore your data
            </p>
          </div>
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            data-testid="restore-button"
          >
            <Upload size={16} />
            Restore
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-green-900">Export to CSV</h4>
            <p className="text-xs text-green-700 mt-1">
              Export all jobs and metadata to a CSV file
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            data-testid="export-csv-button"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stale Threshold */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock size={16} />
          Staleness Settings
        </h4>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Mark jobs as stale after:</label>
          <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-red-200">
        <h4 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
          <Trash2 size={16} />
          Danger Zone
        </h4>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 mb-3">
            Permanently delete all jobs in trash (5+ days old)
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Preferences</h3>
        <p className="text-sm text-gray-600">
          Customize your JoTrack experience
        </p>
      </div>

      <div className="text-sm text-gray-500 italic">
        Theme settings, notifications, and other preferences coming soon...
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Code className="w-5 h-5 text-gray-700" />
          Developer Tools
        </h3>
        <p className="text-sm text-gray-600">
          Advanced settings for debugging and prompt management
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Prompt Editor</h4>
          <p className="text-xs text-gray-600 mb-3">
            Edit AI prompts with Monaco Editor, version control, and live testing
          </p>
          <div className="grid grid-cols-2 gap-2">
            {prompts.map(({ kind, label }) => (
              <button
                key={kind}
                onClick={() => handleOpenPromptEditor(kind)}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm text-left"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Rate Limits</h4>
          <p className="text-xs text-gray-600">
            Current: 1000 AI calls per 5 minutes
          </p>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Debug Mode</h4>
          <p className="text-xs text-gray-600 mb-3">
            Show raw JSON responses from AI (for troubleshooting)
          </p>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-gray-700">Enable debug logging</span>
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

