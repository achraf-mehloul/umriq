
-- 1. Private agency table
CREATE TABLE IF NOT EXISTS public.agency_private (
  agency_id uuid PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  email text,
  phone text,
  license_number text,
  commercial_register_url text,
  license_url text,
  kyc_rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_private TO authenticated;
GRANT ALL ON public.agency_private TO service_role;
ALTER TABLE public.agency_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agency_private_owner_admin_all ON public.agency_private;
CREATE POLICY agency_private_owner_admin_all ON public.agency_private
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_agency_private_updated ON public.agency_private;
CREATE TRIGGER trg_agency_private_updated BEFORE UPDATE ON public.agency_private
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Backfill from agencies (only when sensitive columns still exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='agencies' AND column_name='email'
  ) THEN
    INSERT INTO public.agency_private (agency_id, owner_id, email, phone, license_number, commercial_register_url, license_url, kyc_rejection_reason)
    SELECT id, owner_id, email, phone, license_number, commercial_register_url, license_url, kyc_rejection_reason
    FROM public.agencies
    ON CONFLICT (agency_id) DO NOTHING;

    ALTER TABLE public.agencies
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS phone,
      DROP COLUMN IF EXISTS license_number,
      DROP COLUMN IF EXISTS commercial_register_url,
      DROP COLUMN IF EXISTS license_url,
      DROP COLUMN IF EXISTS kyc_rejection_reason;
  END IF;
END $$;

-- 3. Server-side message masking
CREATE OR REPLACE FUNCTION public.mask_message_body() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
DECLARE original text; m text;
BEGIN
  original := NEW.body;
  m := regexp_replace(original, '(\+213|00213|0)[\s-]?[5-7]\d{1,2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}', '••• phone hidden •••', 'g');
  m := regexp_replace(m, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '••• email hidden •••', 'g');
  m := regexp_replace(m, '(wa\.me|t\.me|whatsapp|telegram|viber|imo)\S*', '••• link hidden •••', 'gi');
  NEW.body := m;
  NEW.masked_body := CASE WHEN m <> original THEN 'masked' ELSE NULL END;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_mask_message ON public.messages;
CREATE TRIGGER trg_mask_message BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.mask_message_body();

-- 4. Convert helper functions to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.is_admin(_user uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
  RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.admin_stats() RETURNS json
  LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $function$
DECLARE result json;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT json_build_object(
    'total_agencies', (SELECT count(*) FROM agencies),
    'verified_agencies', (SELECT count(*) FROM agencies WHERE verified),
    'pending_kyc', (SELECT count(*) FROM agencies WHERE NOT verified AND kyc_status = 'pending'),
    'banned_agencies', (SELECT count(*) FROM agencies WHERE banned),
    'total_offers', (SELECT count(*) FROM offers),
    'active_offers', (SELECT count(*) FROM offers WHERE status='active'),
    'total_bookings', (SELECT count(*) FROM bookings),
    'completed_bookings', (SELECT count(*) FROM bookings WHERE status='completed'),
    'total_users', (SELECT count(*) FROM profiles),
    'open_reports', (SELECT count(*) FROM reports WHERE status='open'),
    'gmv', (SELECT COALESCE(sum(total_price),0) FROM bookings WHERE status IN ('completed','paid'))
  ) INTO result;
  RETURN result;
END;
$function$;

-- 5. Lock down execute grants on remaining SECURITY DEFINER trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_agency_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_booking_status_change() FROM PUBLIC, anon, authenticated;
