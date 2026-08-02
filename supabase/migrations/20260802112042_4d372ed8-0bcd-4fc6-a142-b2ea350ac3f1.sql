-- ========== PLATFORM PAYMENT ACCOUNTS ==========
CREATE TABLE public.platform_payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method text NOT NULL,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  holder_name text NOT NULL,
  account_number text NOT NULL,
  instructions_ar text,
  instructions_en text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_payment_accounts TO authenticated;
GRANT ALL ON public.platform_payment_accounts TO service_role;
ALTER TABLE public.platform_payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signed in users read active platform accounts"
ON public.platform_payment_accounts FOR SELECT TO authenticated
USING (is_active);

CREATE POLICY "admins manage platform accounts"
ON public.platform_payment_accounts FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER platform_payment_accounts_updated BEFORE UPDATE ON public.platform_payment_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.platform_payment_accounts (method, label_ar, label_en, holder_name, account_number, instructions_ar, instructions_en, sort_order) VALUES
('baridimob','بريدي موب / CCP','BaridiMob / CCP','Umriq','00799999004127558756','حوّل المبلغ عبر تطبيق BaridiMob إلى رقم RIP أعلاه ثم أرسل صورة الإيصال.','Transfer via the BaridiMob app to the RIP above, then upload the receipt.',1),
('paypal','باي بال','PayPal','Umriq','achrafmehloul50@gmail.com','أرسل المبلغ إلى بريد PayPal أعلاه بخيار Goods & Services ثم أرفق الإيصال.','Send the amount to the PayPal address above using Goods & Services, then attach the receipt.',2),
('visa','بطاقة فيزا','Visa card','Umriq','1537406304','حوّل إلى رقم البطاقة أعلاه ثم أرفق إثبات التحويل.','Transfer to the card number above, then attach the transfer proof.',3);

-- ========== RATE LIMITING / ANTI-ABUSE ==========
CREATE TABLE public.rate_events (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_events_lookup ON public.rate_events (user_id, kind, created_at DESC);

GRANT SELECT ON public.rate_events TO authenticated;
GRANT ALL ON public.rate_events TO service_role;
ALTER TABLE public.rate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own rate events" ON public.rate_events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.enforce_rate_limit(_kind text, _max int, _window interval)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  DELETE FROM public.rate_events WHERE created_at < now() - interval '7 days';
  SELECT count(*) INTO used FROM public.rate_events
  WHERE user_id = auth.uid() AND kind = _kind AND created_at > now() - _window;
  IF used >= _max THEN
    RAISE EXCEPTION 'RATE_LIMIT:%:% per %', _kind, _max, _window
      USING HINT = 'Too many actions, please slow down.';
  END IF;
  INSERT INTO public.rate_events (user_id, kind) VALUES (auth.uid(), _kind);
END; $$;
REVOKE EXECUTE ON FUNCTION public.enforce_rate_limit(text,int,interval) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rate_limit_offers() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enforce_rate_limit('offer_create', 10, interval '1 hour');
  PERFORM public.enforce_rate_limit('offer_create_daily', 30, interval '24 hours');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.rate_limit_offers() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_rate_limit_offers ON public.offers;
CREATE TRIGGER trg_rate_limit_offers BEFORE INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_offers();

CREATE OR REPLACE FUNCTION public.rate_limit_messages() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enforce_rate_limit('message_send', 30, interval '5 minutes');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.rate_limit_messages() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_rate_limit_messages ON public.messages;
CREATE TRIGGER trg_rate_limit_messages BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.rate_limit_messages();

-- ========== EXTENDED MESSAGE MASKING (places / wilayas / addresses) ==========
CREATE OR REPLACE FUNCTION public.mask_message_body() RETURNS trigger
  LANGUAGE plpgsql SET search_path = public AS $$
DECLARE original text; m text;
BEGIN
  original := NEW.body;
  m := regexp_replace(original, '(\+213|00213|0)[\s-]?[5-7]\d{1,2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}', '••• phone hidden •••', 'g');
  m := regexp_replace(m, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '••• email hidden •••', 'g');
  m := regexp_replace(m, '(wa\.me|t\.me|whatsapp|telegram|viber|imo)\S*', '••• link hidden •••', 'gi');
  m := regexp_replace(m, 'https?://\S+', '••• link hidden •••', 'gi');
  -- Arabic address / meeting-place keywords: hide the keyword and what follows on the same phrase
  m := regexp_replace(m, '(شارع|نهج|حي|حيّ|بلدية|ولاية|دائرة|دوار|طريق|عمارة|رقم\s+المنزل|المحل|المكتب|الوكالة\s+في|عنوان|العنوان|قرب|بجانب|أمام|مقابل|نلتقي\s+في|تعال\s+إلى)\s+[^\.،,\n]{1,60}', '••• location hidden •••', 'g');
  m := regexp_replace(m, '\y(rue|avenue|bd|boulevard|cite|cité|quartier|commune|wilaya|adresse|address|meet me at|near|next to|in front of)\y\s*[^\.,\n]{1,60}', '••• location hidden •••', 'gi');
  NEW.body := m;
  NEW.masked_body := CASE WHEN m <> original THEN 'masked' ELSE NULL END;
  RETURN NEW;
END; $$;

-- ========== EMAIL OUTBOX ==========
CREATE TABLE public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_outbox TO service_role;
GRANT SELECT ON public.email_outbox TO authenticated;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read email outbox" ON public.email_outbox FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER email_outbox_updated BEFORE UPDATE ON public.email_outbox
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.queue_email(_to text, _subject text, _html text, _kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _to IS NULL OR _to = '' THEN RETURN; END IF;
  INSERT INTO public.email_outbox (to_email, subject, body_html, kind) VALUES (_to, _subject, _html, _kind);
END; $$;
REVOKE EXECUTE ON FUNCTION public.queue_email(text,text,text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.email_on_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seller_email text; buyer_email text;
BEGIN
  SELECT p.email INTO seller_email FROM public.agency_private p WHERE p.agency_id = NEW.seller_agency_id;
  SELECT p.email INTO buyer_email FROM public.agency_private p WHERE p.agency_id = NEW.buyer_agency_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.queue_email(seller_email, 'Umriq — طلب حجز جديد / New booking request',
      '<p>لديك طلب حجز جديد على منصة Umriq. افتح التطبيق لمراجعته.</p><p>You have a new booking request on Umriq. Open the app to review it.</p>', 'booking_new');
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('confirmed','paid','completed','cancelled') THEN
    PERFORM public.queue_email(buyer_email, 'Umriq — تحديث حالة الحجز / Booking update',
      '<p>تم تحديث حالة حجزك إلى: ' || NEW.status || '</p><p>Your booking status is now: ' || NEW.status || '</p>', 'booking_status');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.email_on_booking() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_email_on_booking ON public.bookings;
CREATE TRIGGER trg_email_on_booking AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.email_on_booking();

CREATE OR REPLACE FUNCTION public.email_on_kyc() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text;
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified AND NEW.verified THEN
    SELECT p.email INTO em FROM public.agency_private p WHERE p.agency_id = NEW.id;
    PERFORM public.queue_email(em, 'Umriq — تم توثيق وكالتك / Your agency is verified',
      '<p>تهانينا، تم قبول ملف التوثيق الخاص بوكالتك على Umriq.</p><p>Congratulations, your agency has been verified on Umriq.</p>', 'kyc_approved');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.email_on_kyc() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_email_on_kyc ON public.agencies;
CREATE TRIGGER trg_email_on_kyc AFTER UPDATE ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.email_on_kyc();