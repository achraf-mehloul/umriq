-- 1. Visa product details extensions
ALTER TABLE public.listing_visa_details
  ADD COLUMN IF NOT EXISTS pilgrimage_type text NOT NULL DEFAULT 'umrah',
  ADD COLUMN IF NOT EXISTS nationality_ar text,
  ADD COLUMN IF NOT EXISTS nationality_en text,
  ADD COLUMN IF NOT EXISTS required_documents text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_applicants integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS provider_note_ar text,
  ADD COLUMN IF NOT EXISTS provider_note_en text;

ALTER TABLE public.listing_visa_details
  DROP CONSTRAINT IF EXISTS listing_visa_details_pilgrimage_type_check;
ALTER TABLE public.listing_visa_details
  ADD CONSTRAINT listing_visa_details_pilgrimage_type_check
  CHECK (pilgrimage_type IN ('umrah','hajj','other'));

-- 2. Application status enum
DO $$ BEGIN
  CREATE TYPE public.visa_application_status AS ENUM
    ('submitted','under_review','documents_required','approved','issued','rejected','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Applications
CREATE TABLE IF NOT EXISTS public.visa_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id),
  unit_id uuid NOT NULL REFERENCES public.inventory_units(id),
  hold_id uuid REFERENCES public.inventory_holds(id),
  buyer_agency_id uuid NOT NULL REFERENCES public.agencies(id),
  seller_agency_id uuid NOT NULL REFERENCES public.agencies(id),
  booking_id uuid REFERENCES public.bookings(id),
  hotel_booking_id uuid REFERENCES public.hotel_bookings(id),
  pilgrimage_type text NOT NULL DEFAULT 'umrah',
  visa_type text NOT NULL,
  entry_type text,
  nationality text,
  processing_days integer,
  applicants integer NOT NULL CHECK (applicants > 0),
  applicant_names text[] NOT NULL DEFAULT '{}',
  price_per_applicant numeric NOT NULL,
  total_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'DZD',
  required_documents text[] NOT NULL DEFAULT '{}',
  status public.visa_application_status NOT NULL DEFAULT 'submitted',
  notes text,
  review_note text,
  rejection_reason text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.visa_applications TO authenticated;
GRANT ALL ON public.visa_applications TO service_role;
ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visa_apps_parties_select" ON public.visa_applications
FOR SELECT TO authenticated
USING (
  public.is_agency_member(buyer_agency_id)
  OR public.is_agency_member(seller_agency_id)
  OR public.is_admin(auth.uid())
);

CREATE INDEX IF NOT EXISTS visa_applications_buyer_idx ON public.visa_applications(buyer_agency_id);
CREATE INDEX IF NOT EXISTS visa_applications_seller_idx ON public.visa_applications(seller_agency_id);

