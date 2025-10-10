import useSWR, { mutate as globalMutate } from "swr";

export type AttachmentKind = "resume" | "jd" | "cover_letter" | "other";

export type VersionRec = {
  id: string;
  jobId?: string;
  kind: AttachmentKind;
  filename: string;
  path: string;
  size: number;
  version: number;
  isActive: boolean;
  createdAt: number;
  deletedAt: number | null;
};

const fetcher = (url: string) =>
  fetch(url, { headers: { accept: "application/json" } }).then((r) => {
    if (!r.ok) throw new Error(`Fetch ${url} failed`);
    return r.json();
  });

export function useVersions(jobId: string, kind: AttachmentKind) {
  const key =
    jobId && kind
      ? `/api/jobs/${jobId}/attachments/versions?kind=${kind}`
      : null;
  const { data, error, isLoading, mutate } = useSWR<{ versions: VersionRec[] }>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );

  const refresh = () => mutate(); // deterministic explicit refresh

  // Helpers for optimistic updates
  const setActiveLocal = (version: number) =>
    mutate(
      (prev) =>
        prev
          ? {
              versions: prev.versions.map((v) => ({
                ...v,
                isActive: v.version === version,
              })),
            }
          : prev,
      { revalidate: false }
    );

  const removeLocal = (id: string) =>
    mutate(
      (prev) =>
        prev ? { versions: prev.versions.filter((v) => v.id !== id) } : prev,
      { revalidate: false }
    );

  const upsertLocal = (rec: VersionRec) =>
    mutate(
      (prev) => {
        const list = prev?.versions ?? [];
        const idx = list.findIndex((v) => v.id === rec.id);
        const next =
          idx >= 0 ? list.map((v) => (v.id === rec.id ? rec : v)) : [rec, ...list];
        return { versions: next.sort((a, b) => b.version - a.version) };
      },
      { revalidate: false }
    );

  // Global refresh for all kinds of this job (used by Upload that returns new record)
  const refreshAllKinds = () =>
    globalMutate((keyStr: string) =>
      typeof keyStr === 'string' && keyStr.startsWith(`/api/jobs/${jobId}/attachments/versions?kind=`)
    );

  return {
    data: data?.versions ?? [],
    error,
    isLoading,
    refresh,
    setActiveLocal,
    removeLocal,
    upsertLocal,
    refreshAllKinds,
  };
}
