
-- Blocked time slots table
CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Company admins full access
CREATE POLICY "Company admins manage blocked slots"
ON public.blocked_slots FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Secretaries full access
CREATE POLICY "Secretaries manage blocked slots"
ON public.blocked_slots FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Employees can manage their own blocked slots
CREATE POLICY "Employees manage own blocked slots"
ON public.blocked_slots FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
  AND professional_id = public.get_user_professional_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
  AND professional_id = public.get_user_professional_id(auth.uid())
);

-- Employees can view all company blocked slots (for schedule visibility)
CREATE POLICY "Employees view company blocked slots"
ON public.blocked_slots FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Super admins
CREATE POLICY "Super admins manage all blocked slots"
ON public.blocked_slots FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Public read for booking flow (via company slug header)
CREATE POLICY "Public view blocked slots for booking"
ON public.blocked_slots FOR SELECT TO anon, authenticated
USING (company_id = public.get_public_company_id());

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;
