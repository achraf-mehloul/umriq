import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n";
import { useAgency, useAgencyReviews } from "@/lib/api";
import { ArrowLeft, BadgeCheck, Star, Phone, Mail, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agency/$id")({
  head: () => ({ meta: [{ title: "Umriq — Agency" }] }),
  component: AgencyPage,
  errorComponent: ({ error }) => <AppShell><div className="text-center py-20 text-muted-foreground">{error.message}</div></AppShell>,
  notFoundComponent: () => <AppShell><div className="text-center py-20">Agency not found</div></AppShell>,
});

function AgencyPage() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const nav = useNavigate();
  const { data: a, isLoading } = useAgency(id);
  const { data: reviews = [] } = useAgencyReviews(id);

  if (isLoading || !a) return <AppShell><div className="h-96 animate-pulse card-luxe" /></AppShell>;
  const name = lang === "ar" ? a.name_ar : a.name_en;
  const city = lang === "ar" ? a.city_ar : a.city_en;

  return (
    <AppShell>
      <button onClick={() => nav({ to: "/market" })} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {lang === "ar" ? "رجوع" : "Back"}
      </button>
      <div className="card-luxe overflow-hidden">
        <div className="h-28 bg-gold-gradient" />
        <div className="px-5 pb-5 -mt-12 relative">
          <div className="size-24 rounded-3xl bg-card ring-4 ring-card grid place-items-center text-3xl font-extrabold text-gold overflow-hidden">
            {a.logo_url ? <img src={a.logo_url} alt="" className="size-full object-cover" /> : name.charAt(0)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight">{name}</h2>
            {a.verified && <BadgeCheck className="size-5 text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="size-3" /> {city}</p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><Star className="size-3 fill-primary text-primary" /> {Number(a.rating).toFixed(1)} ({reviews.length})</span>
            <span className="text-muted-foreground">{a.total_deals} {lang === "ar" ? "صفقة" : "deals"}</span>
          </div>
          {(a.bio_ar || a.bio_en) && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{lang === "ar" ? a.bio_ar : a.bio_en}</p>}
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3">{lang === "ar" ? "التقييمات" : "Reviews"}</h3>
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="card-luxe p-3">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
