-- ============ payment proofs ============
CREATE TYPE public.payment_proof_status AS ENUM ('submitted','accepted','rejected');

CREATE TABLE public.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  buyer_agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  seller_agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  method text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  reference text,
  receipt_url text NOT NULL,
  notes text,
  status public.payment_proof_status NOT NULL DEFAULT 'submitted',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_proofs_booking ON public.payment_proofs(booking_id);
CREATE INDEX idx_payment_proofs_seller ON public.payment_proofs(seller_agency_id);

GRANT SELECT, INSERT, UPDATE ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proofs_select_parties" ON public.payment_proofs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.agencies a WHERE a.id IN (buyer_agency_id, seller_agency_id) AND a.owner_id = auth.uid())
);

CREATE POLICY "proofs_insert_buyer" ON public.payment_proofs FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = buyer_agency_id AND a.owner_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.buyer_agency_id = payment_proofs.buyer_agency_id AND b.seller_agency_id = payment_proofs.seller_agency_id)
);

CREATE POLICY "proofs_update_buyer_pending" ON public.payment_proofs FOR UPDATE TO authenticated
USING (status = 'submitted' AND EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = buyer_agency_id AND a.owner_id = auth.uid()))
WITH CHECK (status = 'submitted');

CREATE POLICY "proofs_update_seller_review" ON public.payment_proofs FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = seller_agency_id AND a.owner_id = auth.uid()))
WITH CHECK (true);

CREATE POLICY "proofs_admin_all" ON public.payment_proofs FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_payment_proofs_updated BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- accepting a proof marks the booking paid + notifies buyer
CREATE OR REPLACE FUNCTION public.handle_payment_proof_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_buyer_owner uuid; v_email text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected') THEN
    NEW.reviewed_at := now();
    NEW.reviewed_by := auth.uid();
    SELECT owner_id INTO v_buyer_owner FROM public.agencies WHERE id = NEW.buyer_agency_id;
    SELECT email INTO v_email FROM public.agency_private WHERE agency_id = NEW.buyer_agency_id;

    IF NEW.status = 'accepted' THEN
      UPDATE public.bookings SET status = 'paid' WHERE id = NEW.booking_id AND status <> 'completed';
      INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
      VALUES (v_buyer_owner, 'system', 'تم تأكيد الدفع', 'Payment confirmed',
              'أكد البائع استلام المبلغ', 'The seller confirmed receiving the payment', '/requests');
      PERFORM public.queue_email(v_email, 'Umriq — تم تأكيد الدفع / Payment confirmed',
        '<p>أكد البائع استلام مبلغ حجزك على Umriq.</p><p>The seller confirmed your payment on Umriq.</p>', 'payment_accepted');
    ELSE
      INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
      VALUES (v_buyer_owner, 'system', 'تم رفض إثبات الدفع', 'Payment proof rejected',
              COALESCE(NEW.rejection_reason,'يرجى إعادة الرفع'), COALESCE(NEW.rejection_reason,'Please re-upload'), '/requests');
      PERFORM public.queue_email(v_email, 'Umriq — إثبات الدفع مرفوض / Payment proof rejected',
        '<p>تم رفض إثبات الدفع: ' || COALESCE(NEW.rejection_reason,'—') || '</p>', 'payment_rejected');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_payment_proof_review BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.handle_payment_proof_review();

-- notify seller on new proof
CREATE OR REPLACE FUNCTION public.notify_seller_payment_proof()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_seller_owner uuid; v_email text;
BEGIN
  SELECT owner_id INTO v_seller_owner FROM public.agencies WHERE id = NEW.seller_agency_id;
  SELECT email INTO v_email FROM public.agency_private WHERE agency_id = NEW.seller_agency_id;
  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  VALUES (v_seller_owner, 'system', 'إيصال دفع جديد', 'New payment receipt',
          'قام المشتري برفع إيصال دفع', 'The buyer uploaded a payment receipt', '/requests');
  PERFORM public.queue_email(v_email, 'Umriq — إيصال دفع جديد / New payment receipt',
    '<p>قام المشتري برفع إيصال دفع، يرجى مراجعته وتأكيد الاستلام.</p><p>A buyer uploaded a payment receipt. Please review and confirm.</p>', 'payment_proof_new');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_seller_proof AFTER INSERT ON public.payment_proofs
FOR EACH ROW EXECUTE FUNCTION public.notify_seller_payment_proof();

-- ============ subscriptions (1 free month) ============
CREATE TYPE public.subscription_status AS ENUM ('trialing','active','expired','cancelled');

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subs_select_own" ON public.subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));

CREATE POLICY "subs_admin_all" ON public.subscriptions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.start_agency_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.subscriptions (agency_id) VALUES (NEW.id) ON CONFLICT (agency_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_start_agency_trial AFTER INSERT ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.start_agency_trial();

INSERT INTO public.subscriptions (agency_id) SELECT id FROM public.agencies ON CONFLICT (agency_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.agency_access_active(_agency_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.agency_id = _agency_id
      AND (
        (s.status = 'trialing' AND s.trial_ends_at > now())
        OR (s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now()))
      )
  );
$$;