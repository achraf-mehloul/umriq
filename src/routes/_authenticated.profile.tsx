import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { BadgeCheck, Star, ShieldCheck, Crown, Settings, LogOut, ChevronRight, ImagePlus, Upload, AlertCircle, Bell, Moon, Sun, Type } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useFontScale, type FontScale } from "@/lib/font-scale";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useMyAgency, useCreateAgency, uploadImage } from "@/lib/api";
import { useIsAdmin } from "@/lib/admin-api";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Umriq — Profile" }] }),
  component: Profile,
});

function Profile() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { scale, setScale } = useFontScale();
  const { data: isAdmin } = useIsAdmin();
  const nav = useNavigate();
  const { signOut, user } = useAuth();
  const { data: agency, isLoading } = useMyAgency();

  if (isLoading) return <AppShell><div className="h-96 rounded-3xl skeleton" /></AppShell>;
  if (!agency) return <AppShell><AgencyCreateForm /></AppShell>;

  return (
    <AppShell title={t("profileTitle")}>
      {/* Hero card — calm glass */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="rounded-[28px] glass-strong p-6 mt-2 mb-8"
      >
        <div className="flex items-start gap-4">
          <div className="size-16 rounded-2xl bg-[oklch(0.94_0.014_75)] grid place-items-center text-2xl font-medium text-foreground/70 overflow-hidden shrink-0">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt="" className="size-full object-cover" />
            ) : (
              (lang === "ar" ? agency.name_ar : agency.name_en).charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-[1.5rem] font-medium tracking-tight text-foreground">
                {lang === "ar" ? agency.name_ar : agency.name_en}
              </h2>
              {agency.verified && <VerifiedBadge size={18} />}
            </div>
            <p className="text-[13px] text-muted-foreground mt-1">{lang === "ar" ? agency.city_ar : agency.city_en}</p>
            <div className="mt-3 flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1 text-foreground/70">
                <Star className="size-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                <span className="font-medium">{Number(agency.rating).toFixed(1)}</span>
              </span>
              <span className="text-muted-foreground">
                {agency.total_deals} {lang === "ar" ? "صفقة" : "deals"}
              </span>
              {!agency.verified && (
                <span className="text-[10px] uppercase font-medium tracking-wider px-2 py-0.5 rounded-full bg-[oklch(0.85_0.12_85/0.18)] text-[oklch(0.55_0.12_75)]">
                  {lang === "ar" ? "غير موثق" : "Unverified"}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {!agency.verified && (
        <KycSection agencyId={agency.id} userId={user!.id} hasCR={!!agency.commercial_register_url} hasLic={!!agency.license_url} />
      )}

      {/* Language — minimal segmented */}
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium flex items-center gap-1.5 mt-8 mb-3 px-1">
        <Languages className="size-3.5" /> {t("language")}
      </p>
      <div className="glass rounded-2xl p-1 grid grid-cols-2 gap-1 mb-6">
        {(["ar", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`h-10 rounded-xl text-[13px] font-medium transition-all duration-300 press ${
              lang === l
                ? "bg-[var(--emerald)] text-[var(--primary-foreground)]"
                : "text-foreground/60"
            }`}
          >
            {l === "ar" ? "العربية" : "English"}
          </button>
        ))}
      </div>

      {/* Theme — light / dark */}
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium flex items-center gap-1.5 mb-3 px-1">
        {theme === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />} {t("theme")}
      </p>
      <div className="glass rounded-2xl p-1 grid grid-cols-2 gap-1 mb-8">
        {(["light", "dark"] as const).map((th) => (
          <button
            key={th}
            onClick={() => setTheme(th)}
            className={`h-10 rounded-xl text-[13px] font-medium transition-all duration-300 press flex items-center justify-center gap-2 ${
              theme === th
                ? "bg-[var(--emerald)] text-[var(--primary-foreground)]"
                : "text-foreground/60"
            }`}
          >
            {th === "light" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {th === "light" ? t("themeLight") : t("themeDark")}
          </button>
        ))}
      </div>

      {/* Settings list */}
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium mb-3 px-1">
        {lang === "ar" ? "الإعدادات" : "Settings"}
      </p>
      <div className="rounded-2xl glass overflow-hidden divide-y divide-[oklch(0.22_0.014_200/0.06)]">
        <Link to="/notifications" className="w-full flex items-center gap-3 px-4 h-14 hover:bg-[oklch(1_0_0_/_0.3)] transition press">
          <div className="size-9 rounded-xl bg-[oklch(0.97_0.012_170)] grid place-items-center"><Bell className="size-[16px] text-[var(--emerald)]" strokeWidth={1.7} /></div>
          <span className="flex-1 text-[14px] font-normal text-foreground">{t("notifTitle")}</span>
          <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" strokeWidth={1.7} />
        </Link>
        {[
          { i: Settings, l: lang === "ar" ? "عام" : "General" },
          { i: ShieldCheck, l: lang === "ar" ? "الأمان والخصوصية" : "Security & privacy" },
          { i: Crown, l: t("subscription"), tag: t("premium") },
        ].map((it) => (
          <button key={it.l} className="w-full flex items-center gap-3 px-4 h-14 text-start hover:bg-[oklch(1_0_0_/_0.3)] transition press">
            <div className="size-9 rounded-xl bg-[oklch(0.94_0.014_75)] grid place-items-center"><it.i className="size-[16px] text-foreground/60" strokeWidth={1.7} /></div>
            <span className="flex-1 text-[14px] font-normal text-foreground">{it.l}</span>
            {it.tag && <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--gold)]">{it.tag}</span>}
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" strokeWidth={1.7} />
          </button>
        ))}
      </div>

      <button
        onClick={async () => { await signOut(); nav({ to: "/login", replace: true }); }}
        className="mt-6 w-full h-12 rounded-full glass text-[oklch(0.55_0.18_27)] text-[14px] font-medium flex items-center justify-center gap-2 press"
      >
        <LogOut className="size-4" strokeWidth={1.8} /> {t("logout")}
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
    <div className="rounded-2xl glass p-5 ring-1 ring-[oklch(0.85_0.12_85/0.3)]">
      <div className="flex items-start gap-2.5 mb-4">
        <AlertCircle className="size-[18px] text-[oklch(0.65_0.15_75)] shrink-0 mt-0.5" strokeWidth={1.7} />
        <div>
          <p className="text-[14px] font-medium text-foreground">{lang === "ar" ? "وثّق وكالتك" : "Verify your agency"}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{lang === "ar" ? "ارفع السجل التجاري ورخصة العمرة" : "Upload commercial register & Umrah license"}</p>
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
    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition press ${done ? "bg-[oklch(0.36_0.06_170/0.06)] ring-1 ring-[var(--emerald)]/30" : "bg-[oklch(1_0_0_/_0.5)] hover:bg-[oklch(1_0_0_/_0.8)]"}`}>
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      <div className={`size-9 rounded-lg grid place-items-center ${done ? "bg-[oklch(0.36_0.06_170/0.12)] text-[var(--emerald)]" : "bg-[oklch(0.94_0.014_75)] text-muted-foreground"}`}>
        {done ? <BadgeCheck className="size-[16px]" strokeWidth={1.8} /> : <Upload className="size-[16px]" strokeWidth={1.8} />}
      </div>
      <span className="flex-1 text-[13px] font-medium text-foreground">{label}</span>
      {busy && <span className="text-[12px] text-muted-foreground">...</span>}
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
    <div className="py-6">
      <h1 className="font-display text-[2rem] font-medium tracking-[-0.02em] mb-2">{lang === "ar" ? "أنشئ وكالتك" : "Create your agency"}</h1>
      <p className="text-[14px] text-muted-foreground mb-8">{lang === "ar" ? "أكمل البيانات لتبدأ النشر والتداول" : "Complete your profile to start trading"}</p>

      <div className="space-y-3">
        <label className="block mb-2">
          <div className="size-24 rounded-2xl glass grid place-items-center cursor-pointer overflow-hidden press">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
            {logoUrl ? <img src={logoUrl} alt="" className="size-full object-cover" /> : (uploading ? <span className="text-xs">...</span> : <ImagePlus className="size-5 text-muted-foreground" strokeWidth={1.7} />)}
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-muted-foreground mt-2 block">{lang === "ar" ? "الشعار" : "Logo"}</span>
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
          className="w-full h-14 mt-5 rounded-2xl bg-[var(--emerald)] text-[var(--ivory)] text-[15px] font-medium disabled:opacity-50 press"
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
      <label className="absolute top-2 start-4 text-[10px] uppercase tracking-[0.22em] font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-14 rounded-2xl glass px-4 pt-4 text-[14px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
    </div>
  );
}
