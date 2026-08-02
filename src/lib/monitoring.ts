import { reportLovableError } from "@/lib/lovable-error-reporting";

let installed = false;

/**
 * Lightweight production error monitoring: forwards uncaught errors and
 * unhandled promise rejections to the platform error pipeline (Sentry-style).
 */
export function installErrorMonitoring() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    reportLovableError(event.error ?? new Error(event.message), {
      source: "window.onerror",
      filename: event.filename,
      line: event.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportLovableError(event.reason, { source: "unhandledrejection" });
  });
}
