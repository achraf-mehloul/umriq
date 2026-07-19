import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAgencies, useApproveAgency, useRejectAgency, type KycAgency } from "@/lib/admin-api";
import { BadgeCheck, X, FileText, Building2, Check, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/kyc")({
  component: KycQueue,
});

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

function KycQueue() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("pending");
  const { data: agencies = [], isLoading } = useAdminAgencies(tab);
  const [selected, setSelected] = useState<KycAgency | null>(null);

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/50">Verification</p>
      <h1 className="text-3xl font-bold mt-1 mb-6">KYC Queue</h1>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : agencies.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Building2 className="mx-auto size-10 mb-3 opacity-40" />
          No agencies in this queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agencies.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 p-4 transition"
            >
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-xl bg-white/10 grid place-items-center overflow-hidden shrink-0">
                  {a.logo_url ? <img src={a.logo_url} alt="" className="size-full object-cover" /> : <Building2 className="size-5 text-white/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold truncate">{a.name_en}</h3>
                    {a.verified && <BadgeCheck className="size-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-white/50 truncate">{a.name_ar}</p>
                  <p className="text-xs text-white/40 mt-1">{a.city_en} · License: {a.license_number ?? "—"}</p>
                </div>
                <StatusPill status={a.kyc_status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <KycModal agency={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatusPill({ status }: { status: KycAgency["kyc_status"] }) {
  const map = {
    pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    rejected: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  } as const;
  return <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full border ${map[status]}`}>{status}</span>;
}

function KycModal({ agency, onClose }: { agency: KycAgency; onClose: () => void }) {
  const approve = useApproveAgency();
  const reject = useRejectAgency();
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[oklch(0.18_0.02_260)] p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-2xl bg-white/10 grid place-items-center overflow-hidden">
              {agency.logo_url ? <img src={agency.logo_url} alt="" className="size-full object-cover" /> : <Building2 className="size-6 text-white/40" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">{agency.name_en}</h2>
              <p className="text-sm text-white/60">{agency.name_ar}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-9 rounded-full bg-white/10 grid place-items-center hover:bg-white/20"><X className="size-4" /></button>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <Row k="City" v={`${agency.city_en} / ${agency.city_ar}`} />
          <Row k="License" v={agency.license_number ?? "—"} />
          <Row k="Phone" v={agency.phone ?? "—"} />
          <Row k="Email" v={agency.email ?? "—"} />
          <Row k="Rating" v={Number(agency.rating).toFixed(2)} />
          <Row k="Total deals" v={String(agency.total_deals)} />
          <Row k="Submitted" v={agency.kyc_submitted_at ? new Date(agency.kyc_submitted_at).toLocaleDateString() : new Date(agency.created_at).toLocaleDateString()} />
          <Row k="Reviewed" v={agency.kyc_reviewed_at ? new Date(agency.kyc_reviewed_at).toLocaleDateString() : "—"} />
        </dl>

        {agency.bio_en && <p className="text-sm text-white/70 mb-6 leading-relaxed border-l-2 border-white/20 pl-3">{agency.bio_en}</p>}

        <div className="flex flex-wrap gap-2 mb-6">
          {agency.commercial_register_url && (
            <a href={agency.commercial_register_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
              <FileText className="size-4" /> Commercial register <ExternalLink className="size-3" />
            </a>
          )}
          {agency.license_url && (
            <a href={agency.license_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
              <FileText className="size-4" /> License doc <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {agency.kyc_rejection_reason && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 mb-4 text-sm">
            <p className="text-rose-300 font-semibold mb-1">Rejection reason</p>
            <p className="text-white/80">{agency.kyc_rejection_reason}</p>
          </div>
        )}

        {rejecting ? (
          <div className="space-y-3">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason (visible to the agency owner)"
              className="w-full min-h-[100px] rounded-xl bg-black/30 border border-white/10 p-3 text-sm focus:outline-none focus:border-rose-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setRejecting(false)} className="flex-1 h-11 rounded-xl border border-white/20 font-semibold">Cancel</button>
              <button
                disabled={!reason.trim() || reject.isPending}
                onClick={async () => { await reject.mutateAsync({ id: agency.id, reason }); onClose(); }}
                className="flex-1 h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {reject.isPending && <Loader2 className="size-4 animate-spin" />} Confirm reject
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setRejecting(true)}
              disabled={agency.kyc_status === "rejected"}
              className="flex-1 h-12 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <X className="size-4" /> Reject
            </button>
            <button
              onClick={async () => { await approve.mutateAsync(agency.id); onClose(); }}
              disabled={approve.isPending || agency.kyc_status === "approved"}
              className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Approve & verify
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-white/40">{k}</dt>
      <dd className="text-white/90 mt-0.5">{v}</dd>
    </div>
  );
}
