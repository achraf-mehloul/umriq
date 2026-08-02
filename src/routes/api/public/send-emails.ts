import { createFileRoute } from "@tanstack/react-router";

/**
 * Flushes the transactional email queue (booking requests, booking status
 * changes, KYC approvals). Call it from a scheduler with:
 *   POST /api/public/send-emails  with header  x-cron-secret: <CRON_SECRET>
 * Requires the RESEND_API_KEY and CRON_SECRET secrets.
 */
export const Route = createFileRoute("/api/public/send-emails")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env["CRON_SECRET"];
        const provided = request.headers.get("x-cron-secret");
        if (!cronSecret || provided !== cronSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const resendKey = process.env["RESEND_API_KEY"];
        if (!resendKey) {
          return Response.json({ ok: false, error: "RESEND_API_KEY not configured" }, { status: 503 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: pending, error } = await supabaseAdmin
          .from("email_outbox" as never)
          .select("*")
          .eq("status", "pending")
          .lt("attempts", 5)
          .order("created_at")
          .limit(50);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const rows = (pending ?? []) as unknown as {
          id: string;
          to_email: string;
          subject: string;
          body_html: string;
          attempts: number;
        }[];

        let sent = 0;
        for (const row of rows) {
          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: process.env["EMAIL_FROM"] ?? "Umriq <onboarding@resend.dev>",
                to: [row.to_email],
                subject: row.subject,
                html: row.body_html,
              }),
            });
            if (!res.ok) throw new Error(await res.text());
            await supabaseAdmin
              .from("email_outbox" as never)
              .update({ status: "sent", sent_at: new Date().toISOString(), attempts: row.attempts + 1 } as never)
              .eq("id", row.id);
            sent++;
          } catch (e) {
            await supabaseAdmin
              .from("email_outbox" as never)
              .update({
                attempts: row.attempts + 1,
                last_error: (e as Error).message.slice(0, 500),
                status: row.attempts + 1 >= 5 ? "failed" : "pending",
              } as never)
              .eq("id", row.id);
          }
        }

        return Response.json({ ok: true, queued: rows.length, sent });
      },
    },
  },
});
