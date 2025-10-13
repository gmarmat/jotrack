'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock, Check, AlertCircle } from 'lucide-react';

export default function CoachAiSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [usage, setUsage] = useState<{ totalTokens: number; estimatedCost: string } | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchUsage();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai/keyvault/status');
      const data = await response.json();
      
      setNetworkEnabled(data.networkEnabled);
      setProvider(data.provider || 'openai');
      setModel(data.model || 'gpt-4o-mini');
      setHasApiKey(data.hasApiKey);
    } catch (error) {
      console.error('Error fetching AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      // For now, just show placeholder
      // In production, you'd pass an actual jobId or get global usage
      const response = await fetch('/api/ai/usage');
      const data = await response.json();
      setUsage({
        totalTokens: data.totalTokens || 0,
        estimatedCost: data.estimatedCost || '0.00',
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
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

      if (response.ok) {
        setShowSuccess(true);
        if (apiKey) {
          setHasApiKey(true);
          setApiKey(''); // Clear input after saving
        }
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving AI settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="coach-ai-settings">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Coach Mode AI & Privacy
        </h2>
        <p className="text-sm text-gray-600">
          Configure AI provider settings for Coach Mode. BYOK (Bring Your Own Key) required for network calls.
        </p>
      </div>

      {/* Network Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={networkEnabled}
            onChange={(e) => setNetworkEnabled(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            data-testid="network-toggle"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {networkEnabled ? (
                <Unlock className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-900">
                Network {networkEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {networkEnabled
                ? 'Coach Mode will use your API key to call AI providers'
                : 'Coach Mode runs in local dry-run mode (mock responses)'}
            </p>
          </div>
        </label>
      </div>

      {/* Provider Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="provider-select"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic" disabled>
              Anthropic (coming soon)
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="model-select"
          >
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
            {hasApiKey && (
              <span className="ml-2 text-xs text-green-600">
                (configured ✓)
              </span>
            )}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? '••••••••••••••••' : 'sk-...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="api-key-input"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your API key is encrypted and stored securely on your device only.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="save-coach-settings"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {showSuccess && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
      </div>

      {/* Token Usage Display */}
      {usage && networkEnabled && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Token Usage</h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Total Tokens:</span> {usage.totalTokens.toLocaleString()}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Estimated Cost:</span> ${usage.estimatedCost}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Costs are approximate based on gpt-4o-mini pricing. Actual costs may vary.
            </p>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-700 space-y-2">
            <p>
              <strong>Privacy First:</strong> Your API key is encrypted with AES-256
              and stored in the local database. It&apos;s never transmitted to any server
              except the AI provider you configure.
            </p>
            <p>
              <strong>PII Redaction:</strong> Before sending any data to AI providers,
              we automatically redact emails, phone numbers, and other PII patterns.
            </p>
            <p>
              <strong>Dry-Run Mode:</strong> With Network OFF, all AI features work
              with mock responses locally. Perfect for testing and demos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

