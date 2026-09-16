
-- 1. Hotel detail fields
ALTER TABLE public.listing_hotel_details
  ADD COLUMN IF NOT EXISTS hotel_name_ar text,
  ADD COLUMN IF NOT EXISTS city_zone text NOT NULL DEFAULT 'makkah',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS landmark_note_ar text,
  ADD COLUMN IF NOT EXISTS landmark_note_en text,
  ADD COLUMN IF NOT EXISTS max_occupancy integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS cancellation_policy_ar text,
  ADD COLUMN IF NOT EXISTS cancellation_policy_en text,
  ADD COLUMN IF NOT EXISTS free_cancellation_days integer;

ALTER TABLE public.listing_hotel_details
  DROP CONSTRAINT IF EXISTS listing_hotel_details_city_zone_check;
ALTER TABLE public.listing_hotel_details
  ADD CONSTRAINT listing_hotel_details_city_zone_check
  CHECK (city_zone IN ('makkah','madinah','other'));
ALTER TABLE public.listing_hotel_details
  DROP CONSTRAINT IF EXISTS listing_hotel_details_max_occupancy_check;
ALTER TABLE public.listing_hotel_details
  ADD CONSTRAINT listing_hotel_details_max_occupancy_check
  CHECK (max_occupancy BETWEEN 1 AND 12);

-- 2. Hotel bookings (distinct from flight seat bookings)
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  unit_id uuid NOT NULL REFERENCES public.inventory_units(id) ON DELETE RESTRICT,
  hold_id uuid REFERENCES public.inventory_holds(id) ON DELETE SET NULL,
  buyer_agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
  seller_agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE RESTRICT,
  hotel_name text NOT NULL,
  hotel_name_ar text,
  hotel_stars integer,
  city_zone text NOT NULL DEFAULT 'makkah',
  room_type text,
  board_type text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer NOT NULL,
  guests_per_room integer NOT NULL DEFAULT 2,
  rooms integer NOT NULL,
  price_per_room numeric NOT NULL,
  total_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'DZD',
  cancellation_policy text,
  free_cancellation_until date,
  status public.booking_status NOT NULL DEFAULT 'pending',
  notes text,
  cancelled_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hotel_bookings_rooms_check CHECK (rooms > 0),
  CONSTRAINT hotel_bookings_nights_check CHECK (nights > 0),
  CONSTRAINT hotel_bookings_dates_check CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS hotel_bookings_buyer_idx ON public.hotel_bookings(buyer_agency_id);
CREATE INDEX IF NOT EXISTS hotel_bookings_seller_idx ON public.hotel_bookings(seller_agency_id);
CREATE INDEX IF NOT EXISTS hotel_bookings_listing_idx ON public.hotel_bookings(listing_id);

GRANT SELECT ON public.hotel_bookings TO authenticated;
GRANT ALL ON public.hotel_bookings TO service_role;

ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_bookings_select_parties" ON public.hotel_bookings;
CREATE POLICY "hotel_bookings_select_parties" ON public.hotel_bookings
  FOR SELECT TO authenticated
  USING (
    public.is_agency_member(buyer_agency_id)
    OR public.is_agency_member(seller_agency_id)
    OR public.is_admin(auth.uid())
  );
-- No INSERT/UPDATE/DELETE policies: all writes go through SECURITY DEFINER RPCs.

DROP TRIGGER IF EXISTS set_hotel_bookings_updated_at ON public.hotel_bookings;
CREATE TRIGGER set_hotel_bookings_updated_at
  BEFORE UPDATE ON public.hotel_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Booking RPCs
