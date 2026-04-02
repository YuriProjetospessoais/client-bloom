
-- 1. Create plan enum
CREATE TYPE public.company_plan AS ENUM ('start', 'pro', 'enterprise');

-- 2. Add plan columns to companies
ALTER TABLE public.companies
  ADD COLUMN plan public.company_plan NOT NULL DEFAULT 'start'::company_plan,
  ADD COLUMN plan_active boolean NOT NULL DEFAULT true,
  ADD COLUMN plan_updated_at timestamp with time zone NOT NULL DEFAULT now();

-- 3. Security definer function to get a company's plan (for RLS / backend checks)
CREATE OR REPLACE FUNCTION public.get_company_plan(_company_id uuid)
RETURNS public.company_plan
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan FROM public.companies
  WHERE id = _company_id AND plan_active = true
  LIMIT 1
$$;

-- 4. Update companies_public view to include plan
CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT
  id, name, slug, description, address, city, state, zip_code,
  logo_url, cover_url, primary_color, status,
  latitude, longitude, google_maps_url,
  max_active_appointments, max_advance_days, cancel_limit_hours,
  phone, whatsapp_number, plan
FROM public.companies
WHERE slug IS NOT NULL AND status = 'active'::company_status;

-- 5. RLS: Only super_admin can update the plan field
-- The existing "Company admins update own company" policy allows company_admin to UPDATE.
-- We need a trigger to prevent non-super_admin from changing plan fields.
CREATE OR REPLACE FUNCTION public.protect_plan_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If plan fields are being changed, only allow super_admin
  IF (OLD.plan IS DISTINCT FROM NEW.plan)
     OR (OLD.plan_active IS DISTINCT FROM NEW.plan_active) THEN
    IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
      RAISE EXCEPTION 'Apenas administradores globais podem alterar o plano da empresa.'
        USING ERRCODE = '42501';
    END IF;
    NEW.plan_updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_plan_fields_trigger
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_plan_fields();
