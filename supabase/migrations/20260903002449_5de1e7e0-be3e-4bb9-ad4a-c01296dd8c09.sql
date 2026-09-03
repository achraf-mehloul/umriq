REVOKE ALL ON FUNCTION public.handle_payment_proof_review() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_seller_payment_proof() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_agency_trial() FROM PUBLIC, anon, authenticated;