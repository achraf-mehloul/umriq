import { createFileRoute } from "@tanstack/react-router";
import { useAllOffersAdmin, useAdminUpdateOfferStatus } from "@/lib/admin-api";
import { Pause, Play, XCircle, PackageSearch } from "lucide-react";

export const Route = createFileRoute("/admin/offers")({
  component: OffersAdmin,
});

function OffersAdmin() {
  const { data: offers = [], isLoading } = useAllOffersAdmin();
  const update = useAdminUpdateOfferStatus();

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/50">Content</p>
      <h1 className="text-3xl font-bold mt-1 mb-6">All offers</h1>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <PackageSearch className="mx-auto size-10 mb-3 opacity-40" />
          No offers.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Airline</th>
                <th className="text-left px-4 py-3 font-semibold">Route</th>
                <th className="text-left px-4 py-3 font-semibold">Agency</th>
                <th className="text-right px-4 py-3 font-semibold">Price</th>
                <th className="text-right px-4 py-3 font-semibold">Seats</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{o.airline}</td>
                  <td className="px-4 py-3 text-white/70">{o.city_from_en} → {o.city_to_en}</td>
                  <td className="px-4 py-3 text-white/70 truncate max-w-[200px]">{o.agencies?.name_en ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{o.price.toLocaleString()} {o.currency}</td>
                  <td className="px-4 py-3 text-right">{o.remaining_seats}/{o.total_seats}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      o.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                      o.status === "paused" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                      "bg-white/10 text-white/60 border-white/20"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {o.status !== "paused" && <button title="Pause" onClick={() => update.mutate({ id: o.id, status: "paused" })} className="size-8 rounded-lg bg-white/10 hover:bg-white/20 grid place-items-center"><Pause className="size-3.5" /></button>}
                      {o.status !== "active" && <button title="Activate" onClick={() => update.mutate({ id: o.id, status: "active" })} className="size-8 rounded-lg bg-white/10 hover:bg-white/20 grid place-items-center"><Play className="size-3.5" /></button>}
                      <button title="Expire" onClick={() => update.mutate({ id: o.id, status: "expired" })} className="size-8 rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 grid place-items-center"><XCircle className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
