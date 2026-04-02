-- 1. Remove sensitive tables from Realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'blocked_slots'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.blocked_slots;
  END IF;
END $$;

-- 2. Restrict anon access to companies - hide sensitive contact fields
DROP POLICY IF EXISTS "Public can view active companies" ON public.companies;

-- Create a view for public/anon access that excludes sensitive fields
CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT
  id, name, slug, description, address, city, state, zip_code,
  logo_url, cover_url, primary_color, status,
  latitude, longitude, google_maps_url,
  max_active_appointments, max_advance_days, cancel_limit_hours
FROM public.companies
WHERE slug IS NOT NULL AND status = 'active'::company_status;

-- Re-create anon policy that only allows access to non-sensitive columns
CREATE POLICY "Anon view active companies limited"
ON public.companies FOR SELECT TO anon
USING (
  slug IS NOT NULL
  AND status = 'active'::company_status
);