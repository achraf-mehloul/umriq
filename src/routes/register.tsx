import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Building2, Mail, Phone, Lock, Upload } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Umriq — Create Account" }] }),
  component: Register,
});

function Register() {
  const { t, lang, toggle } = useI18n();
  const nav = useNavigate();
  const [type, setType] = useState<"agency" | "rabateur">("agency");

  return (
    <div className="min-h-screen flex flex-col px-6 py-8" style={{ background: "var(--gradient-midnight)" }}>
      <div className="flex items-center justify-between">
        <LogoMark size={32} />
        <button onClick={toggle} className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
          {lang === "ar" ? "EN" : "AR"}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-md w-full mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("register")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("tagline")}</p>

        <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/dashboard" }); }} className="mt-7 space-y-3.5">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--input)] border border-border">
            {(["agency", "rabateur"] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setType(v)}
                className={`h-11 rounded-xl text-sm font-semibold transition ${type === v ? "bg-gold-gradient text-[oklch(0.15_0.02_260)] shadow-gold" : "text-muted-foreground"}`}
              >{t(v)}</button>
            ))}
          </div>

          <Field icon={Building2} placeholder={t("agencyName")} />
          <Field icon={Phone} type="tel" placeholder={t("phone")} />
          <Field icon={Mail} type="email" placeholder={t("email")} />
          <Field icon={Lock} type="password" placeholder={t("password")} />

          <label className="flex items-center gap-3 h-14 rounded-2xl border border-dashed border-border bg-[var(--input)]/50 px-4 cursor-pointer hover:border-primary/40 transition">
            <Upload className="size-5 text-primary" />
            <span className="text-sm text-muted-foreground">{t("commercialRegister")}</span>
          </label>

          <button type="submit" className="w-full h-14 rounded-2xl bg-gold-gradient text-[oklch(0.15_0.02_260)] font-bold shadow-gold active:scale-[0.98] transition mt-2">
            {t("register")}
          </button>
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
      <input {...rest} className="w-full h-14 rounded-2xl bg-[var(--input)] border border-border ps-12 pe-4 text-[15px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition" />
    </div>
  );
}
