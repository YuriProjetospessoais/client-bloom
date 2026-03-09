
-- Allow employees (barbers) to update client notes in their company
CREATE POLICY "Employees update client notes"
ON public.clients FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Allow secretaries to manage clients (create, update)
CREATE POLICY "Secretaries manage clients"
ON public.clients FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);
