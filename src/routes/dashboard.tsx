import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { TrendingUp, Plane, Flame, Inbox, ArrowUpRight, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { offers } from "@/data/mock";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Umriq — Dashboard" }] }),
  component: () => <AppShellWrap />,
});

function AppShellWrap() {
  return (
    <>
      <AppShell />
      <DashboardContent />
    </>
  );
}

// Render content via the AppShell Outlet pattern won't work since dashboard isn't nested.
// Simpler: render directly.

function DashboardContent() {
  return null;
}
