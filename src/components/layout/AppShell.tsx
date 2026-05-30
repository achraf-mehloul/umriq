import { Outlet } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function AppShell({ title }: { title?: string }) {
  return (
    <div className="min-h-screen pb-28">
      <TopBar title={title} />
      <main className="max-w-xl mx-auto px-4 py-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
