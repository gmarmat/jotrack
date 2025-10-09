import Link from "next/link";
import { FileText, FileSearch, FileSignature } from "lucide-react";

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
            className="relative p-1 rounded hover:bg-gray-100 inline-flex items-center transition-colors"
            data-testid={`attn-${k}-${present ? "on" : "off"}`}
          >
            <span
              className={`inline-flex ${
                present ? "text-gray-700 opacity-100" : "text-gray-300 opacity-40"
              }`}
              aria-label={label}
            >
              {iconFor(k)}
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

function iconFor(k: Kind) {
  const size = 16;
  
  if (k === "resume") {
    return <FileText size={size} />;
  }
  
  if (k === "jd") {
    return <FileSearch size={size} />;
  }
  
  // cover_letter
  return <FileSignature size={size} />;
}

