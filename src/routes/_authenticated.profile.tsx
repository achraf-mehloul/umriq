import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { BadgeCheck, Star, ShieldCheck, Crown, Settings, LogOut, ChevronRight, ImagePlus, Upload, AlertCircle, Languages, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useMyAgency, useCreateAgency, uploadImage } from "@/lib/api";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Umriq — Profile" }] }),
  component: Profile,
});

function Profile() {
  const { t, lang, setLang } = useI18n();
  const nav = useNavigate();
  const { signOut, user } = useAuth();
  const { data: agency, isLoading } = useMyAgency();

  if (isLoading) return <AppShell><div className="h-96 card-luxe animate-pulse" /></AppShell>;
  if (!agency) return <AppShell><AgencyCreateForm /></AppShell>;

  return (
    <AppShell title={t("profileTitle")}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] mb-6 card-gold-edge"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.22 0.03 265 / 0.7), oklch(0.13 0.02 265 / 0.9))",
          backdropFilter: "blur(32px) saturate(180%)",
          border: "1px solid oklch(1 0 0 / 0.07)",
        }}
      >
        <div className="absolute inset-0 opacity-80" style={{ background: "var(--gradient-aurora)" }} />
        <div className="glow-orb -top-24 -end-24 size-64 opacity-50" />
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <div className="size-20 rounded-2xl ring-2 ring-primary/40 grid place-items-center text-3xl font-extrabold text-gold shadow-gold overflow-hidden glass-gold shrink-0">
              {agency.logo_url ? (
                <img src={agency.logo_url} alt="" className="size-full object-cover" />
              ) : (
                (lang === "ar" ? agency.name_ar : agency.name_en).charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold tracking-tight text-shimmer">
                  {lang === "ar" ? agency.name_ar : agency.name_en}
                </h2>
                {agency.verified ? (
                  <BadgeCheck className="size-5 text-primary" />
                ) : (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                    {lang === "ar" ? "غير موثق" : "Unverified"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{lang === "ar" ? agency.city_ar : agency.city_en}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass">
                  <Star className="size-3.5 fill-primary text-primary" />
                  <span className="font-bold text-xs">{Number(agency.rating).toFixed(1)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {agency.total_deals} {lang === "ar" ? "صفقة" : "deals"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-gold shrink-0">
              <Crown className="size-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("premium")}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {!agency.verified && (
        <KycSection agencyId={agency.id} userId={user!.id} hasCR={!!agency.commercial_register_url} hasLic={!!agency.license_url} />
      )}

      {/* Language switcher — premium segmented */}
      <div className="mt-5 mb-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
          <Languages className="size-3.5" /> {t("language")}
        </span>
      </div>
      <div className="glass-strong rounded-2xl p-1.5 grid grid-cols-2 gap-1 mb-5">
        {(["ar", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`h-11 rounded-xl text-sm font-bold transition-all ${
              lang === l
                ? "bg-gold-gradient text-[oklch(0.13_0.02_265)] shadow-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l === "ar" ? "العربية" : "English"}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl divide-y divide-white/[0.05] overflow-hidden"
        style={{
          background: "linear-gradient(180deg, oklch(0.2 0.024 265 / 0.6), oklch(0.13 0.02 265 / 0.85))",
          backdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid oklch(1 0 0 / 0.06)",
        }}
      >
        <Link to="/notifications" className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.03] transition">
          <div className="size-10 rounded-xl glass grid place-items-center"><Bell className="size-4 text-primary" /></div>
          <span className="flex-1 text-sm font-medium">{t("notifTitle")}</span>
          <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
        </Link>
        {[
          { i: Settings, l: lang === "ar" ? "الإعدادات" : "Settings" },
          { i: ShieldCheck, l: lang === "ar" ? "الأمان والخصوصية" : "Security & privacy" },
          { i: Crown, l: t("subscription"), tag: t("premium") },
        ].map((it) => (
          <button key={it.l} className="w-full flex items-center gap-3 p-4 text-start hover:bg-white/[0.03] transition">
            <div className="size-10 rounded-xl glass grid place-items-center"><it.i className="size-4 text-muted-foreground" /></div>
            <span className="flex-1 text-sm font-medium">{it.l}</span>
            {it.tag && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{it.tag}</span>}
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </button>
        ))}
      </div>

      <button
        onClick={async () => { await signOut(); nav({ to: "/login", replace: true }); }}
        className="mt-5 w-full h-12 rounded-2xl glass text-[var(--crimson)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--crimson)]/10 transition"
      >
        <LogOut className="size-4" /> {t("logout")}
      </button>
    </AppShell>
  );
}

function KycSection({ agencyId, userId, hasCR, hasLic }: { agencyId: string; userId: string; hasCR: boolean; hasLic: boolean }) {
  const { lang } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);

  const upload = async (kind: "cr" | "lic", file: File) => {
    setBusy(kind);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${userId}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("agency-docs").upload(path, file, { upsert: true });
      if (error) throw error;
      const patch = kind === "cr" ? { commercial_register_url: path } : { license_url: path };
      const { error: e2 } = await supabase.from("agencies").update(patch).eq("id", agencyId);
      if (e2) throw e2;
      toast.success(lang === "ar" ? "تم الرفع — بانتظار المراجعة" : "Uploaded — pending review");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card-luxe p-4 ring-1 ring-amber-500/30 bg-amber-500/5">
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold">{lang === "ar" ? "وثق وكالتك" : "Verify your agency"}</p>
          <p className="text-xs text-muted-foreground">{lang === "ar" ? "ارفع السجل التجاري ورخصة العمرة لتفعيل علامة التوثيق" : "Upload commercial register & Umrah license to get verified"}</p>
        </div>
      </div>
      <div className="space-y-2">
        <DocUpload label={lang === "ar" ? "السجل التجاري" : "Commercial Register"} done={hasCR} busy={busy === "cr"} onPick={(f) => upload("cr", f)} />
        <DocUpload label={lang === "ar" ? "رخصة العمرة" : "Umrah License"} done={hasLic} busy={busy === "lic"} onPick={(f) => upload("lic", f)} />
      </div>
    </div>
  );
}

function DocUpload({ label, done, busy, onPick }: { label: string; done: boolean; busy: boolean; onPick: (f: File) => void }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${done ? "border-emerald-400/40 bg-emerald-400/5" : "border-border bg-[var(--input)] hover:border-primary/40"}`}>
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      <div className={`size-9 rounded-lg grid place-items-center ${done ? "bg-emerald-400/20 text-emerald-400" : "bg-card text-muted-foreground"}`}>
        {done ? <BadgeCheck className="size-4" /> : <Upload className="size-4" />}
      </div>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {busy && <span className="text-xs">...</span>}
    </label>
  );
}

function AgencyCreateForm() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const create = useCreateAgency();
  const [f, setF] = useState({ name_ar: "", name_en: "", city_ar: "", city_en: "", phone: "", license_number: "" });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadImage("agency-logos", file, user.id);
      setLogoUrl(url);
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  return (
    <div className="py-4">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">{lang === "ar" ? "أنشئ وكالتك" : "Create your agency"}</h1>
      <p className="text-sm text-muted-foreground mb-6">{lang === "ar" ? "أكمل البيانات لتبدأ النشر والتداول" : "Complete your profile to start trading"}</p>

      <div className="space-y-3">
        <label className="block">
          <div className="size-24 rounded-2xl bg-[var(--input)] border-2 border-dashed border-border grid place-items-center cursor-pointer overflow-hidden hover:border-primary/40 transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
            {logoUrl ? <img src={logoUrl} alt="" className="size-full object-cover" /> : (uploading ? <span className="text-xs">...</span> : <ImagePlus className="size-6 text-muted-foreground" />)}
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-2 block">{lang === "ar" ? "الشعار" : "Logo"}</span>
        </label>

        <Inp label={lang === "ar" ? "اسم الوكالة (عربي)" : "Agency name (AR)"} value={f.name_ar} onChange={(v) => setF({ ...f, name_ar: v })} />
        <Inp label={lang === "ar" ? "اسم الوكالة (إنجليزي)" : "Agency name (EN)"} value={f.name_en} onChange={(v) => setF({ ...f, name_en: v })} />
        <Inp label={lang === "ar" ? "المدينة (عربي)" : "City (AR)"} value={f.city_ar} onChange={(v) => setF({ ...f, city_ar: v })} />
        <Inp label={lang === "ar" ? "المدينة (إنجليزي)" : "City (EN)"} value={f.city_en} onChange={(v) => setF({ ...f, city_en: v })} />
        <Inp label={lang === "ar" ? "رقم الهاتف" : "Phone"} value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
        <Inp label={lang === "ar" ? "رقم السجل التجاري" : "Commercial register #"} value={f.license_number} onChange={(v) => setF({ ...f, license_number: v })} />

        <button
          onClick={() => create.mutate({ ...f, logo_url: logoUrl })}
          disabled={!f.name_ar || !f.name_en || !f.city_ar || create.isPending}
          className="w-full h-14 mt-4 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold disabled:opacity-50"
        >
          {create.isPending ? "..." : (lang === "ar" ? "إنشاء الوكالة" : "Create agency")}
        </button>
      </div>
    </div>
  );
}

function Inp({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <label className="absolute top-2 start-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-14 rounded-2xl bg-[var(--input)] border border-border px-4 pt-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );
}