CREATE TRIGGER visa_applications_updated_at BEFORE UPDATE ON public.visa_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Access helpers (used by table + storage policies)
CREATE OR REPLACE FUNCTION public.can_access_visa_application(_app_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.visa_applications a
    WHERE a.id = _app_id
      AND (
        public.is_agency_member(a.buyer_agency_id)
        OR public.is_agency_member(a.seller_agency_id)
        OR public.is_admin(auth.uid())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_visa_application_buyer(_app_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.visa_applications a
    WHERE a.id = _app_id AND public.is_agency_member(a.buyer_agency_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_visa_application_reviewer(_app_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.visa_applications a
    WHERE a.id = _app_id
      AND (public.is_agency_member(a.seller_agency_id) OR public.is_admin(auth.uid()))
  );
$$;

-- 5. Private documents
CREATE TABLE IF NOT EXISTS public.visa_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  applicant_label text,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  status text NOT NULL DEFAULT 'pending',
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visa_doc_status_check CHECK (status IN ('pending','accepted','rejected'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_application_documents TO authenticated;
GRANT ALL ON public.visa_application_documents TO service_role;
ALTER TABLE public.visa_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visa_docs_parties_select" ON public.visa_application_documents
FOR SELECT TO authenticated USING (public.can_access_visa_application(application_id));

CREATE POLICY "visa_docs_buyer_insert" ON public.visa_application_documents
FOR INSERT TO authenticated
WITH CHECK (public.is_visa_application_buyer(application_id) AND uploaded_by = auth.uid());

CREATE POLICY "visa_docs_reviewer_update" ON public.visa_application_documents
FOR UPDATE TO authenticated
USING (public.is_visa_application_reviewer(application_id))
WITH CHECK (public.is_visa_application_reviewer(application_id));

CREATE POLICY "visa_docs_buyer_delete" ON public.visa_application_documents
FOR DELETE TO authenticated
USING (
  public.is_visa_application_buyer(application_id)
  AND EXISTS (
    SELECT 1 FROM public.visa_applications a
    WHERE a.id = application_id
      AND a.status IN ('submitted','documents_required')
  )
);

CREATE TRIGGER visa_application_documents_updated_at BEFORE UPDATE ON public.visa_application_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Private storage policies for the visa-documents bucket
CREATE POLICY "visa_docs_storage_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'visa-documents'
  AND public.can_access_visa_application(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "visa_docs_storage_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'visa-documents'
  AND public.is_visa_application_buyer(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "visa_docs_storage_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'visa-documents'
  AND public.is_visa_application_buyer(((storage.foldername(name))[1])::uuid)
);

-- 7. Submit application (atomic inventory hold)
CREATE OR REPLACE FUNCTION public.submit_visa_application(
  _unit_id uuid,
  _applicants integer,
  _pilgrimage_type text DEFAULT 'umrah',
  _applicant_names text[] DEFAULT '{}',
  _nationality text DEFAULT NULL,
  _notes text DEFAULT NULL,
  _booking_id uuid DEFAULT NULL,
  _hotel_booking_id uuid DEFAULT NULL,
  _hold_minutes integer DEFAULT 180
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _u public.inventory_units%ROWTYPE;
  _l public.listings%ROWTYPE;
  _d public.listing_visa_details%ROWTYPE;
  _buyer uuid; _hold uuid; _app uuid; _price numeric;
BEGIN
  SELECT * INTO _u FROM public.inventory_units WHERE id = _unit_id;
  IF _u.id IS NULL THEN RAISE EXCEPTION 'inventory unit not found'; END IF;

  SELECT * INTO _l FROM public.listings WHERE id = _u.listing_id;
  IF _l.product_type <> 'visa' THEN RAISE EXCEPTION 'not a visa listing'; END IF;
  IF _l.status <> 'active' THEN RAISE EXCEPTION 'listing is not active'; END IF;

  SELECT * INTO _d FROM public.listing_visa_details WHERE listing_id = _l.id;
  IF _d.listing_id IS NULL THEN RAISE EXCEPTION 'visa details missing'; END IF;

  SELECT agency_id INTO _buyer FROM public.profiles WHERE id = auth.uid();
  IF _buyer IS NULL THEN RAISE EXCEPTION 'no buyer agency'; END IF;
  IF _buyer = _l.agency_id THEN RAISE EXCEPTION 'cannot apply to your own listing'; END IF;
  IF _applicants < 1 OR _applicants > _d.max_applicants THEN RAISE EXCEPTION 'invalid applicants count'; END IF;

  IF _booking_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = _booking_id AND b.buyer_agency_id = _buyer
  ) THEN RAISE EXCEPTION 'linked booking not yours'; END IF;

  IF _hotel_booking_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.hotel_bookings h WHERE h.id = _hotel_booking_id AND h.buyer_agency_id = _buyer
  ) THEN RAISE EXCEPTION 'linked hotel booking not yours'; END IF;

  _hold := public.reserve_inventory(_unit_id, _applicants, _buyer, NULL, _hold_minutes);
  _price := COALESCE(_u.unit_price, _l.price);

  INSERT INTO public.visa_applications (
    listing_id, unit_id, hold_id, buyer_agency_id, seller_agency_id,
    booking_id, hotel_booking_id, pilgrimage_type, visa_type, entry_type,
    nationality, processing_days, applicants, applicant_names,
    price_per_applicant, total_price, currency, required_documents, notes
  ) VALUES (
    _l.id, _unit_id, _hold, _buyer, _l.agency_id,
    _booking_id, _hotel_booking_id, COALESCE(_pilgrimage_type, _d.pilgrimage_type), _d.visa_type, _d.entry_type,
    COALESCE(_nationality, _d.nationality_en), _d.processing_days, _applicants, COALESCE(_applicant_names, '{}'),
    _price, _price * _applicants, _l.currency, _d.required_documents, _notes
  ) RETURNING id INTO _app;

  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  SELECT a.owner_id, 'deal', 'طلب تأشيرة جديد', 'New visa application',
         _d.visa_type, _d.visa_type, '/visa-applications'
  FROM public.agencies a WHERE a.id = _l.agency_id;

  RETURN _app;
END $$;

-- 8. Status transitions (seller / admin)
CREATE OR REPLACE FUNCTION public.set_visa_application_status(
  _application_id uuid,
  _status public.visa_application_status,
  _note text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _a public.visa_applications%ROWTYPE; _h public.inventory_holds%ROWTYPE;
BEGIN
  SELECT * INTO _a FROM public.visa_applications WHERE id = _application_id FOR UPDATE;
  IF _a.id IS NULL THEN RAISE EXCEPTION 'application not found'; END IF;
  IF NOT (public.is_agency_member(_a.seller_agency_id) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _a.status IN ('cancelled','rejected') THEN RAISE EXCEPTION 'application is closed'; END IF;

  IF _status IN ('approved','issued') AND _a.hold_id IS NOT NULL THEN
    SELECT * INTO _h FROM public.inventory_holds WHERE id = _a.hold_id;
    IF _h.status = 'active' THEN PERFORM public.confirm_inventory_hold(_a.hold_id); END IF;
  END IF;

  IF _status = 'rejected' AND _a.hold_id IS NOT NULL THEN
    SELECT * INTO _h FROM public.inventory_holds WHERE id = _a.hold_id FOR UPDATE;
    IF _h.status = 'active' THEN
      UPDATE public.inventory_holds SET status = 'released' WHERE id = _h.id;
    ELSIF _h.status = 'confirmed' THEN
      PERFORM 1 FROM public.inventory_units WHERE id = _a.unit_id FOR UPDATE;
      UPDATE public.inventory_units SET quantity_sold = GREATEST(0, quantity_sold - _a.applicants)
        WHERE id = _a.unit_id;
      UPDATE public.inventory_holds SET status = 'released' WHERE id = _h.id;
    END IF;
  END IF;

  UPDATE public.visa_applications
    SET status = _status,
        review_note = COALESCE(_note, review_note),
        rejection_reason = CASE WHEN _status = 'rejected' THEN _note ELSE rejection_reason END,
        decided_at = CASE WHEN _status IN ('approved','issued','rejected') THEN now() ELSE decided_at END
    WHERE id = _application_id;

  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  SELECT a.owner_id, 'deal', 'تحديث طلب التأشيرة', 'Visa application update',
         _status::text, _status::text, '/visa-applications'
  FROM public.agencies a WHERE a.id = _a.buyer_agency_id;
END $$;

-- 9. Cancel (buyer / seller / admin)
CREATE OR REPLACE FUNCTION public.cancel_visa_application(_application_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _a public.visa_applications%ROWTYPE; _h public.inventory_holds%ROWTYPE;
BEGIN
  SELECT * INTO _a FROM public.visa_applications WHERE id = _application_id FOR UPDATE;
  IF _a.id IS NULL THEN RAISE EXCEPTION 'application not found'; END IF;
  IF NOT (
    public.is_agency_member(_a.buyer_agency_id)
    OR public.is_agency_member(_a.seller_agency_id)
    OR public.is_admin(auth.uid())
  ) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _a.status IN ('cancelled','issued') THEN RETURN; END IF;

  IF _a.hold_id IS NOT NULL THEN
    SELECT * INTO _h FROM public.inventory_holds WHERE id = _a.hold_id FOR UPDATE;
    IF _h.status = 'active' THEN
      UPDATE public.inventory_holds SET status = 'released' WHERE id = _h.id;
    ELSIF _h.status = 'confirmed' THEN
      PERFORM 1 FROM public.inventory_units WHERE id = _a.unit_id FOR UPDATE;
      UPDATE public.inventory_units SET quantity_sold = GREATEST(0, quantity_sold - _a.applicants)
        WHERE id = _a.unit_id;
      UPDATE public.inventory_holds SET status = 'released' WHERE id = _h.id;
    END IF;
  END IF;

  UPDATE public.visa_applications
    SET status = 'cancelled', rejection_reason = COALESCE(_reason, rejection_reason), decided_at = now()
    WHERE id = _application_id;
END $$;

-- 10. Document review (seller / admin)
CREATE OR REPLACE FUNCTION public.review_visa_document(_document_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app uuid;
BEGIN
  IF _status NOT IN ('pending','accepted','rejected') THEN RAISE EXCEPTION 'invalid status'; END IF;
  SELECT application_id INTO _app FROM public.visa_application_documents WHERE id = _document_id;
  IF _app IS NULL THEN RAISE EXCEPTION 'document not found'; END IF;
  IF NOT public.is_visa_application_reviewer(_app) THEN RAISE EXCEPTION 'not authorized'; END IF;
  UPDATE public.visa_application_documents
    SET status = _status, review_note = COALESCE(_note, review_note) WHERE id = _document_id;
END $$;