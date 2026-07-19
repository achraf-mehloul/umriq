import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdminStats } from "@/lib/admin-api";
import { Building2, PackageSearch, Flag, Ticket, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: stats } = useAdminStats();
  const items = [
    { label: "Agencies", value: stats?.agencies ?? 0, icon: Building2, to: "/admin/kyc" as const, tint: "from-amber-500/20 to-yellow-500/5" },
    { label: "Pending KYC", value: stats?.pendingKyc ?? 0, icon: ShieldCheck, to: "/admin/kyc" as const, tint: "from-rose-500/20 to-red-500/5", warn: (stats?.pendingKyc ?? 0) > 0 },
    { label: "Active offers", value: stats?.activeOffers ?? 0, icon: PackageSearch, to: "/admin/offers" as const, tint: "from-emerald-500/20 to-green-500/5" },
    { label: "Bookings", value: stats?.bookings ?? 0, icon: Ticket, to: "/admin/offers" as const, tint: "from-sky-500/20 to-blue-500/5" },
    { label: "Open reports", value: stats?.openReports ?? 0, icon: Flag, to: "/admin/reports" as const, tint: "from-fuchsia-500/20 to-purple-500/5", warn: (stats?.openReports ?? 0) > 0 },
  ];
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/50">Console</p>
      <h1 className="text-3xl font-bold mt-1 mb-8">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((it) => (
          <Link
            key={it.label}
            to={it.to}
            className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${it.tint} p-5 hover:border-white/30 transition group`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/50">{it.label}</p>
                <p className={`mt-2 text-3xl font-bold ${it.warn ? "text-[var(--gold,#d4af37)]" : ""}`}>{it.value}</p>
              </div>
              <div className="size-10 rounded-xl bg-white/10 grid place-items-center group-hover:bg-white/20 transition">
                <it.icon className="size-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
