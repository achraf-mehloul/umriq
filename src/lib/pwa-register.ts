/**
 * Guarded service-worker registration. Only registers in production on the
 * published origin (never in Lovable preview, dev, iframes, or with ?sw=off).
 */
const APP_SW_PATH = "/sw.js";

function isPreviewLikeHost(host: string): boolean {
  return (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

async function unregisterApp() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => r.active?.scriptURL?.endsWith(APP_SW_PATH) || r.scope?.endsWith("/"))
      .map((r) => r.unregister().catch(() => false))
  );
}

export async function registerPwa() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const inIframe = window.self !== window.top;
  const url = new URL(window.location.href);
  const refuse =
    !import.meta.env.PROD ||
    inIframe ||
    isPreviewLikeHost(window.location.hostname) ||
    url.searchParams.get("sw") === "off";

  if (refuse) {
    await unregisterApp();
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch {
    /* plugin not available — skip */
  }
}
