-- ============ Prompt 02: marketplace core, suppliers, inventory ============

-- 1. Supplier capability on agencies
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS is_supplier boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_buyer boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supplier_types text[] NOT NULL DEFAULT '{}'::text[];

-- 2. Enums
DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM ('flight_seat','hotel_room','visa','package');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('draft','active','paused','sold_out','expired','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hold_status AS ENUM ('active','confirmed','released','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Membership helper (security definer, avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_agency_member(_agency_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agencies a WHERE a.id = _agency_id AND a.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.agency_id = _agency_id
  );
$$;
REVOKE ALL ON FUNCTION public.is_agency_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_agency_member(uuid) TO authenticated, service_role;

-- 4. Listings (shared primitives)
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  product_type public.product_type NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  city_ar text,
  city_en text,
  price numeric NOT NULL CHECK (price >= 0),
  original_price numeric,
  currency text NOT NULL DEFAULT 'DZD',
  urgent boolean NOT NULL DEFAULT false,
  status public.listing_status NOT NULL DEFAULT 'active',
  images text[] NOT NULL DEFAULT '{}'::text[],
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_agency_idx ON public.listings(agency_id);
CREATE INDEX IF NOT EXISTS listings_type_status_idx ON public.listings(product_type, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_public_read_active" ON public.listings FOR SELECT TO authenticated
  USING (status = 'active' AND EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.banned = false));
CREATE POLICY "listings_owner_read" ON public.listings FOR SELECT TO authenticated
  USING (public.is_agency_member(agency_id) OR public.is_admin(auth.uid()));
CREATE POLICY "listings_owner_insert" ON public.listings FOR INSERT TO authenticated
  WITH CHECK (public.is_agency_member(agency_id));
CREATE POLICY "listings_owner_update" ON public.listings FOR UPDATE TO authenticated
  USING (public.is_agency_member(agency_id) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_agency_member(agency_id) OR public.is_admin(auth.uid()));
CREATE POLICY "listings_owner_delete" ON public.listings FOR DELETE TO authenticated
  USING (public.is_agency_member(agency_id) OR public.is_admin(auth.uid()));

CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Typed detail tables
CREATE TABLE IF NOT EXISTS public.listing_flight_details (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  airline text NOT NULL,
  city_from_ar text NOT NULL,
  city_from_en text NOT NULL,
  city_to_ar text NOT NULL,
  city_to_en text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listing_hotel_details (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  hotel_name text NOT NULL,
  hotel_stars integer CHECK (hotel_stars BETWEEN 1 AND 7),
  room_type text,
  board_type text,
  distance_to_haram_m integer,
  check_in date,
  check_out date,
  nights integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listing_visa_details (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  visa_type text NOT NULL,
  entry_type text,
  processing_days integer,
  validity_days integer,
  requirements_ar text,
  requirements_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listing_package_details (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  nights integer,
  departure_date date,
  return_date date,
  itinerary_ar text,
  itinerary_en text,
  inclusions_ar text,
  inclusions_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listing_package_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  component_listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  component_type public.product_type NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  label_ar text,
  label_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lpc_package_idx ON public.listing_package_components(package_listing_id);

DO $$
DECLARE tname text;
BEGIN
  FOREACH tname IN ARRAY ARRAY['listing_flight_details','listing_hotel_details','listing_visa_details','listing_package_details','listing_package_components']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tname);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tname);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', tname || '_updated_at', tname);
  END LOOP;
END $$;

-- detail RLS mirrors parent listing visibility
CREATE POLICY "flight_details_read" ON public.listing_flight_details FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id));
CREATE POLICY "flight_details_write" ON public.listing_flight_details FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))));

CREATE POLICY "hotel_details_read" ON public.listing_hotel_details FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id));
CREATE POLICY "hotel_details_write" ON public.listing_hotel_details FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))));

CREATE POLICY "visa_details_read" ON public.listing_visa_details FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id));
CREATE POLICY "visa_details_write" ON public.listing_visa_details FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))));

CREATE POLICY "package_details_read" ON public.listing_package_details FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id));
CREATE POLICY "package_details_write" ON public.listing_package_details FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))));

CREATE POLICY "package_components_read" ON public.listing_package_components FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = package_listing_id));
CREATE POLICY "package_components_write" ON public.listing_package_components FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = package_listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = package_listing_id AND (public.is_agency_member(l.agency_id) OR public.is_admin(auth.uid()))));

-- 6. Inventory engine
CREATE TABLE IF NOT EXISTS public.inventory_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  label text,
  unit_date date,
  quantity_total integer NOT NULL CHECK (quantity_total >= 0),
  quantity_sold integer NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  unit_price numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_units_listing_idx ON public.inventory_units(listing_id);

