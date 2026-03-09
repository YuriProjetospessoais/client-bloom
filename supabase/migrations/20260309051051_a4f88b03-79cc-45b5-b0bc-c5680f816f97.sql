
-- ====================================================
-- 1. Fix clients INSERT: require company is active
-- ====================================================
DROP POLICY IF EXISTS "Users can insert own client record" ON public.clients;
CREATE POLICY "Users can insert own client record"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = company_id AND status = 'active'::company_status
    )
  );

-- ====================================================
-- 2. Fix appointments INSERT: validate company matches client's company
-- ====================================================
DROP POLICY IF EXISTS "Clients create appointments" ON public.appointments;
CREATE POLICY "Clients create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    booked_by_client = true
    AND client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.user_id = auth.uid()
        AND c.company_id = appointments.company_id
    )
  );

-- ====================================================
-- 3. Restrict public company view to requested slug only
-- ====================================================
DROP POLICY IF EXISTS "Public can view company by slug" ON public.companies;
CREATE POLICY "Public can view company by slug"
  ON public.companies FOR SELECT
  TO anon, authenticated
  USING (
    slug IS NOT NULL 
    AND status = 'active'::company_status
    AND id = get_public_company_id()
  );

-- ====================================================
-- 4. Create view for blocked_slots without reason (public access)
-- ====================================================
CREATE OR REPLACE VIEW public.blocked_slots_public
WITH (security_invoker = on) AS
  SELECT id, company_id, professional_id, date, start_time, end_time, created_at
  FROM public.blocked_slots;

-- Update public policy on blocked_slots to deny direct anonymous access
DROP POLICY IF EXISTS "Public view blocked slots for booking" ON public.blocked_slots;
CREATE POLICY "Public view blocked slots for booking"
  ON public.blocked_slots FOR SELECT
  TO anon
  USING (false);

-- Grant select on the view to anon so they use the safe view
GRANT SELECT ON public.blocked_slots_public TO anon;
GRANT SELECT ON public.blocked_slots_public TO authenticated;
