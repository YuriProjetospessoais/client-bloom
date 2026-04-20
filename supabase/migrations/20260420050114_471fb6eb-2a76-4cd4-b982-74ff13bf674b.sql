-- Remove políticas antigas potencialmente permissivas no bucket company_assets
DROP POLICY IF EXISTS "Public can read company assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read company_assets" ON storage.objects;
DROP POLICY IF EXISTS "company_assets public read" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view company_assets" ON storage.objects;
DROP POLICY IF EXISTS "company_assets select" ON storage.objects;
DROP POLICY IF EXISTS "company_assets admin manage" ON storage.objects;
DROP POLICY IF EXISTS "company_assets admin list" ON storage.objects;

-- IMPORTANTE: O bucket continua "public" para que getPublicUrl funcione,
-- mas restringimos LIST/SELECT por meio das policies em storage.objects.
-- Buckets públicos no Supabase só expõem arquivos via URL conhecida quando
-- não há policy permitindo SELECT amplo — por isso NÃO criamos uma policy
-- pública de SELECT em storage.objects para este bucket.

-- Apenas admins (super_admin ou company_admin) podem listar/ver objetos via API
CREATE POLICY "company_assets admin list"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company_assets'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "company_assets admin manage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'company_assets'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'company_assets'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'company_admin'::app_role)
  )
);
