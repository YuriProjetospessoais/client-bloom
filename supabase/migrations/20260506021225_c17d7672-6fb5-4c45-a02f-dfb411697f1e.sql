-- 1. Remove overly-permissive SELECT policy that exposed all columns to everyone
DROP POLICY IF EXISTS "Public can read companies" ON public.companies;

-- 2. Remove anon direct base-table SELECT (still exposed all columns)
DROP POLICY IF EXISTS "Anon view active companies limited" ON public.companies;

-- 3. Recreate companies_public view as SECURITY DEFINER (security_invoker=off)
--    so anon can read it without needing direct base-table access.
--    The view itself restricts to active companies and excludes sensitive columns
--    (email, commission_percent, plan_active, trial_ends_at, first_payment_at,
--     referred_by_company_id, referral_code, plan_updated_at).
DROP VIEW IF EXISTS public.companies_public;

CREATE VIEW public.companies_public
WITH (security_invoker = off) AS
SELECT
  id, name, slug, description, address, city, state, zip_code,
  logo_url, cover_url, primary_color, status,
  latitude, longitude, google_maps_url,
  max_active_appointments, max_advance_days, cancel_limit_hours,
  phone, whatsapp_number, plan
FROM public.companies
WHERE slug IS NOT NULL AND status = 'active'::company_status;

GRANT SELECT ON public.companies_public TO anon, authenticated;