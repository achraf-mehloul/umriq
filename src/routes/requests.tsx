import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Inbox, Plane, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Umriq — Requests" }] }),
  component: Requests,
});

const reqs = [
  { ar: "النور للسياحة", en: "An-Nour Tours", cityAr: "وهران", cityEn: "Oran", seats: 8, when: "22 جوان", status: "pending" },
  { ar: "بيت العمرة", en: "Bait Al Umrah", cityAr: "قسنطينة", cityEn: "Constantine", seats: 4, when: "2 جويلية", status: "accepted" },
  { ar: "زمزم للسفر", en: "Zamzam Travel", cityAr: "تلمسان", cityEn: "Tlemcen", seats: 2, when: "5 جويلية", status: "pending" },
];

export default function Requests() {
  const { t, lang } = useI18n();
  return (
    <AppShell title={t("requestsTitle")}>
      <div className="space-y-3">
        {reqs.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card-luxe p-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-gold-gradient/20 ring-1 ring-primary/30 grid place-items-center">
                <Inbox className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{lang === "ar" ? r.ar : r.en}</p>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? r.cityAr : r.cityEn} → مكة</p>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${r.status === "accepted" ? "bg-emerald-400/15 text-emerald-400" : "bg-primary/15 text-primary"}`}>
                {r.status === "accepted" ? (lang === "ar" ? "مقبول" : "Accepted") : (lang === "ar" ? "معلق" : "Pending")}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="size-3.5" /> {r.seats}</span>
              <span className="flex items-center gap-1"><Clock className="size-3.5" /> {r.when}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}
