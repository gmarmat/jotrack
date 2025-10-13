"use client";

import { useEffect, useState } from "react";
import StaleThreshold from "./components/StaleThreshold";
import CoachAiSettings from "./components/CoachAiSettings";

export default function SettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [key, setKey] = useState("");

  useEffect(() => {
    setEnabled(localStorage.getItem("ai.enabled") === "1");
    setKey(localStorage.getItem("ai.key.masked") ?? "");
  }, []);

  const save = () => {
    // store only masked preview for UI; real key kept in memory per session
    localStorage.setItem("ai.enabled", enabled ? "1" : "0");
    localStorage.setItem(
      "ai.key.masked",
      key ? `${key.slice(0, 4)}•••${key.slice(-2)}` : ""
    );
    sessionStorage.setItem("ai.key.session", key || "");
    alert("Saved (local only).");
  };

  const clear = () => {
    localStorage.removeItem("ai.enabled");
    localStorage.removeItem("ai.key.masked");
    sessionStorage.removeItem("ai.key.session");
    setKey("");
    setEnabled(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6" data-testid="settings-ai">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">
              Configure AI Assist and other preferences
            </p>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Assist</h2>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                aria-label="Enable AI Assist"
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Enable AI Assist (privacy gate)
              </span>
            </label>

            <div className="space-y-2">
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="api-key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="OpenAI API Key"
                />
                <button
                  onClick={save}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                  data-testid="ai-save"
                >
                  Save
                </button>
                <button
                  onClick={clear}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                  data-testid="ai-clear"
                >
                  Clear
                </button>
              </div>
            </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-gray-700">
              <strong>Privacy First:</strong> Keys are stored{" "}
              <b>locally only</b> (masked in localStorage; full key in
              sessionStorage) and never sent anywhere by default. AI features
              require explicit user action and operate in dry-run mode unless
              you configure them otherwise.
            </p>
          </div>
        </div>

        {/* Coach Mode AI Settings */}
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Coach Mode AI</h2>
            <a
              href="/settings/ai"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Advanced AI Settings →
            </a>
          </div>
          <CoachAiSettings />
        </div>

        {/* Stale Threshold */}
        <div className="border-t pt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Timeline Settings</h2>
          <StaleThreshold />
        </div>

          <div className="border-t pt-6">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

