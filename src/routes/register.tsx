import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Building2, Mail, Phone, Lock, Loader2, User as UserIcon, MapPin } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Umriq — Create Account" }] }),
  component: Register,
});

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  agencyName: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

function Register() {
  const { t, lang, toggle } = useI18n();
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard", replace: true });
  }, [loading, user, nav]);

  const [form, setForm] = useState({
    fullName: "",
    agencyName: "",
    city: "",
    phone: "+213",
    email: "",
    password: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(lang === "ar" ? "تحقق من البيانات" : "Check your inputs", {
        description: parsed.error.errors[0]?.message,
      });
      return;
    }
    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          locale: lang,
        },
      },
    });

    if (error) {
      setSubmitting(false);
      toast.error(lang === "ar" ? "فشل التسجيل" : "Sign-up failed", { description: error.message });
      return;
    }
    if (!data.user) {
      setSubmitting(false);
      return;
    }

    // Create the agency owned by this user
    const { data: agency, error: agencyErr } = await supabase
      .from("agencies")
      .insert({
        owner_id: data.user.id,
        name_ar: parsed.data.agencyName,
        name_en: parsed.data.agencyName,
        city_ar: parsed.data.city,
        city_en: parsed.data.city,
      })
      .select("id")
      .single();

    if (agencyErr) {
      setSubmitting(false);
      toast.error(lang === "ar" ? "تعذّر إنشاء الوكالة" : "Couldn't create agency", { description: agencyErr.message });
      return;
    }

    await supabase.from("agency_private").insert({
      agency_id: agency.id,
      owner_id: data.user.id,
      phone: parsed.data.phone,
      email: parsed.data.email,
    });

    await supabase.from("profiles").update({ agency_id: agency.id, full_name: parsed.data.fullName, phone: parsed.data.phone }).eq("id", data.user.id);
    await supabase.from("user_roles").insert({ user_id: data.user.id, role: "agency_owner" });

    setSubmitting(false);
    toast.success(lang === "ar" ? "تم إنشاء الحساب" : "Account created");
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      setSubmitting(false);
      toast.error("Google sign-in failed", { description: result.error.message });
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ background: "var(--gradient-midnight)" }}>
      <div className="flex items-center justify-between">
        <LogoMark size={32} />
        <button onClick={toggle} className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          {lang === "ar" ? "EN" : "AR"}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-md w-full mx-auto pb-10">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("register")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("tagline")}</p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="mt-6 w-full h-13 rounded-2xl bg-white text-[#1f1f1f] font-semibold flex items-center justify-center gap-3 py-3.5 active:scale-[0.98] transition disabled:opacity-60"
        >
          <GoogleIcon />
          {lang === "ar" ? "متابعة عبر Google" : "Continue with Google"}
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground/60">
          <div className="flex-1 h-px bg-border" />
          {lang === "ar" ? "أو سجّل وكالتك" : "or register your agency"}
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field icon={UserIcon} required value={form.fullName} onChange={update("fullName")} placeholder={lang === "ar" ? "الاسم الكامل" : "Full name"} />
          <Field icon={Building2} required value={form.agencyName} onChange={update("agencyName")} placeholder={t("agencyName")} />
          <Field icon={MapPin} required value={form.city} onChange={update("city")} placeholder={lang === "ar" ? "المدينة" : "City"} />
          <Field icon={Phone} type="tel" required value={form.phone} onChange={update("phone")} placeholder="+213 5XX XX XX XX" dir="ltr" />
          <Field icon={Mail} type="email" required value={form.email} onChange={update("email")} placeholder={t("email")} dir="ltr" />
          <Field icon={Lock} type="password" required value={form.password} onChange={update("password")} placeholder={t("password") + " (≥ 8)"} dir="ltr" />

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold active:scale-[0.98] transition mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("register")}
          </button>

          <p className="text-[11px] text-muted-foreground/70 text-center px-2 leading-relaxed">
            {lang === "ar"
              ? "بإنشاء حسابك توافق على شروط الاستخدام وسياسة الخصوصية. سيتم توثيق وكالتك يدوياً بعد رفع السجل التجاري ورخصة العمرة من صفحة الإعدادات."
              : "By creating an account you agree to the Terms of Service. Your agency will be verified manually after you upload your commercial register and Umrah license from Settings."}
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("haveAccount")} <Link to="/login" className="text-primary font-semibold">{t("login")}</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, ...rest }: { icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="absolute top-1/2 -translate-y-1/2 start-4 size-5 text-muted-foreground pointer-events-none" />
      <input {...rest} className="w-full h-13 py-3.5 rounded-2xl bg-[var(--input)] border border-border ps-12 pe-4 text-[15px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
