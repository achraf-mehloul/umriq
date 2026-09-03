CREATE POLICY "receipts_insert_own_folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "receipts_update_own_folder" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "receipts_select_parties" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-receipts' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.payment_proofs p
      JOIN public.agencies a ON a.id IN (p.buyer_agency_id, p.seller_agency_id)
      WHERE p.receipt_url LIKE '%' || storage.objects.name AND a.owner_id = auth.uid()
    )
  )
);