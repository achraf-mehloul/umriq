import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Search, Send, ShieldAlert, BadgeCheck, ArrowLeft, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useConversations, useMessages, useSendMessage, useMyAgency } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useHydrateQuery, usePersistQuery } from "@/lib/offline";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Umriq — Messages" }] }),
  validateSearch: (s) => ({ c: typeof s.c === "string" ? s.c : undefined }),
  component: Messages,
});

function Messages() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const { data: agency } = useMyAgency();
  const { data: convs = [], isLoading } = useConversations();
  useHydrateQuery("conversations", ["conversations", agency?.id]);
  usePersistQuery("conversations", ["conversations", agency?.id]);
  const active = search.c;

  if (active) {
    const conv = convs.find((c) => c.id === active);
    return <Chat conversationId={active} title={conv ? (lang === "ar" ? (conv.agency_a?.name_ar ?? conv.agency_b?.name_ar ?? "—") : (conv.agency_a?.name_en ?? conv.agency_b?.name_en ?? "—")) : "—"} onBack={() => nav({ to: "/messages", search: {} as never })} />;
  }

  return (
    <AppShell title={t("messagesTitle")}>
      <div className="relative mb-4">
        <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-4 text-muted-foreground" />
        <input placeholder={t("search")} className="w-full h-12 rounded-2xl bg-[var(--input)] border border-border ps-11 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition" />
      </div>

      <div className="space-y-2">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 card-luxe animate-pulse" />)}
        {!isLoading && convs.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
          </div>
        )}
        {convs.map((c, i) => {
          const other = c.agency_a ?? c.agency_b;
          const name = other ? (lang === "ar" ? other.name_ar : other.name_en) : "—";
          return (
            <motion.button
              key={c.id}
              onClick={() => nav({ search: { c: c.id } })}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="w-full card-luxe p-3.5 flex items-center gap-3 hover:ring-1 hover:ring-primary/30 transition text-start"
            >
              <div className="size-12 rounded-2xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center font-bold text-primary overflow-hidden">
                {other?.logo_url ? <img src={other.logo_url} alt="" className="size-full object-cover" /> : name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm truncate">{name}</p>
                  {other?.verified && <BadgeCheck className="size-3.5 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{new Date(c.last_message_at).toLocaleString(lang === "ar" ? "ar-DZ" : "en-GB", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </AppShell>
  );
}

function Chat({ conversationId, title, onBack }: { conversationId: string; title: string; onBack: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data: messages = [] } = useMessages(conversationId);
  const send = useSendMessage();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    await send.mutateAsync({ conversationId, body });
  };

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: "var(--gradient-midnight)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 glass-strong border-b border-border/40 flex items-center gap-3">
        <button onClick={onBack} className="size-9 rounded-xl glass grid place-items-center">
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </button>
        <div className="size-10 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center font-bold text-primary text-sm">
          {title.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{title}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-3 max-w-xl mx-auto w-full">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-12">{lang === "ar" ? "ابدأ المحادثة" : "Start the conversation"}</p>
        )}
        {messages.map((m) => {
          const me = m.sender_id === user?.id;
          const displayed = m.body;
          const blocked = !!m.masked_body;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                me
                  ? "bg-gold-gradient text-[oklch(0.15_0.02_260)] rounded-br-sm rtl:rounded-br-2xl rtl:rounded-bl-sm font-medium shadow-gold"
                  : "glass-strong rounded-bl-sm rtl:rounded-bl-2xl rtl:rounded-br-sm"
              }`}>
                {blocked ? (
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="size-4 text-[var(--crimson)] shrink-0 mt-0.5" />
                    <div>
                      <span>{displayed}</span>
                      <p className="mt-1 text-[10px] text-[var(--crimson)] font-semibold">⚠ {t("blockedContent")}</p>
                    </div>
                  </div>
                ) : displayed}
              </div>
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </main>

      <div className="fixed bottom-0 inset-x-0 safe-bottom px-3 pt-2 pb-3 backdrop-blur-xl bg-[oklch(0.13_0.02_260/0.85)] border-t border-border/40">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
            placeholder={t("typeMessage")}
            className="flex-1 h-11 rounded-xl bg-[var(--input)] border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button onClick={onSend} disabled={!text.trim() || send.isPending} className="size-11 rounded-xl bg-gold-gradient grid place-items-center shadow-gold shrink-0 disabled:opacity-50">
            <Send className="size-4 text-[oklch(0.15_0.02_260)] rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
