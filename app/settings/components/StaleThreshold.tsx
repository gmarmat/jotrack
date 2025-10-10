"use client";

import { useEffect, useState } from "react";

export default function StaleThreshold() {
  const [days, setDays] = useState(10);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings/stale-threshold");
        const data = await res.json();
        setDays(data.days);
      } catch (error) {
        console.error("Failed to load stale threshold:", error);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/stale-threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      alert("Stale threshold updated!");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="text-sm text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-3" data-testid="stale-threshold-setting">
      <div>
        <label htmlFor="stale-days" className="block text-sm font-medium text-gray-700 mb-2">
          Stale Threshold (days)
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Jobs in the same status for longer than this will show a stale badge
        </p>
        <div className="flex items-center gap-3">
          <input
            id="stale-days"
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 10)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="stale-days-input"
          />
          <span className="text-sm text-gray-700">days</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            data-testid="save-stale-threshold"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> This affects the ⏳ STALE badge on the timeline and header.
          The delta chip will turn amber when a job exceeds this threshold.
        </p>
      </div>
    </div>
  );
}