CREATE OR REPLACE FUNCTION public.book_hotel_rooms(
  _unit_id uuid,
  _rooms integer,
  _guests_per_room integer DEFAULT 2,
  _notes text DEFAULT NULL,
  _hold_minutes integer DEFAULT 60
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _u public.inventory_units%ROWTYPE;
  _l public.listings%ROWTYPE;
  _d public.listing_hotel_details%ROWTYPE;
  _buyer uuid; _hold uuid; _booking uuid; _price numeric; _nights integer;
  _ci date; _co date;
BEGIN
  SELECT * INTO _u FROM public.inventory_units WHERE id = _unit_id;
  IF _u.id IS NULL THEN RAISE EXCEPTION 'inventory unit not found'; END IF;

  SELECT * INTO _l FROM public.listings WHERE id = _u.listing_id;
  IF _l.product_type <> 'hotel_room' THEN RAISE EXCEPTION 'not a hotel listing'; END IF;
  IF _l.status <> 'active' THEN RAISE EXCEPTION 'listing is not active'; END IF;

  SELECT * INTO _d FROM public.listing_hotel_details WHERE listing_id = _l.id;
  IF _d.listing_id IS NULL THEN RAISE EXCEPTION 'hotel details missing'; END IF;

  SELECT agency_id INTO _buyer FROM public.profiles WHERE id = auth.uid();
  IF _buyer IS NULL THEN RAISE EXCEPTION 'no buyer agency'; END IF;
  IF _buyer = _l.agency_id THEN RAISE EXCEPTION 'cannot book your own listing'; END IF;
  IF _guests_per_room IS NULL OR _guests_per_room < 1 OR _guests_per_room > _d.max_occupancy THEN
    RAISE EXCEPTION 'invalid occupancy';
  END IF;

  -- atomic hold; raises on oversell
  _hold := public.reserve_inventory(_unit_id, _rooms, _buyer, NULL, _hold_minutes);

  _ci := COALESCE(_u.unit_date, _d.check_in);
  _co := _d.check_out;
  IF _ci IS NULL OR _co IS NULL THEN RAISE EXCEPTION 'hotel dates missing'; END IF;
  _nights := COALESCE(_d.nights, GREATEST(1, (_co - _ci)));
  _price := COALESCE(_u.unit_price, _l.price);

  INSERT INTO public.hotel_bookings (
    listing_id, unit_id, hold_id, buyer_agency_id, seller_agency_id,
    hotel_name, hotel_name_ar, hotel_stars, city_zone, room_type, board_type,
    check_in, check_out, nights, guests_per_room, rooms,
    price_per_room, total_price, currency, cancellation_policy,
    free_cancellation_until, status, notes
  ) VALUES (
    _l.id, _unit_id, _hold, _buyer, _l.agency_id,
    _d.hotel_name, _d.hotel_name_ar, _d.hotel_stars, _d.city_zone, _d.room_type, _d.board_type,
    _ci, _co, _nights, _guests_per_room, _rooms,
    _price, _price * _rooms * _nights, _l.currency,
    COALESCE(_d.cancellation_policy_en, _d.cancellation_policy_ar),
    CASE WHEN _d.free_cancellation_days IS NOT NULL
      THEN _ci - _d.free_cancellation_days ELSE NULL END,
    'pending', _notes
  ) RETURNING id INTO _booking;

  UPDATE public.inventory_holds SET booking_id = NULL WHERE id = _hold;

  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  SELECT a.owner_id, 'deal', 'طلب حجز فندقي جديد', 'New hotel booking request',
         _d.hotel_name, _d.hotel_name, '/hotel-bookings'
  FROM public.agencies a WHERE a.id = _l.agency_id;

  RETURN _booking;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_hotel_booking(_booking_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _b public.hotel_bookings%ROWTYPE;
BEGIN
  SELECT * INTO _b FROM public.hotel_bookings WHERE id = _booking_id FOR UPDATE;
  IF _b.id IS NULL THEN RAISE EXCEPTION 'booking not found'; END IF;
  IF NOT (public.is_agency_member(_b.seller_agency_id) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _b.status <> 'pending' THEN RAISE EXCEPTION 'booking is not pending'; END IF;

  IF _b.hold_id IS NOT NULL THEN
    PERFORM public.confirm_inventory_hold(_b.hold_id);
  END IF;
  UPDATE public.hotel_bookings SET status = 'confirmed' WHERE id = _booking_id;

  INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
  SELECT a.owner_id, 'deal', 'تم تأكيد الحجز الفندقي', 'Hotel booking confirmed',
         _b.hotel_name, _b.hotel_name, '/hotel-bookings'
  FROM public.agencies a WHERE a.id = _b.buyer_agency_id;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_hotel_booking(_booking_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _b public.hotel_bookings%ROWTYPE; _hold public.inventory_holds%ROWTYPE;
BEGIN
  SELECT * INTO _b FROM public.hotel_bookings WHERE id = _booking_id FOR UPDATE;
  IF _b.id IS NULL THEN RAISE EXCEPTION 'booking not found'; END IF;
  IF NOT (
    public.is_agency_member(_b.buyer_agency_id)
    OR public.is_agency_member(_b.seller_agency_id)
    OR public.is_admin(auth.uid())
  ) THEN RAISE EXCEPTION 'not authorized'; END IF;
  IF _b.status IN ('cancelled','completed') THEN RETURN; END IF;

  IF _b.hold_id IS NOT NULL THEN
    SELECT * INTO _hold FROM public.inventory_holds WHERE id = _b.hold_id FOR UPDATE;
    IF _hold.status = 'active' THEN
      UPDATE public.inventory_holds SET status = 'released' WHERE id = _hold.id;
    ELSIF _hold.status = 'confirmed' THEN
      PERFORM 1 FROM public.inventory_units WHERE id = _b.unit_id FOR UPDATE;
      UPDATE public.inventory_units
        SET quantity_sold = GREATEST(0, quantity_sold - _b.rooms)
        WHERE id = _b.unit_id;
      UPDATE public.inventory_holds SET status = 'released' WHERE id = _hold.id;
    END IF;
  END IF;

  UPDATE public.hotel_bookings
    SET status = 'cancelled', cancelled_reason = _reason
    WHERE id = _booking_id;
END $$;

REVOKE ALL ON FUNCTION public.book_hotel_rooms(uuid, integer, integer, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_hotel_booking(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_hotel_booking(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_hotel_rooms(uuid, integer, integer, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_hotel_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_hotel_booking(uuid, text) TO authenticated;
