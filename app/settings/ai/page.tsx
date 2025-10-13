'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, TestTube, Check, AlertCircle, Loader2, Key, Globe, Shield } from 'lucide-react';

export default function AiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai/keyvault/status');
      const data = await response.json();
      
      setNetworkEnabled(data.networkEnabled || false);
      setProvider(data.provider || 'openai');
      setModel(data.model || 'gpt-4o-mini');
      setHasApiKey(data.hasApiKey || false);
    } catch (error) {
      console.error('Error fetching AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setShowSuccess(false);

    try {
      const response = await fetch('/api/ai/keyvault/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkEnabled,
          provider,
          model,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setShowSuccess(true);
      if (apiKey) {
        setHasApiKey(true);
        setApiKey(''); // Clear input after saving
      }
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving AI settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);

    try {
      // Simple test to verify API key without needing a job
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(data.message || 'Test failed');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setError(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" data-testid="ai-settings-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI & Privacy</h1>
          </div>
          <p className="text-gray-600">
            Configure AI analysis for Coach Mode. Keys are stored securely on your device/server and never sent to the browser.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Network Status</h3>
            </div>
            <div className="flex items-center gap-3">
              {networkEnabled ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">AI (Remote)</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Local (Dry-run)</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Security</h3>
            </div>
            <div className="flex items-center gap-3">
              {hasApiKey ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">API Key Configured</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-700 font-medium">No API Key</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Settings Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration</h2>

          {/* Network Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={networkEnabled}
                onChange={(e) => setNetworkEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                data-testid="ai-toggle"
              />
              <div>
                <div className="font-medium text-gray-900">Enable Network AI</div>
                <div className="text-sm text-gray-600">
                  Use remote AI services for analysis. Disable for local dry-run mode.
                </div>
              </div>
            </label>
          </div>

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="ai-provider"
            >
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="ai-model"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? "••••••••••••••••" : "sk-..."}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="ai-key"
            />
            <p className="text-xs text-gray-500 mt-1">
              {hasApiKey 
                ? "API key is configured. Leave empty to keep current key."
                : "Enter your OpenAI API key to enable remote AI analysis."
              }
            </p>
          </div>

          {/* Warning for missing key */}
          {networkEnabled && !hasApiKey && !apiKey && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">API Key Required</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Network AI is enabled but no API key is configured. Add your API key above to use remote analysis.
              </p>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                <span className="font-medium">Settings Saved</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your AI configuration has been updated successfully.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>

            {networkEnabled && hasApiKey && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>Local Mode (Network OFF):</strong> Uses deterministic mock data for analysis. No API calls made.
            </div>
            <div>
              <strong>Remote Mode (Network ON):</strong> Sends analysis requests to OpenAI. Your API key is encrypted and stored securely.
            </div>
            <div>
              <strong>Privacy:</strong> Keys are stored encrypted on your device/server. They are never sent to the browser or logged.
            </div>
            <div>
              <strong>Coach Mode:</strong> Navigate to any job → Coach Mode to use these AI settings for analysis.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
