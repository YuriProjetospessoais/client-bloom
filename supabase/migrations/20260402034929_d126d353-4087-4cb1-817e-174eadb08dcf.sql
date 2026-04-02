-- 1. Fix role privilege escalation: restrict insertable roles for company admins
DROP POLICY IF EXISTS "Company admins manage staff roles" ON public.user_roles;

CREATE POLICY "Company admins manage staff roles"
ON public.user_roles FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND role IN ('employee'::app_role, 'secretary'::app_role, 'client'::app_role)
);

-- 2. Fix storage policies for company_assets bucket
DROP POLICY IF EXISTS "Authenticated users can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company assets" ON storage.objects;

CREATE POLICY "Company admins upload own assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company_assets'
  AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  AND public.has_role(auth.uid(), 'company_admin'::app_role)
);

CREATE POLICY "Company admins update own assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company_assets'
  AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  AND public.has_role(auth.uid(), 'company_admin'::app_role)
);

CREATE POLICY "Company admins delete own assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company_assets'
  AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  AND public.has_role(auth.uid(), 'company_admin'::app_role)
);