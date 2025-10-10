"use client";
import { useEffect, useState } from "react";
import type { JobStatus, HasKind, SearchParams } from "@/app/hooks/useJobsSearch";

const ALL_STATUSES: JobStatus[] = ["ON_RADAR","APPLIED","PHONE_SCREEN","ONSITE","OFFER","REJECTED"];
const HAS: HasKind[] = ["resume","jd","cover_letter","notes"];

export function FiltersBar({ onChange, counts }:{
  onChange:(p:SearchParams)=>void;
  counts?: Partial<Record<HasKind, number>>;
}) {
  const [q,setQ]=useState("");
  const [statuses,setStatuses]=useState<JobStatus[]>([]);
  const [has,setHas]=useState<HasKind[]>([]);
  const [sort,setSort]=useState<"recent"|"created">("recent");

  // hydrate once from URL or sessionStorage
  useEffect(()=>{
    const sp = new URLSearchParams(location.search);
    const saved = sessionStorage.getItem("jotrack.filters");
    const init = saved ? JSON.parse(saved) : Object.fromEntries(sp.entries());
    if (init.q) setQ(init.q);
    if (init.statuses) setStatuses(init.statuses.split(","));
    if (init.has) setHas(init.has.split(","));
    if (init.sort) setSort(init.sort);
  }, []);

  // push changes (debounced) -> parent + URL + sessionStorage
  useEffect(()=>{
    const t = setTimeout(()=>{
      const p: SearchParams = { q, statuses, has, sort };
      onChange(p);
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (statuses.length) qs.set("statuses", statuses.join(","));
      if (has.length) qs.set("has", has.join(","));
      if (sort) qs.set("sort", sort);
      const url = `${location.pathname}${qs.toString()?`?${qs}`:""}`;
      window.history.replaceState(null, "", url);
      sessionStorage.setItem("jotrack.filters", JSON.stringify(Object.fromEntries(qs.entries())));
    }, 200);
    return ()=>clearTimeout(t);
  }, [q,statuses,has,sort,onChange]);

  const toggle=<T,>(arr:T[],v:T)=>arr.includes(v)?arr.filter(x=>x!==v):[...arr,v];

  return (
    <div className="flex flex-wrap items-center gap-2 py-2" data-testid="filters-bar">
      <input data-testid="search-input" value={q} onChange={e=>setQ(e.target.value)}
        placeholder="Search jobs & notes…" className="border rounded px-2 py-1 text-sm w-64" aria-label="Search"/>
      <div aria-label="Status filters" className="flex gap-1">
        {ALL_STATUSES.map(s=>(
          <button key={s} data-testid={`chip-status-${s}`} onClick={()=>setStatuses(v=>toggle(v,s))}
            className={`rounded-full px-2 py-1 text-xs border ${statuses.includes(s)?"bg-gray-200 border-gray-400":"hover:bg-gray-50"}`}
            aria-pressed={statuses.includes(s)} title={s.replace("_"," ")}>{s.replace("_"," ")}</button>
        ))}
      </div>
      <div aria-label="Has filters" className="flex gap-1">
        {HAS.map(h=>(
          <button key={h} data-testid={`chip-has-${h}`} onClick={()=>setHas(v=>toggle(v,h))}
            className={`rounded-full px-2 py-1 text-xs border ${has.includes(h)?"bg-gray-200 border-gray-400":"hover:bg-gray-50"}`}
            aria-pressed={has.includes(h)} title={`Has ${h}`}>
            {h.replace("_"," ")}{typeof counts?.[h]==="number" ? ` (${counts![h]})` : ""}
          </button>
        ))}
      </div>
      <select data-testid="sort-select" value={sort} onChange={e=>setSort(e.target.value as any)}
        className="border rounded px-2 py-1 text-sm min-w-[140px]" aria-label="Sort by">
        <option value="recent">Sort: Recent activity</option>
        <option value="created">Sort: Created date</option>
      </select>
      <button data-testid="clear-filters" onClick={()=>{setQ("");setStatuses([]);setHas([]);setSort("recent");}}
        className="border rounded px-2 py-1 text-sm hover:bg-gray-50">Clear</button>
    </div>
  );
}

