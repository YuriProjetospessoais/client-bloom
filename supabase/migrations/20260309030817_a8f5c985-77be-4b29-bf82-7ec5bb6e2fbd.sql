
-- Allow secretaries to view appointments for their company
CREATE POLICY "Secretaries view company appointments"
ON public.appointments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to insert appointments
CREATE POLICY "Secretaries create appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to update appointments
CREATE POLICY "Secretaries update appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view clients for their company
CREATE POLICY "Secretaries view company clients"
ON public.clients FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view services
CREATE POLICY "Secretaries view services"
ON public.services FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view professionals
CREATE POLICY "Secretaries view professionals"
ON public.professionals FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view working hours
CREATE POLICY "Secretaries view working hours"
ON public.working_hours FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Company admins can manage staff roles in their company
CREATE POLICY "Company admins manage staff roles"
ON public.user_roles FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view company info
CREATE POLICY "Secretaries view own company"
ON public.companies FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view products (read-only)
CREATE POLICY "Secretaries view products"
ON public.products FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view product sales
CREATE POLICY "Secretaries view product sales"
ON public.product_sales FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to view profiles (for listing staff)
CREATE POLICY "Secretaries view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND user_id = auth.uid()
);
