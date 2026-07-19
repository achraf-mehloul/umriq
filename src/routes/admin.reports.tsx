import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminReports, useResolveReport, type Report } from "@/lib/admin-api";
import { Flag, Check, X, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: Reports,
});

const TABS = [
  { id: "open", label: "Open" },
  { id: "reviewing", label: "Reviewing" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
] as const;

function Reports() {
  const [tab, setTab] = useState<Report["status"]>("open");
  const { data: reports = [], isLoading } = useAdminReports(tab);
  const resolve = useResolveReport();

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/50">Moderation</p>
      <h1 className="text-3xl font-bold mt-1 mb-6">Reports</h1>

      <div className="flex gap-1 mb-6 rounded-xl bg-white/5 border border-white/10 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t.id ? "bg-white text-[oklch(0.15_0.02_260)]" : "text-white/60 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Flag className="mx-auto size-10 mb-3 opacity-40" />
          Nothing to review.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-0.5 rounded-full">{r.target_type}</span>
                    <span className="text-xs text-white/40 font-mono truncate">{r.target_id.slice(0, 8)}</span>
                    <span className="text-xs text-white/40">· {new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 font-medium">{r.reason}</p>
                  {r.details && <p className="text-sm text-white/60 mt-1 leading-relaxed">{r.details}</p>}
                </div>
                {tab === "open" && (
                  <div className="flex gap-1 shrink-0">
                    <button title="Start review" onClick={() => resolve.mutate({ id: r.id, status: "reviewing" })} className="size-9 rounded-lg bg-white/10 hover:bg-white/20 grid place-items-center"><Eye className="size-4" /></button>
                    <button title="Dismiss" onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })} className="size-9 rounded-lg border border-white/20 hover:bg-white/10 grid place-items-center"><X className="size-4" /></button>
                    <button title="Resolve" onClick={() => resolve.mutate({ id: r.id, status: "resolved" })} className="size-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 grid place-items-center"><Check className="size-4" /></button>
                  </div>
                )}
                {tab === "reviewing" && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })} className="size-9 rounded-lg border border-white/20 hover:bg-white/10 grid place-items-center"><X className="size-4" /></button>
                    <button onClick={() => resolve.mutate({ id: r.id, status: "resolved" })} className="size-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 grid place-items-center"><Check className="size-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
