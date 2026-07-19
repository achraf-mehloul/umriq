import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspensions, useSuspendUser, useLiftSuspension } from "@/lib/admin-api";
import { Ban, UserX, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/suspensions")({
  component: Suspensions,
});

function Suspensions() {
  const { data: suspensions = [], isLoading } = useSuspensions();
  const suspend = useSuspendUser();
  const lift = useLiftSuspension();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");

  const onSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    await suspend.mutateAsync({ userId, reason });
    setUserId(""); setReason("");
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/50">Enforcement</p>
      <h1 className="text-3xl font-bold mt-1 mb-6">Suspensions</h1>

      <form onSubmit={onSuspend} className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">User ID</span>
          <input required value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid" className="mt-1 w-full h-10 rounded-lg bg-black/30 border border-white/10 px-3 text-sm font-mono focus:outline-none focus:border-white/40" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Reason</span>
          <input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Fraud, spam, violation…" className="mt-1 w-full h-10 rounded-lg bg-black/30 border border-white/10 px-3 text-sm focus:outline-none focus:border-white/40" />
        </label>
        <button disabled={suspend.isPending} className="h-10 px-4 rounded-lg bg-rose-500 hover:bg-rose-600 font-semibold flex items-center gap-2 disabled:opacity-50">
          {suspend.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />} Suspend
        </button>
      </form>

      <h2 className="text-lg font-semibold mb-3">Active suspensions</h2>
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : suspensions.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Ban className="mx-auto size-10 mb-3 opacity-40" />
          No active suspensions.
        </div>
      ) : (
        <div className="space-y-2">
          {suspensions.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
              <Ban className="size-5 text-rose-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-white/60 truncate">{s.user_id}</p>
                <p className="text-sm mt-0.5 truncate">{s.reason}</p>
                <p className="text-xs text-white/40 mt-0.5">{new Date(s.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => lift.mutate(s.id)} className="h-9 px-3 rounded-lg border border-white/20 hover:bg-white/10 text-sm font-medium">Lift</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
