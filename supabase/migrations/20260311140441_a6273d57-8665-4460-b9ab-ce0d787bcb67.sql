-- Drop the broken public policy that requires x-company-slug header
DROP POLICY IF EXISTS "Public can view company by slug" ON public.companies;

-- Create a proper public policy: anon users can view active companies' public metadata
CREATE POLICY "Public can view active companies"
  ON public.companies
  FOR SELECT
  TO anon
  USING (
    slug IS NOT NULL
    AND status = 'active'::company_status
  );

-- Update all companies using the default purple color to NavalhApp gold
UPDATE public.companies
SET primary_color = '#C6973F'
WHERE primary_color = '#8B5CF6' OR primary_color IS NULL;

-- Update the column default to NavalhApp gold
ALTER TABLE public.companies
  ALTER COLUMN primary_color SET DEFAULT '#C6973F';