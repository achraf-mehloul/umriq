
-- Restrict public buckets: allow direct file access via URL but block listing
DROP POLICY IF EXISTS "offer_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "agency_logos_public_read" ON storage.objects;

-- Revoke EXECUTE on internal trigger functions (only triggers call them)
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_booking_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_agency_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
