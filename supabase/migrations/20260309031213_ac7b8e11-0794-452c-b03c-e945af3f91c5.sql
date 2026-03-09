
-- Function to get the professional_id linked to a user
CREATE OR REPLACE FUNCTION public.get_user_professional_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.professionals
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop the broad employee policy that lets them see ALL company appointments
DROP POLICY IF EXISTS "Staff manage appointments" ON public.appointments;

-- Company admins can still manage all company appointments
CREATE POLICY "Company admins manage appointments"
ON public.appointments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Employees (barbers) can only see their own appointments
CREATE POLICY "Employees view own appointments"
ON public.appointments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
  AND professional_id = public.get_user_professional_id(auth.uid())
);

-- Employees can update their own appointments (e.g. mark complete)
CREATE POLICY "Employees update own appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
  AND professional_id = public.get_user_professional_id(auth.uid())
);

-- Employees can view clients in their company (needed for appointment context)
CREATE POLICY "Employees view company clients"
ON public.clients FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Employees can view services (read-only)
CREATE POLICY "Employees view services"
ON public.services FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Employees view own company
CREATE POLICY "Employees view own company"
ON public.companies FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND id = public.get_user_company_id(auth.uid())
);

-- Employees view professionals in their company
CREATE POLICY "Employees view company professionals"
ON public.professionals FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Employees view working hours
CREATE POLICY "Employees view working hours"
ON public.working_hours FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);
