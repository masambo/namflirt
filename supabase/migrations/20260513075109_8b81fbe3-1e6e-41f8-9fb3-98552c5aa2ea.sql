
-- Set search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke execute from public/anon/authenticated on internal helpers (they run via triggers / RLS policies)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_conv_participant(UUID, UUID) FROM PUBLIC, anon;

-- Restrict the storage SELECT policy: only authenticated users can read photos (no anonymous listing/browsing)
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
CREATE POLICY "Authenticated users can view profile photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-photos');
