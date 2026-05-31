import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Mail, Lock, Phone, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Umriq — Sign In" }] }),
  component: Login,
});

type Tab = "email" | "phone";

function Login() {
  const { t, lang, toggle } = useI18n();
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("email");
  const [submitting, setSubmitting] = useState(false);

  // Redirect once authenticated
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard", replace: true });
  }, [loading, user, nav]);

  // Email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP
  const [phone, setPhone] = useState("+213");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(lang === "ar" ? "خطأ في تسجيل الدخول" : "Sign-in failed", { description: error.message });
      return;
    }
    toast.success(lang === "ar" ? "مرحباً بعودتك" : "Welcome back");
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      setSubmitting(false);
      toast.error(lang === "ar" ? "تعذّر الدخول عبر Google" : "Google sign-in failed", { description: result.error.message });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setSubmitting(false);
    if (error) {
      toast.error(lang === "ar" ? "تعذّر إرسال الرمز" : "Couldn't send code", {
        description: error.message + (error.message.includes("not configured") ? " — Configure Twilio in Backend → Auth." : ""),
      });
      return;
    }
    setOtpSent(true);
    toast.success(lang === "ar" ? "تم إرسال الرمز" : "Code sent");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setSubmitting(false);
    if (error) {
      toast.error(lang === "ar" ? "رمز غير صحيح" : "Invalid code");
      return;
    }
    toast.success(lang === "ar" ? "مرحباً" : "Welcome");
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-10" style={{ background: "var(--gradient-midnight)" }}>
      <div className="flex items-center justify-between">
        <LogoMark size={34} />
        <button onClick={toggle} className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          {lang === "ar" ? "EN" : "AR"}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto"
      >
        <h1 className="text-4xl font-extrabold tracking-tight">{t("login")}</h1>
        <p className="mt-2 text-muted-foreground">{t("tagline")}</p>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="mt-8 w-full h-14 rounded-2xl bg-white text-[#1f1f1f] font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition disabled:opacity-60"
        >
          <GoogleIcon />
          {lang === "ar" ? "متابعة عبر Google" : "Continue with Google"}
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground/60">
          <div className="flex-1 h-px bg-border" />
          {lang === "ar" ? "أو" : "or"}
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[var(--input)] border border-border mb-4">
          {(["email", "phone"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setTab(v); setOtpSent(false); }}
              className={`h-10 rounded-xl text-sm font-semibold transition ${tab === v ? "bg-gold-gradient text-[oklch(0.15_0.02_260)] shadow-gold" : "text-muted-foreground"}`}
            >
              {v === "email" ? (lang === "ar" ? "بالبريد" : "Email") : (lang === "ar" ? "بالهاتف" : "Phone")}
            </button>
          ))}
        </div>

        {tab === "email" ? (
          <form onSubmit={handleEmail} className="space-y-3.5">
            <Field icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} />
            <Field icon={Lock} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")} />

            <SubmitBtn submitting={submitting}>{t("login")}</SubmitBtn>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <Field icon={Phone} type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+213 5XX XX XX XX" dir="ltr" />
            <SubmitBtn submitting={submitting}>{lang === "ar" ? "إرسال رمز التحقق" : "Send code"}</SubmitBtn>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <p className="text-sm text-muted-foreground text-center">
              {lang === "ar" ? `تم إرسال رمز إلى ${phone}` : `Code sent to ${phone}`}
            </p>
            <input
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="• • • • • •"
              className="w-full h-16 rounded-2xl bg-[var(--input)] border border-border text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
              dir="ltr"
              maxLength={6}
            />
            <SubmitBtn submitting={submitting}>{lang === "ar" ? "تأكيد" : "Verify"}</SubmitBtn>
            <button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs text-muted-foreground">
              {lang === "ar" ? "تغيير الرقم" : "Change number"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link to="/register" className="text-primary font-semibold">{t("register")}</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, ...rest }: { icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="absolute top-1/2 -translate-y-1/2 start-4 size-5 text-muted-foreground pointer-events-none" />
      <input
        {...rest}
        className="w-full h-14 rounded-2xl bg-[var(--input)] border border-border ps-12 pe-4 text-[15px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition"
      />
    </div>
  );
}

function SubmitBtn({ submitting, children }: { submitting: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="w-full h-14 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {submitting && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
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
