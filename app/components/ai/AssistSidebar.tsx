"use client";

import { useEffect, useState } from "react";
import { aiEnabled } from "@/app/lib/aiGate";

export default function AssistSidebar() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setShow(aiEnabled());
  }, []);

  if (!show) return null;

  const runDryRun = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/ai/dry-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ analyzer: "jd_vs_resume" }),
      });
      const j = await r.json();
      setResult(j);
      alert(`Dry-run: Score ${j.sample.score}`);
    } catch (error) {
      alert("Dry-run failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className="w-80 p-4 border-l bg-gray-50 space-y-3"
      data-testid="ai-sidebar"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">AI Assist</div>
        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
          Dry-run
        </span>
      </div>

      <button
        onClick={runDryRun}
        disabled={loading}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {loading ? "Running..." : "Run Dry-Run Analysis"}
      </button>

      {result && (
        <div className="bg-white border rounded-lg p-3 space-y-2 text-xs">
          <div>
            <span className="font-medium">Score:</span> {result.sample.score}
          </div>
          <div>
            <span className="font-medium">Highlights:</span>
            <ul className="list-disc list-inside text-gray-600 mt-1">
              {result.sample.highlights?.map((h: string, i: number) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-medium">Gaps:</span>
            <ul className="list-disc list-inside text-gray-600 mt-1">
              {result.sample.gaps?.map((g: string, i: number) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600">
        No external calls; deterministic output only.
      </p>
    </aside>
  );
}