CREATE TABLE IF NOT EXISTS public.inventory_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.inventory_units(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  status public.hold_status NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_holds_unit_idx ON public.inventory_holds(unit_id, status);

GRANT SELECT ON public.inventory_units TO authenticated;
GRANT ALL ON public.inventory_units TO service_role;
GRANT SELECT ON public.inventory_holds TO authenticated;
GRANT ALL ON public.inventory_holds TO service_role;
ALTER TABLE public.inventory_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_holds ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER inventory_units_updated_at BEFORE UPDATE ON public.inventory_units
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER inventory_holds_updated_at BEFORE UPDATE ON public.inventory_holds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- reads only; all writes flow through SECURITY DEFINER rpcs
CREATE POLICY "inventory_units_read" ON public.inventory_units FOR SELECT TO authenticated
  USING (
    public.is_agency_member(agency_id) OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.listings l JOIN public.agencies a ON a.id = l.agency_id
               WHERE l.id = listing_id AND l.status = 'active' AND a.banned = false)
  );
CREATE POLICY "inventory_holds_read" ON public.inventory_holds FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (buyer_agency_id IS NOT NULL AND public.is_agency_member(buyer_agency_id))
    OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND public.is_agency_member(l.agency_id))
  );

-- seller manages its own inventory units through an rpc (keeps direct writes closed)
CREATE OR REPLACE FUNCTION public.upsert_inventory_unit(
  _listing_id uuid, _quantity_total integer, _unit_id uuid DEFAULT NULL,
  _label text DEFAULT NULL, _unit_date date DEFAULT NULL,
  _unit_price numeric DEFAULT NULL, _active boolean DEFAULT true
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _agency uuid; _id uuid; _sold integer;
BEGIN
  SELECT agency_id INTO _agency FROM public.listings WHERE id = _listing_id;
  IF _agency IS NULL THEN RAISE EXCEPTION 'listing not found'; END IF;
  IF NOT (public.is_agency_member(_agency) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _quantity_total < 0 THEN RAISE EXCEPTION 'quantity must be >= 0'; END IF;

  IF _unit_id IS NULL THEN
    INSERT INTO public.inventory_units (listing_id, agency_id, label, unit_date, quantity_total, unit_price, active)
    VALUES (_listing_id, _agency, _label, _unit_date, _quantity_total, _unit_price, _active)
    RETURNING id INTO _id;
  ELSE
    SELECT quantity_sold INTO _sold FROM public.inventory_units WHERE id = _unit_id AND listing_id = _listing_id FOR UPDATE;
    IF _sold IS NULL THEN RAISE EXCEPTION 'inventory unit not found'; END IF;
    IF _quantity_total < _sold THEN RAISE EXCEPTION 'cannot set total below sold quantity'; END IF;
    UPDATE public.inventory_units
      SET quantity_total = _quantity_total, label = COALESCE(_label, label),
          unit_date = COALESCE(_unit_date, unit_date), unit_price = COALESCE(_unit_price, unit_price),
          active = _active
      WHERE id = _unit_id RETURNING id INTO _id;
  END IF;
  RETURN _id;
END $$;

-- available = total - sold - active holds (computed inside the lock by callers)
CREATE OR REPLACE FUNCTION public.inventory_available(_unit_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(0, u.quantity_total - u.quantity_sold - COALESCE((
    SELECT SUM(h.quantity) FROM public.inventory_holds h
    WHERE h.unit_id = u.id AND h.status = 'active' AND h.expires_at > now()
  ), 0))::int
  FROM public.inventory_units u WHERE u.id = _unit_id;
$$;

CREATE OR REPLACE FUNCTION public.reserve_inventory(
  _unit_id uuid, _quantity integer, _buyer_agency_id uuid DEFAULT NULL,
  _booking_id uuid DEFAULT NULL, _hold_minutes integer DEFAULT 30
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u public.inventory_units%ROWTYPE; _held integer; _available integer; _hold uuid; _buyer uuid;
BEGIN
  IF _quantity IS NULL OR _quantity <= 0 THEN RAISE EXCEPTION 'quantity must be positive'; END IF;

  _buyer := COALESCE(_buyer_agency_id, (SELECT agency_id FROM public.profiles WHERE id = auth.uid()));
  IF _buyer IS NULL OR NOT (public.is_agency_member(_buyer) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- serialize on the unit row
  SELECT * INTO _u FROM public.inventory_units WHERE id = _unit_id FOR UPDATE;
  IF _u.id IS NULL THEN RAISE EXCEPTION 'inventory unit not found'; END IF;
  IF NOT _u.active THEN RAISE EXCEPTION 'inventory unit inactive'; END IF;

  -- expire stale holds on this unit inside the lock
  UPDATE public.inventory_holds SET status = 'expired'
    WHERE unit_id = _unit_id AND status = 'active' AND expires_at <= now();

  SELECT COALESCE(SUM(quantity), 0) INTO _held FROM public.inventory_holds
    WHERE unit_id = _unit_id AND status = 'active';

  _available := _u.quantity_total - _u.quantity_sold - _held;
  IF _quantity > _available THEN
    RAISE EXCEPTION 'insufficient inventory: % requested, % available', _quantity, GREATEST(_available, 0);
  END IF;

  INSERT INTO public.inventory_holds (unit_id, listing_id, buyer_agency_id, booking_id, quantity, expires_at)
  VALUES (_unit_id, _u.listing_id, _buyer, _booking_id, _quantity, now() + make_interval(mins => GREATEST(_hold_minutes, 1)))
  RETURNING id INTO _hold;

  RETURN _hold;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_inventory_hold(_hold_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _h public.inventory_holds%ROWTYPE; _seller uuid;
BEGIN
  SELECT * INTO _h FROM public.inventory_holds WHERE id = _hold_id FOR UPDATE;
  IF _h.id IS NULL THEN RAISE EXCEPTION 'hold not found'; END IF;
  IF _h.status <> 'active' THEN RAISE EXCEPTION 'hold is not active'; END IF;

  SELECT agency_id INTO _seller FROM public.listings WHERE id = _h.listing_id;
  IF NOT (public.is_agency_member(_seller) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  PERFORM 1 FROM public.inventory_units WHERE id = _h.unit_id FOR UPDATE;
  UPDATE public.inventory_units SET quantity_sold = quantity_sold + _h.quantity WHERE id = _h.unit_id;
  UPDATE public.inventory_holds SET status = 'confirmed' WHERE id = _hold_id;
END $$;

CREATE OR REPLACE FUNCTION public.release_inventory_hold(_hold_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _h public.inventory_holds%ROWTYPE; _seller uuid;
BEGIN
  SELECT * INTO _h FROM public.inventory_holds WHERE id = _hold_id FOR UPDATE;
  IF _h.id IS NULL THEN RAISE EXCEPTION 'hold not found'; END IF;
  IF _h.status <> 'active' THEN RETURN; END IF;

  SELECT agency_id INTO _seller FROM public.listings WHERE id = _h.listing_id;
  IF NOT (
    public.is_admin(auth.uid())
    OR public.is_agency_member(_seller)
    OR (_h.buyer_agency_id IS NOT NULL AND public.is_agency_member(_h.buyer_agency_id))
  ) THEN RAISE EXCEPTION 'not authorized'; END IF;

  UPDATE public.inventory_holds SET status = 'released' WHERE id = _hold_id;
END $$;

CREATE OR REPLACE FUNCTION public.expire_inventory_holds()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n integer;
BEGIN
  UPDATE public.inventory_holds SET status = 'expired'
    WHERE status = 'active' AND expires_at <= now();
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $$;

REVOKE ALL ON FUNCTION public.upsert_inventory_unit(uuid,integer,uuid,text,date,numeric,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reserve_inventory(uuid,integer,uuid,uuid,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_inventory_hold(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_inventory_hold(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_inventory_holds() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inventory_available(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_inventory_unit(uuid,integer,uuid,text,date,numeric,boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserve_inventory(uuid,integer,uuid,uuid,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_inventory_hold(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_inventory_hold(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.expire_inventory_holds() TO service_role;
GRANT EXECUTE ON FUNCTION public.inventory_available(uuid) TO authenticated, service_role;

-- 7. Backlink + backfill of existing flight offers (idempotent, non-destructive)
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;

DO $$
DECLARE o RECORD; _lid uuid;
BEGIN
  FOR o IN SELECT * FROM public.offers WHERE listing_id IS NULL LOOP
    INSERT INTO public.listings (
      agency_id, product_type, title_ar, title_en, description_ar, description_en,
      city_ar, city_en, price, original_price, currency, urgent, status, images,
      expires_at, created_at, updated_at
    ) VALUES (
      o.agency_id, 'flight_seat',
      o.city_from_ar || ' → ' || o.city_to_ar,
      o.city_from_en || ' → ' || o.city_to_en,
      o.notes_ar, o.notes_en,
      o.city_from_ar, o.city_from_en,
      o.price, o.original_price, o.currency, o.urgent,
      CASE o.status::text
        WHEN 'active' THEN 'active'::public.listing_status
        WHEN 'paused' THEN 'paused'::public.listing_status
        WHEN 'sold_out' THEN 'sold_out'::public.listing_status
        ELSE 'expired'::public.listing_status END,
      o.images, o.expires_at, o.created_at, o.updated_at
    ) RETURNING id INTO _lid;

    INSERT INTO public.listing_flight_details (
      listing_id, airline, city_from_ar, city_from_en, city_to_ar, city_to_en, departure_date, return_date
    ) VALUES (_lid, o.airline, o.city_from_ar, o.city_from_en, o.city_to_ar, o.city_to_en, o.departure_date, o.return_date);

    INSERT INTO public.inventory_units (listing_id, agency_id, label, unit_date, quantity_total, quantity_sold, unit_price, active)
    VALUES (_lid, o.agency_id, 'seats', o.departure_date, o.total_seats,
            GREATEST(o.total_seats - o.remaining_seats, 0), o.price, o.status::text = 'active');

    UPDATE public.offers SET listing_id = _lid WHERE id = o.id;
  END LOOP;
END $$;
