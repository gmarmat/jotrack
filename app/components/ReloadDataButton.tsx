"use client";
import { useState } from "react";
import { RotateCw } from "lucide-react";

export default function ReloadDataButton({ onReload }: { onReload: () => Promise<void> | void }) {
  const [loading, setLoading] = useState(false);

  const handleReload = async () => {
    setLoading(true);
    try {
      await onReload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      data-testid="reload-data"
      onClick={handleReload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Force reload from local database"
    >
      <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? "Reloading…" : "Reload Data"}
    </button>
  );
}

