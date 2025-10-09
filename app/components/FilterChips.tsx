"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ORDERED_STATUSES, STATUS_LABELS, type JobStatus } from "@/lib/status";

export default function FilterChips() {
  const router = useRouter();
  const params = useSearchParams();
  const statusParam = params.get("status");
  const active = statusParam ? (statusParam as JobStatus) : "ALL";

  const setStatus = (value: JobStatus | "ALL") => {
    const q = new URLSearchParams(params.toString());
    if (value === "ALL") q.delete("status");
    else q.set("status", value);
    router.push(`/?${q.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => setStatus("ALL")}
        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
          active === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
        }`}
        data-testid="chip-ALL"
      >
        All
      </button>
      {ORDERED_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            active === s ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
          }`}
          data-testid={`chip-${s}`}
          title={STATUS_LABELS[s]}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}

