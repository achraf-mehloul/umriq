
DROP VIEW IF EXISTS public.agency_trust;
CREATE VIEW public.agency_trust WITH (security_invoker = true) AS
SELECT
  a.id AS agency_id,
  a.rating,
  a.total_deals,
  a.verified,
  COALESCE((SELECT count(*) FROM public.reviews r WHERE r.reviewed_agency_id = a.id), 0) AS review_count,
  COALESCE((SELECT count(*) FROM public.disputes d WHERE (d.buyer_agency_id = a.id OR d.seller_agency_id = a.id) AND d.status IN ('open','investigating')), 0) AS open_disputes,
  LEAST(100, GREATEST(0,
    (CASE WHEN a.verified THEN 30 ELSE 0 END)
    + LEAST(30, COALESCE(a.total_deals,0) * 2)
    + LEAST(30, (COALESCE(a.rating,0)::int * 6))
    - LEAST(30, COALESCE((SELECT count(*) FROM public.disputes d WHERE (d.buyer_agency_id = a.id OR d.seller_agency_id = a.id) AND d.status IN ('open','investigating')),0) * 10)
  ))::int AS trust_score
FROM public.agencies a;
GRANT SELECT ON public.agency_trust TO authenticated, anon;
