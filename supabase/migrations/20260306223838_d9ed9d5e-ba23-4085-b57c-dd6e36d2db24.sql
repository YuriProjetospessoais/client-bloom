
-- Add slug and primary_color to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#8B5CF6';

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- Index on user_roles.user_id for multi-membership performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- RLS: Allow anon to read company by slug for tenant detection
CREATE POLICY "Public can view company by slug"
ON public.companies FOR SELECT TO anon
USING (slug IS NOT NULL AND status = 'active'::company_status);

-- RLS: Allow anon to view active services for booking portal
CREATE POLICY "Public can view active services"
ON public.services FOR SELECT TO anon
USING (active = true);

-- RLS: Allow anon to view active professionals for booking portal
CREATE POLICY "Public can view active professionals"
ON public.professionals FOR SELECT TO anon
USING (active = true);

-- RLS: Allow anon to view working hours for booking portal
CREATE POLICY "Public can view working hours"
ON public.working_hours FOR SELECT TO anon
USING (is_available = true);
