
-- 1. Create a security definer function that checks if a company's plan includes a given feature
CREATE OR REPLACE FUNCTION public.company_has_feature(_company_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN c.plan = 'enterprise' THEN true
    WHEN c.plan = 'pro' THEN _feature = ANY(ARRAY[
      'scheduling','public_page','customers','barber_panel','reminders','whatsapp_button','location',
      'reports','return_alerts','customer_preferences','products','birthday_campaigns','advanced_schedule'
    ])
    WHEN c.plan = 'start' THEN _feature = ANY(ARRAY[
      'scheduling','public_page','customers','barber_panel','reminders','whatsapp_button','location'
    ])
    ELSE false
  END
  FROM public.companies c
  WHERE c.id = _company_id AND c.plan_active = true
$$;

-- 2. PRODUCTS table: drop non-admin SELECT policies and recreate with plan check

DROP POLICY IF EXISTS "Products visible to company" ON public.products;
DROP POLICY IF EXISTS "Secretaries view products" ON public.products;

CREATE POLICY "Products visible to company (plan check)"
ON public.products
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
);

CREATE POLICY "Secretaries view products (plan check)"
ON public.products
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
);

-- Admin manage policy: add plan check
DROP POLICY IF EXISTS "Admins manage products" ON public.products;

CREATE POLICY "Admins manage products (plan check)"
ON public.products
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
)
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
);

-- 3. PRODUCT_SALES table: drop non-admin policies and recreate with plan check

DROP POLICY IF EXISTS "Sales visible to company staff" ON public.product_sales;
DROP POLICY IF EXISTS "Secretaries view product sales" ON public.product_sales;
DROP POLICY IF EXISTS "Clients see own purchases" ON public.product_sales;
DROP POLICY IF EXISTS "Staff manage sales" ON public.product_sales;

CREATE POLICY "Sales visible to company staff (plan check)"
ON public.product_sales
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
);

CREATE POLICY "Secretaries view product sales (plan check)"
ON public.product_sales
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
);

CREATE POLICY "Clients see own purchases (plan check)"
ON public.product_sales
FOR SELECT
USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  AND company_has_feature(company_id, 'products')
);

CREATE POLICY "Staff manage sales (plan check)"
ON public.product_sales
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role))
  AND company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
)
WITH CHECK (
  (has_role(auth.uid(), 'company_admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role))
  AND company_id = get_user_company_id(auth.uid())
  AND company_has_feature(company_id, 'products')
);
