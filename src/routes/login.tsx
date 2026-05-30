import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Mail, Lock, Fingerprint } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Umriq — Sign In" }] }),
  component: Login,
});

function Login() {
  const { t, lang, toggle } = useI18n();
  const nav = useNavigate();

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
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto"
      >
        <h1 className="text-4xl font-extrabold tracking-tight">{t("login")}</h1>
        <p className="mt-2 text-muted-foreground">{t("tagline")}</p>

        <form
          onSubmit={(e) => { e.preventDefault(); nav({ to: "/dashboard" }); }}
          className="mt-10 space-y-4"
        >
          <Field icon={Mail} type="email" placeholder={t("email")} />
          <Field icon={Lock} type="password" placeholder={t("password")} />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" />
              {t("rememberMe")}
            </label>
            <button type="button" className="text-primary font-medium">{t("forgotPassword")}</button>
          </div>

          <button
            type="submit"
            className="w-full h-14 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold active:scale-[0.98] transition"
          >
            {t("login")}
          </button>

          <button type="button" className="w-full h-14 rounded-2xl glass border border-border flex items-center justify-center gap-3 active:scale-[0.98] transition">
            <Fingerprint className="size-5 text-primary" />
            <span className="text-sm font-medium">Biometric</span>
          </button>
        </form>

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
