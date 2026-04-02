
-- 1. Update companies_public view to include public contact fields (phone, whatsapp)
-- but continue excluding internal email
CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT
  id, name, slug, description, address, city, state, zip_code,
  logo_url, cover_url, primary_color, status,
  latitude, longitude, google_maps_url,
  max_active_appointments, max_advance_days, cancel_limit_hours,
  phone, whatsapp_number
FROM public.companies
WHERE slug IS NOT NULL AND status = 'active'::company_status;

-- 2. Remove direct anon access to companies table
DROP POLICY IF EXISTS "Anon view active companies limited" ON public.companies;
