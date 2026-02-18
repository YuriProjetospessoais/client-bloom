-- Allow clients to cancel their own appointments
CREATE POLICY "Clients cancel own appointments"
ON public.appointments
FOR UPDATE
USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  AND booked_by_client = true
)
WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  AND status = 'cancelled'
);