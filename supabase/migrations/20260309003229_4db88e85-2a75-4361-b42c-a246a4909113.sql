-- Add cover_url to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Create storage bucket for company assets (logos, covers)
INSERT INTO storage.buckets (id, name, public) VALUES ('company_assets', 'company_assets', true) ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- Public read access
CREATE POLICY "Public can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company_assets');

-- Authenticated users can upload assets
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company_assets' AND auth.role() = 'authenticated');

-- Authenticated users can update their assets
CREATE POLICY "Authenticated users can update company assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company_assets' AND auth.role() = 'authenticated');

-- Authenticated users can delete their assets
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'company_assets' AND auth.role() = 'authenticated');