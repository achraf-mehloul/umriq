import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/lib/admin-api";
import { LogoMark } from "@/components/Logo";
import { ShieldCheck, LayoutDashboard, Building2, Flag, Ban, LogOut, PackageSearch } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Umriq Admin — Console" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/admin/login", replace: true });
  }, [loading, user, nav]);

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-[oklch(0.14_0.02_260)]">
        <div className="flex flex-col items-center gap-4">
          <LogoMark size={48} />
          <div className="spinner-lux" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin && loc.pathname !== "/admin/login") {
    return (
      <div className="min-h-screen grid place-items-center bg-[oklch(0.14_0.02_260)] px-6 text-center text-white">
        <div className="max-w-md">
          <ShieldCheck className="mx-auto size-12 text-[var(--gold,#d4af37)] mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
          <p className="text-white/70 text-sm mb-6">Your account isn't authorised for the Umriq admin console.</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => nav({ to: "/dashboard" })} className="h-11 rounded-xl bg-white/10 hover:bg-white/20 font-semibold">Back to app</button>
            <button onClick={async () => { await signOut(); nav({ to: "/admin/login" }); }} className="h-11 rounded-xl border border-white/20 font-semibold">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  if (loc.pathname === "/admin/login") return <Outlet />;

  const links = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/kyc", label: "KYC Queue", icon: Building2 },
    { to: "/admin/offers", label: "Offers", icon: PackageSearch },
    { to: "/admin/reports", label: "Reports", icon: Flag },
    { to: "/admin/suspensions", label: "Suspensions", icon: Ban },
  ] as const;

  return (
    <div className="min-h-screen bg-[oklch(0.14_0.02_260)] text-white flex" dir="ltr">
      <aside className="w-64 shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <LogoMark size={32} />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Umriq</p>
            <p className="font-bold">Admin Console</p>
          </div>
        </div>
        <nav className="p-3 flex-1 space-y-1">
          {links.map((l) => {
            const active = l.exact ? loc.pathname === l.to : loc.pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5">
            <LayoutDashboard className="size-4" /> Back to app
          </Link>
          <button onClick={async () => { await signOut(); nav({ to: "/admin/login" }); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <motion.main
        key={loc.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 p-8 overflow-auto"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
