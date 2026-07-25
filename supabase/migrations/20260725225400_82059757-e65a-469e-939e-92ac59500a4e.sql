
-- ============ PAYMENT ACCOUNTS ============
CREATE TYPE public.payment_account_type AS ENUM ('baridimob','ccp','edahabia','cib','bank');

CREATE TABLE public.payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  type public.payment_account_type NOT NULL,
  holder_name text NOT NULL,
  account_number text NOT NULL,
  rip text,
  bic text,
  bank_name text,
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_accounts TO authenticated;
GRANT ALL ON public.payment_accounts TO service_role;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages own payment accounts"
ON public.payment_accounts FOR ALL
USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Buyer can see seller payment accounts only when they have a confirmed booking
CREATE POLICY "buyer sees seller accounts on confirmed booking"
ON public.payment_accounts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.bookings b
  JOIN public.agencies a ON a.id = b.buyer_agency_id
  WHERE b.seller_agency_id = payment_accounts.agency_id
    AND a.owner_id = auth.uid()
    AND b.status IN ('confirmed','paid','completed')
));

CREATE TRIGGER payment_accounts_updated BEFORE UPDATE ON public.payment_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ DISPUTES ============
CREATE TYPE public.dispute_status AS ENUM ('open','investigating','resolved','rejected');
CREATE TYPE public.dispute_type AS ENUM ('no_show','payment_issue','misrepresentation','cancellation','other');

CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  buyer_agency_id uuid NOT NULL REFERENCES public.agencies(id),
  seller_agency_id uuid NOT NULL REFERENCES public.agencies(id),
  type public.dispute_type NOT NULL,
  description text NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'open',
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parties view own disputes"
ON public.disputes FOR SELECT
USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.agencies WHERE id IN (buyer_agency_id, seller_agency_id) AND owner_id = auth.uid())
);

CREATE POLICY "buyer or seller opens dispute"
ON public.disputes FOR INSERT
WITH CHECK (
  opened_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.agencies WHERE id IN (buyer_agency_id, seller_agency_id) AND owner_id = auth.uid())
);

CREATE POLICY "admin updates dispute"
ON public.disputes FOR UPDATE
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER disputes_updated BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ DISPUTE MESSAGES ============
CREATE TABLE public.dispute_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.dispute_messages TO authenticated;
GRANT ALL ON public.dispute_messages TO service_role;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parties view dispute messages"
ON public.dispute_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.disputes d
  WHERE d.id = dispute_messages.dispute_id
    AND (
      public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.agencies WHERE id IN (d.buyer_agency_id, d.seller_agency_id) AND owner_id = auth.uid())
    )
));

CREATE POLICY "parties send dispute messages"
ON public.dispute_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_messages.dispute_id
      AND (
        public.has_role(auth.uid(),'admin')
        OR EXISTS (SELECT 1 FROM public.agencies WHERE id IN (d.buyer_agency_id, d.seller_agency_id) AND owner_id = auth.uid())
      )
  )
);

-- ============ SAVED SEARCHES ============
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  origin text,
  destination text,
  max_price numeric,
  min_seats int,
  date_from date,
  date_to date,
  airline text,
  notify boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manages own saved searches"
ON public.saved_searches FOR ALL
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER saved_searches_updated BEFORE UPDATE ON public.saved_searches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PUSH SUBSCRIPTIONS ============
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manages own push subs"
ON public.push_subscriptions FOR ALL
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ TRUST SCORE ============
CREATE OR REPLACE VIEW public.agency_trust AS
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
