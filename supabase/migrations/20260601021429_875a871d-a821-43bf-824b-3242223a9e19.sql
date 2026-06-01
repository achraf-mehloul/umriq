
-- Storage buckets for offer images and agency documents
INSERT INTO storage.buckets (id, name, public) VALUES ('offer-images', 'offer-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('agency-logos', 'agency-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('agency-docs', 'agency-docs', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies: offer-images (public read, authenticated upload to own folder by agency owner)
CREATE POLICY "offer_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'offer-images');
CREATE POLICY "offer_images_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'offer-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "offer_images_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'offer-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "offer_images_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'offer-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "agency_logos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'agency-logos');
CREATE POLICY "agency_logos_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agency-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "agency_logos_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'agency-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "agency_logos_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'agency-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "agency_docs_owner_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'agency-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "agency_docs_admin_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'agency-docs' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "agency_docs_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agency-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "agency_docs_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'agency-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add image gallery to offers (array of urls)
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS city_to_ar text NOT NULL DEFAULT 'مكة المكرمة';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS city_to_en text NOT NULL DEFAULT 'Makkah';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS hotel_name text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS hotel_stars int CHECK (hotel_stars BETWEEN 1 AND 5);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS package_type text;

-- Indexes for search/filter
CREATE INDEX IF NOT EXISTS idx_offers_status_dep ON public.offers (status, departure_date);
CREATE INDEX IF NOT EXISTS idx_offers_agency ON public.offers (agency_id);
CREATE INDEX IF NOT EXISTS idx_offers_city_from ON public.offers (city_from_ar, city_from_en);
CREATE INDEX IF NOT EXISTS idx_offers_price ON public.offers (price);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_a ON public.conversations (agency_a_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_b ON public.conversations (agency_b_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_seller ON public.bookings (seller_agency_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer ON public.bookings (buyer_agency_id, status);

-- Trigger to bump conversation.last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_bump_conv ON public.messages;
CREATE TRIGGER trg_bump_conv AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();

-- Trigger: auto-decrement remaining_seats and create notification when booking confirmed
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_seller_owner uuid;
  v_buyer_owner uuid;
BEGIN
  SELECT owner_id INTO v_seller_owner FROM public.agencies WHERE id = NEW.seller_agency_id;
  SELECT owner_id INTO v_buyer_owner FROM public.agencies WHERE id = NEW.buyer_agency_id;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
    VALUES (v_seller_owner, 'booking_request', 'طلب حجز جديد', 'New booking request',
            'لديك طلب حجز '||NEW.seats||' مقاعد', 'New request for '||NEW.seats||' seats',
            '/bookings/'||NEW.id);
  ELSIF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE public.offers SET remaining_seats = GREATEST(remaining_seats - NEW.seats, 0) WHERE id = NEW.offer_id;
    END IF;
    INSERT INTO public.notifications (user_id, type, title_ar, title_en, body_ar, body_en, link)
    VALUES (v_buyer_owner, 'booking_update', 'تحديث الحجز', 'Booking update',
            'تم تحديث حالة حجزك إلى '||NEW.status, 'Booking status: '||NEW.status,
            '/bookings/'||NEW.id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_booking_status ON public.bookings;
CREATE TRIGGER trg_booking_status AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.handle_booking_status_change();

-- Update agency rating after new review
CREATE OR REPLACE FUNCTION public.refresh_agency_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.agencies a
  SET rating = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE reviewed_agency_id = a.id), 0)
  WHERE a.id = NEW.reviewed_agency_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_refresh_rating ON public.reviews;
CREATE TRIGGER trg_refresh_rating AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_agency_rating();
