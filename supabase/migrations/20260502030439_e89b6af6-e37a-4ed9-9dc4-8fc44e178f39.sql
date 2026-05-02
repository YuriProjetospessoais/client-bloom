CREATE OR REPLACE FUNCTION public.get_client_stats(_company_id uuid)
RETURNS TABLE (
  client_id uuid,
  last_visit date,
  total_spent numeric,
  visit_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT a.client_id,
         MAX(a.date) AS last_visit,
         COALESCE(SUM(s.price), 0) AS total_spent,
         COUNT(*) AS visit_count
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  WHERE a.company_id = _company_id
    AND a.status = 'completed'
  GROUP BY a.client_id;
END;
$$;