import Link from "next/link";

type Kind = "resume" | "jd" | "cover_letter";

interface KindInfo {
  count: number;
  latest: number | null;
}

export default function AttachmentPresence({
  summary,
  jobId,
}: {
  summary: Record<Kind, KindInfo | undefined>;
  jobId: string;
}) {
  const kinds: Kind[] = ["resume", "jd", "cover_letter"];

  return (
    <div className="flex items-center gap-2" aria-label="Attachments">
      {kinds.map((k) => {
        const info = summary[k];
        const present = !!info?.count;
        const latest = info?.latest ? new Date(info.latest).toLocaleString() : "—";
        const label = `${labelFor(k)} • ${info?.count ?? 0} file${
          (info?.count ?? 0) === 1 ? "" : "s"
        } (latest: ${latest})`;

        return (
          <Link
            key={k}
            href={`/jobs/${jobId}#attachments`}
            title={label}
            className="relative inline-flex items-center hover:opacity-80 transition-opacity"
            data-testid={`attn-${k}-${present ? "on" : "off"}`}
          >
            <span
              className={`inline-flex h-5 w-5 ${
                present ? "text-gray-700 opacity-100" : "text-gray-300 opacity-40"
              }`}
              aria-label={label}
            >
              {iconFor(k, present)}
            </span>
            {present && info.count > 0 && (
              <span
                className="absolute -top-1 -right-1 text-[10px] leading-none px-1 rounded bg-gray-900 text-white"
                data-testid={`attn-badge-${k}`}
              >
                {info.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function labelFor(k: Kind) {
  return k === "resume" ? "Resume" : k === "jd" ? "Job Description" : "Cover Letter";
}

function iconFor(k: Kind, filled: boolean) {
  const common = "h-5 w-5";
  
  if (k === "resume") {
    return filled ? (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      </svg>
    ) : (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 2v6h6" />
      </svg>
    );
  }
  
  if (k === "jd") {
    return filled ? (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 3h16v18H4z" />
        <path d="M7 7h10M7 11h10M7 15h6" fill="none" stroke="white" strokeWidth="2" />
      </svg>
    ) : (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M7 7h10M7 11h10M7 15h6" />
      </svg>
    );
  }
  
  // cover_letter
  return filled ? (
    <svg className={common} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 5h20v14H2z" />
      <path d="M2 5l10 7 10-7" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  ) : (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="1" />
      <path d="M2 5l10 7 10-7" />
    </svg>
  );
}

