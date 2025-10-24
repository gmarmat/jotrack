"use client";
import useSWR, { useSWRConfig } from 'swr';
import { fetcher } from '@/src/lib/swr';
import { getNormalizedPathFromVersion, warnIfNoNormalized } from '@/src/interview-coach/attachments/variantPath';

export default function AttachmentQuickAccess({ jobId }: { jobId: string }) {
  const { data: resume, isLoading: lr } = useSWR(`/api/jobs/${jobId}/attachments/versions?kind=resume`, fetcher);
  const { data: jd,     isLoading: lj } = useSWR(`/api/jobs/${jobId}/attachments/versions?kind=jd`,     fetcher);

  const rv = resume?.versions?.[0];
  const jv = jd?.versions?.[0];

  const resumePath = rv ? getNormalizedPathFromVersion(rv) : undefined;
  const jdPath     = jv ? getNormalizedPathFromVersion(jv) : undefined;

  if (rv) warnIfNoNormalized(rv, 'resume');
  if (jv) warnIfNoNormalized(jv, 'jd');

  const open = (p?: string) => {
    if (!p) return;
    const href = `/api/files/stream?path=${encodeURIComponent(p)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex gap-2">
      <button
        data-testid="qa-resume-ai"
        disabled={lr || !resumePath}
        onClick={() => open(resumePath)}
        className="btn btn-sm"
        title={lr ? 'Building…' : resumePath ? 'Open normalized Resume' : 'Not ready yet'}
      >
        Resume (AI)
      </button>
      <button
        data-testid="qa-jd-ai"
        disabled={lj || !jdPath}
        onClick={() => open(jdPath)}
        className="btn btn-sm"
        title={lj ? 'Building…' : jdPath ? 'Open normalized JD' : 'Not ready yet'}
      >
        JD (AI)
      </button>
    </div>
  );
}
