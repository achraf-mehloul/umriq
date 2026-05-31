import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { conversations } from "@/data/mock";
import { motion } from "framer-motion";
import { Search, Send, Paperclip, Mic, ShieldAlert, BadgeCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Umriq — Messages" }] }),
  component: Messages,
});

function Messages() {
  const { t, lang } = useI18n();
  const [active, setActive] = useState<string | null>(null);

  if (active) {
    const c = conversations.find(x => x.id === active)!;
    return <Chat conv={c} onBack={() => setActive(null)} />;
  }

  return (
    <AppShell title={t("messagesTitle")}>
      <div className="relative mb-4">
        <Search className="absolute top-1/2 -translate-y-1/2 start-4 size-4 text-muted-foreground" />
        <input placeholder={t("search")} className="w-full h-12 rounded-2xl bg-[var(--input)] border border-border ps-11 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition" />
      </div>

      <div className="space-y-2">
        {conversations.map((c, i) => (
          <motion.button
            key={c.id}
            onClick={() => setActive(c.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="w-full card-luxe p-3.5 flex items-center gap-3 hover:ring-1 hover:ring-primary/30 transition text-start"
          >
            <div className="relative">
              <div className="size-12 rounded-2xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center font-bold text-primary">
                {(lang === "ar" ? c.nameAr : c.nameEn).charAt(0)}
              </div>
              {c.online && <span className="absolute bottom-0 end-0 size-3 rounded-full bg-emerald-400 ring-2 ring-background" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate">{lang === "ar" ? c.nameAr : c.nameEn}</p>
                <BadgeCheck className="size-3.5 text-primary shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{lang === "ar" ? c.lastAr : c.lastEn}</p>
            </div>
            <div className="text-end shrink-0">
              <p className="text-[10px] text-muted-foreground">{c.time}</p>
              {c.unread > 0 && (
                <span className="inline-grid place-items-center mt-1 min-w-[18px] h-[18px] px-1.5 rounded-full bg-gold-gradient text-[10px] font-bold text-[oklch(0.15_0.02_260)]">
                  {c.unread}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </AppShell>
  );
}

function Chat({ conv, onBack }: { conv: typeof conversations[0]; onBack: () => void }) {
  const { t, lang } = useI18n();
  const messages = [
    { me: false, text: lang === "ar" ? "السلام عليكم، هل المقاعد متوفرة؟" : "Hello, are the seats available?" },
    { me: true, text: lang === "ar" ? "وعليكم السلام، نعم 4 مقاعد متبقية" : "Yes, 4 seats remaining" },
    { me: false, text: lang === "ar" ? "ممتاز، تواصل معي على 0555123456" : "Great, contact me on 0555123456", blocked: true },
    { me: true, text: lang === "ar" ? "أفضل التواصل عبر المنصة" : "Let's keep it on the platform" },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: "var(--gradient-midnight)" }}>
      <header className="sticky top-0 z-40 px-4 py-3 glass-strong border-b border-border/40 flex items-center gap-3">
        <button onClick={onBack} className="size-9 rounded-xl glass grid place-items-center">
          <span className="rtl:rotate-180">←</span>
        </button>
        <div className="relative">
          <div className="size-10 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center font-bold text-primary text-sm">
            {(lang === "ar" ? conv.nameAr : conv.nameEn).charAt(0)}
          </div>
          {conv.online && <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{lang === "ar" ? conv.nameAr : conv.nameEn}</p>
          <p className="text-[11px] text-emerald-400">{conv.online ? t("online") : "—"}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-3 max-w-xl mx-auto w-full">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex ${m.me ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.me
                ? "bg-gold-gradient text-[oklch(0.15_0.02_260)] rounded-br-sm rtl:rounded-br-2xl rtl:rounded-bl-sm font-medium shadow-gold"
                : "glass-strong rounded-bl-sm rtl:rounded-bl-2xl rtl:rounded-br-sm"
            }`}>
              {m.blocked ? (
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-[var(--crimson)]" />
                  <span className="italic blur-[3px] select-none">{m.text}</span>
                </div>
              ) : m.text}
              {m.blocked && <p className="mt-1 text-[10px] not-italic text-[var(--crimson)] font-semibold">⚠ {t("blockedContent")}</p>}
            </div>
          </motion.div>
        ))}
      </main>

      <div className="fixed bottom-0 inset-x-0 safe-bottom px-3 pt-2 pb-3 backdrop-blur-xl bg-[oklch(0.13_0.02_260/0.85)] border-t border-border/40">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          <button className="size-11 rounded-xl glass grid place-items-center shrink-0">
            <Paperclip className="size-4 text-muted-foreground" />
          </button>
          <input placeholder={t("typeMessage")} className="flex-1 h-11 rounded-xl bg-[var(--input)] border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button className="size-11 rounded-xl bg-gold-gradient grid place-items-center shadow-gold shrink-0">
            <Send className="size-4 text-[oklch(0.15_0.02_260)] rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
