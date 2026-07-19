import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/lib/admin-api";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Umriq Admin — Sign in" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && isAdmin) nav({ to: "/admin" });
  }, [user, isAdmin, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in — verifying admin access…");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[oklch(0.14_0.02_260)] px-4" dir="ltr">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto size-16 rounded-2xl bg-gradient-to-br from-[var(--gold,#d4af37)] to-amber-600 grid place-items-center mb-4">
            <ShieldCheck className="size-8 text-[oklch(0.15_0.02_260)]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-white/60 text-sm mt-1">Umriq — Restricted access</p>
        </div>
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-white/50 font-bold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:outline-none focus:border-[var(--gold,#d4af37)]"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-widest text-white/50 font-bold">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:outline-none focus:border-[var(--gold,#d4af37)]"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--gold,#d4af37)] to-amber-500 font-bold text-[oklch(0.15_0.02_260)] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </button>
          <p className="text-[11px] text-white/40 text-center pt-2">
            Admin role must be granted in the database. This console is separate from the agency app.
          </p>
        </form>
      </div>
    </div>
  );
}
