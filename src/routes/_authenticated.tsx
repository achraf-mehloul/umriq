import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      nav({ to: "/login", replace: true });
    }
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-midnight">
        <div className="canvas-bg" aria-hidden />
        <div className="relative flex flex-col items-center gap-5">
          <LogoMark size={56} />
          <div className="spinner-lux" />
        </div>
      </div>
    );
  }

  return <Outlet />;
}
