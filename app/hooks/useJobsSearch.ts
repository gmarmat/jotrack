"use client";
import useSWR from "swr";

export type JobStatus = "ON_RADAR"|"APPLIED"|"PHONE_SCREEN"|"ONSITE"|"OFFER"|"REJECTED";
export type HasKind = "resume"|"jd"|"cover_letter"|"notes";

export type SearchParams = {
  q?: string;
  statuses?: JobStatus[];
  has?: HasKind[];
  sort?: "recent"|"created";
};

const fetcher = (u: string) => fetch(u, { headers: { accept: "application/json" } }).then(r => r.json());

export function useJobsSearch(p: SearchParams) {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.statuses?.length) qs.set("statuses", p.statuses.join(","));
  if (p.has?.length) qs.set("has", p.has.join(","));
  if (p.sort) qs.set("sort", p.sort);
  const key = `/api/jobs/search${qs.toString() ? `?${qs}` : ""}`;
  const { data, isLoading, error, mutate } = useSWR<{ jobs: any[] }>(key, fetcher, { revalidateOnFocus: true });
  return { jobs: data?.jobs ?? [], isLoading, error, refresh: mutate };
}

