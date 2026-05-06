-- Recreate view with security_invoker=on (executes with caller's privileges)
DROP VIEW IF EXISTS public.companies_public;

CREATE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT
  id, name, slug, description, address, city, state, zip_code,
  logo_url, cover_url, primary_color, status,
  latitude, longitude, google_maps_url,
  max_active_appointments, max_advance_days, cancel_limit_hours,
  phone, whatsapp_number, plan
FROM public.companies
WHERE slug IS NOT NULL AND status = 'active'::company_status;

GRANT SELECT ON public.companies_public TO anon, authenticated;

-- Restore narrow anon SELECT policy on base table so the view can read rows.
CREATE POLICY "Anon view active companies limited"
ON public.companies FOR SELECT TO anon
USING (slug IS NOT NULL AND status = 'active'::company_status);

-- Restrict which columns anon may read from the base table to non-sensitive fields only.
-- This blocks email, commission_percent, plan_active, trial_ends_at, first_payment_at,
-- referred_by_company_id, referral_code, plan_updated_at from anonymous reads.
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (
  id, name, slug, description, address, city, state, zip_code,
  logo_url, cover_url, primary_color, status,
  latitude, longitude, google_maps_url,
  max_active_appointments, max_advance_days, cancel_limit_hours,
  phone, whatsapp_number, plan
) ON public.companies TO anon;