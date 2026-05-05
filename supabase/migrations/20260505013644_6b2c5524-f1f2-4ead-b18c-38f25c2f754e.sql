CREATE OR REPLACE FUNCTION public.get_global_kpis()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_companies', (SELECT COUNT(*) FROM public.companies),
    'active_companies', (SELECT COUNT(*) FROM public.companies WHERE status = 'active' AND plan_active = true),
    'trial_companies', (SELECT COUNT(*) FROM public.companies WHERE first_payment_at IS NULL AND trial_ends_at > now() AND plan_active = true),
    'paying_companies', (SELECT COUNT(*) FROM public.companies WHERE first_payment_at IS NOT NULL),
    'expired_trials', (SELECT COUNT(*) FROM public.companies WHERE first_payment_at IS NULL AND trial_ends_at <= now()),
    'appointments_this_month', (SELECT COUNT(*) FROM public.appointments WHERE date >= date_trunc('month', CURRENT_DATE)),
    'completed_this_month', (SELECT COUNT(*) FROM public.appointments WHERE date >= date_trunc('month', CURRENT_DATE) AND status = 'completed'),
    'total_clients', (SELECT COUNT(*) FROM public.clients),
    'companies_last_30d', (SELECT COUNT(*) FROM public.companies WHERE created_at >= now() - INTERVAL '30 days')
  ) INTO _result;

  RETURN _result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_global_kpis() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_global_kpis() TO authenticated;