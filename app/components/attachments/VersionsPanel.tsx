"use client";

import { useEffect, useMemo, useState } from "react";
import { useVersions, type VersionRec } from "@/app/hooks/useVersions";

function useLocalOrder(jobId: string, kind: string) {
  const key = `order:${jobId}:${kind}`;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
    } catch {
      return [];
    }
  };
  const write = (ids: string[]) => localStorage.setItem(key, JSON.stringify(ids));
  return { read, write };
}

export default function VersionsPanel({
  jobId,
  kind,
  children,
}: {
  jobId: string;
  kind: "resume" | "jd" | "cover_letter" | "other";
  children: (rec: VersionRec, index: number) => React.ReactNode;
}) {
  const { data } = useVersions(jobId, kind);
  const { read, write } = useLocalOrder(jobId, kind);
  const [drag, setDrag] = useState<{ id: string | null; over: string | null }>({
    id: null,
    over: null,
  });

  const ordered = useMemo(() => {
    const order = read();
    const byId = new Map(data.map((d) => [d.id, d]));
    const head = order.map((id) => byId.get(id)).filter(Boolean) as VersionRec[];
    const tail = data
      .filter((d) => !order.includes(d.id))
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC (newest first)
    return [...head, ...tail];
  }, [data, read]);

  useEffect(() => {
    write(ordered.map((x) => x.id));
  }, [ordered, write]);

  const onDragStart = (id: string) => setDrag({ id, over: null });
  const onDragOver = (id: string) => setDrag((s) => ({ ...s, over: id }));
  const onDrop = () => {
    const { id, over } = drag;
    if (!id || !over || id === over) return;
    const ids = ordered.map((x) => x.id);
    const from = ids.indexOf(id),
      to = ids.indexOf(over);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    write(ids);
    setDrag({ id: null, over: null });
  };

  return (
    <div 
      data-testid={`versions-${kind}`} 
      role="table" 
      aria-label={`${kind} versions`}
    >
      {ordered.map((rec, idx) => (
        <div
          key={rec.id}
          role="row"
          draggable
          onDragStart={() => onDragStart(rec.id)}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(rec.id);
          }}
          onDrop={onDrop}
          className={`flex items-center justify-between border rounded-lg p-3 my-2 cursor-move 
            hover:bg-blue-50/50 dark:hover:bg-gray-700/30 
            bg-white dark:bg-gray-800 
            border-gray-200 dark:border-gray-700
            transition-colors ${
            drag.over === rec.id ? "ring-2 ring-blue-300 bg-blue-50" : ""
          }`}
          data-testid={`version-row-${rec.version}`}
          aria-label={`v${rec.version}${rec.isActive ? " active" : ""}`}
        >
          <div role="cell" className="flex-1 min-w-0">
            {children(rec, idx)}
          </div>
        </div>
      ))}
    </div>
  );
}

