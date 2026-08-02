import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ThemeProvider } from "@/lib/theme";
import { FontScaleProvider } from "@/lib/font-scale";
import { registerPwa } from "@/lib/pwa-register";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-[oklch(0.15_0.02_260)] shadow-gold">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or go home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-[oklch(0.15_0.02_260)] shadow-gold"
          >Try again</button>
          <a href="/" className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0e1a" },
      { title: "Umriq — سوق مقاعد العمرة" },
      { name: "description", content: "Umriq — منصة B2B احترافية لتبادل وحجز مقاعد رحلات العمرة بين الوكالات والرباطورة في الجزائر." },
      { property: "og:title", content: "Umriq — سوق مقاعد العمرة" },
      { property: "og:description", content: "Umriq — منصة B2B احترافية لتبادل وحجز مقاعد رحلات العمرة بين الوكالات والرباطورة في الجزائر." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/images/umriq-og.png" },
      { property: "og:image:width", content: "1536" },
      { property: "og:image:height", content: "1024" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Umriq — سوق مقاعد العمرة" },
      { name: "twitter:image", content: "/images/umriq-og.png" },
      { name: "twitter:description", content: "Umriq — منصة B2B احترافية لتبادل وحجز مقاعد رحلات العمرة بين الوكالات والرباطورة في الجزائر." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/images/umriq-og.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthCacheBridge() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { void registerPwa(); installErrorMonitoring(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontScaleProvider>
          <I18nProvider>
            <AuthProvider>
              <AuthCacheBridge />
              <Outlet />
              <InstallPrompt />
              <OnboardingTour />
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </I18nProvider>
        </FontScaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
