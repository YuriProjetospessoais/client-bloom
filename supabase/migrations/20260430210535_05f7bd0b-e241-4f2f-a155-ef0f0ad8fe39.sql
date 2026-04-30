-- 1) Add 'no_show' to appointment_status enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status' AND e.enumlabel = 'no_show'
  ) THEN
    ALTER TYPE public.appointment_status ADD VALUE 'no_show';
  END IF;
END$$;

-- 2) Commission percent on companies (default 50%)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2) NOT NULL DEFAULT 50.00;

-- Helper: check if current user belongs to the company (any role) or is super_admin
CREATE OR REPLACE FUNCTION public.user_in_company(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (company_id = _company_id OR role = 'super_admin'::app_role)
  );
$$;

-- =====================================================================
-- 3) get_dashboard_kpis
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  _company_id UUID,
  _user_role TEXT DEFAULT NULL,
  _user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _result JSONB;
  _today DATE := CURRENT_DATE;
  _yesterday DATE := CURRENT_DATE - 1;
  _month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  _last_month_start DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE;
  _last_month_end DATE := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE;
  _prof_id UUID;
  _commission NUMERIC;
  _is_employee BOOLEAN := (_user_role = 'employee');
  _is_secretary BOOLEAN := (_user_role = 'secretary');
  _hide_finance BOOLEAN;
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  _hide_finance := _is_secretary;

  IF _is_employee THEN
    SELECT id INTO _prof_id FROM public.professionals
    WHERE company_id = _company_id AND user_id = COALESCE(_user_id, auth.uid())
    LIMIT 1;
  END IF;

  SELECT COALESCE(commission_percent, 50) INTO _commission
  FROM public.companies WHERE id = _company_id;

  WITH
  rev_today AS (
    SELECT COALESCE(SUM(s.price), 0) AS v
    FROM public.appointments a
    JOIN public.services s ON s.id = a.service_id
    WHERE a.company_id = _company_id
      AND a.date = _today
      AND a.status = 'completed'
      AND (NOT _is_employee OR a.professional_id = _prof_id)
  ),
  rev_yesterday AS (
    SELECT COALESCE(SUM(s.price), 0) AS v
    FROM public.appointments a
    JOIN public.services s ON s.id = a.service_id
    WHERE a.company_id = _company_id
      AND a.date = _yesterday
      AND a.status = 'completed'
      AND (NOT _is_employee OR a.professional_id = _prof_id)
  ),
  rev_month AS (
    SELECT COALESCE(SUM(s.price), 0) AS v, COUNT(*) AS n
    FROM public.appointments a
    JOIN public.services s ON s.id = a.service_id
    WHERE a.company_id = _company_id
      AND a.date >= _month_start
      AND a.status = 'completed'
      AND (NOT _is_employee OR a.professional_id = _prof_id)
  ),
  rev_last_month AS (
    SELECT COALESCE(SUM(s.price), 0) AS v
    FROM public.appointments a
    JOIN public.services s ON s.id = a.service_id
    WHERE a.company_id = _company_id
      AND a.date BETWEEN _last_month_start AND _last_month_end
      AND a.status = 'completed'
      AND (NOT _is_employee OR a.professional_id = _prof_id)
  ),
  appts_today AS (
    SELECT COUNT(*) AS n
    FROM public.appointments
    WHERE company_id = _company_id
      AND date = _today
      AND status NOT IN ('cancelled')
      AND (NOT _is_employee OR professional_id = _prof_id)
  ),
  slots_today AS (
    SELECT COUNT(*) AS n FROM public.working_hours
    WHERE company_id = _company_id
      AND day_of_week = EXTRACT(DOW FROM _today)::INT
      AND is_available = true
      AND (NOT _is_employee OR professional_id = _prof_id)
  ),
  new_clients AS (
    SELECT COUNT(*) AS n FROM public.clients
    WHERE company_id = _company_id AND created_at >= _month_start
  ),
  no_show AS (
    SELECT
      CASE WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'no_show')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      END AS rate
    FROM public.appointments
    WHERE company_id = _company_id
      AND date >= _month_start
      AND (NOT _is_employee OR professional_id = _prof_id)
  ),
  ranking AS (
    SELECT prof_id, ROW_NUMBER() OVER (ORDER BY total DESC) AS pos, total_count
    FROM (
      SELECT a.professional_id AS prof_id,
             COALESCE(SUM(s.price), 0) AS total,
             COUNT(*) AS total_count
      FROM public.appointments a
      JOIN public.services s ON s.id = a.service_id
      WHERE a.company_id = _company_id
        AND a.date >= _month_start
        AND a.status = 'completed'
        AND a.professional_id IS NOT NULL
      GROUP BY a.professional_id
    ) q
  ),
  total_profs AS (
    SELECT COUNT(*) AS n FROM public.professionals
    WHERE company_id = _company_id AND active = true
  )
  SELECT jsonb_build_object(
    'revenue_today', CASE WHEN _hide_finance THEN 0 ELSE (SELECT v FROM rev_today) END,
    'revenue_yesterday', CASE WHEN _hide_finance THEN 0 ELSE (SELECT v FROM rev_yesterday) END,
    'revenue_month', CASE WHEN _hide_finance THEN 0 ELSE (SELECT v FROM rev_month) END,
    'revenue_last_month', CASE WHEN _hide_finance THEN 0 ELSE (SELECT v FROM rev_last_month) END,
    'avg_ticket_month', CASE
      WHEN _hide_finance THEN 0
      WHEN (SELECT n FROM rev_month) = 0 THEN 0
      ELSE ROUND((SELECT v FROM rev_month) / (SELECT n FROM rev_month), 2)
    END,
    'commission_month', CASE
      WHEN _is_employee THEN ROUND((SELECT v FROM rev_month) * _commission / 100.0, 2)
      ELSE 0
    END,
    'commission_percent', _commission,
    'appointments_today', (SELECT n FROM appts_today),
    'appointments_total_slots', (SELECT n FROM slots_today),
    'new_clients_this_month', (SELECT n FROM new_clients),
    'no_show_rate_month', (SELECT rate FROM no_show),
    'my_rank', CASE WHEN _is_employee THEN
      (SELECT pos FROM ranking WHERE prof_id = _prof_id) ELSE NULL END,
    'total_professionals', (SELECT n FROM total_profs),
    'my_appointments_month', CASE WHEN _is_employee THEN
      (SELECT total_count FROM ranking WHERE prof_id = _prof_id) ELSE NULL END,
    'is_finance_hidden', _hide_finance
  ) INTO _result;

  RETURN _result;
END;
$$;

-- =====================================================================
-- 4) get_revenue_chart_data
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_revenue_chart_data(
  _company_id UUID,
  _days INTEGER DEFAULT 30,
  _user_id UUID DEFAULT NULL
)
RETURNS TABLE(d DATE, revenue NUMERIC, appointments_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _is_employee BOOLEAN := false;
  _is_secretary BOOLEAN := false;
  _prof_id UUID;
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  _is_employee := public.has_role(auth.uid(), 'employee'::app_role)
                  AND NOT public.has_role(auth.uid(), 'company_admin'::app_role);
  _is_secretary := public.has_role(auth.uid(), 'secretary'::app_role)
                   AND NOT public.has_role(auth.uid(), 'company_admin'::app_role);

  IF _is_employee THEN
    SELECT id INTO _prof_id FROM public.professionals
    WHERE company_id = _company_id AND user_id = COALESCE(_user_id, auth.uid()) LIMIT 1;
  END IF;

  RETURN QUERY
  WITH series AS (
    SELECT generate_series(
      (CURRENT_DATE - (_days - 1))::DATE,
      CURRENT_DATE,
      '1 day'::interval
    )::DATE AS day
  )
  SELECT s.day,
    CASE WHEN _is_secretary THEN 0::NUMERIC
         ELSE COALESCE(SUM(sv.price), 0) END,
    COUNT(a.id)
  FROM series s
  LEFT JOIN public.appointments a
    ON a.date = s.day
   AND a.company_id = _company_id
   AND a.status = 'completed'
   AND (NOT _is_employee OR a.professional_id = _prof_id)
  LEFT JOIN public.services sv ON sv.id = a.service_id
  GROUP BY s.day
  ORDER BY s.day;
END;
$$;

-- =====================================================================
-- 5) get_top_services
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_top_services(
  _company_id UUID,
  _limit INTEGER DEFAULT 5
)
RETURNS TABLE(service_id UUID, name TEXT, count BIGINT, revenue NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.id, s.name, COUNT(a.id), COALESCE(SUM(s.price), 0)
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  WHERE a.company_id = _company_id
    AND a.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
    AND a.status = 'completed'
  GROUP BY s.id, s.name
  ORDER BY COALESCE(SUM(s.price), 0) DESC
  LIMIT _limit;
END;
$$;

-- =====================================================================
-- 6) get_heatmap_data — last 30 days, dow x hour
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_heatmap_data(_company_id UUID)
RETURNS TABLE(dow INT, hour INT, count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT EXTRACT(DOW FROM a.date)::INT,
         EXTRACT(HOUR FROM a.start_time)::INT,
         COUNT(*)
  FROM public.appointments a
  WHERE a.company_id = _company_id
    AND a.date >= (CURRENT_DATE - 30)
    AND a.status IN ('completed', 'confirmed', 'scheduled')
  GROUP BY 1, 2
  ORDER BY 1, 2;
END;
$$;

-- =====================================================================
-- 7) get_professional_ranking
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_professional_ranking(_company_id UUID)
RETURNS TABLE(
  professional_id UUID,
  name TEXT,
  appointments_count BIGINT,
  revenue NUMERIC,
  no_show_rate NUMERIC,
  avg_ticket NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _hide_finance BOOLEAN;
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  _hide_finance := public.has_role(auth.uid(), 'secretary'::app_role)
                   AND NOT public.has_role(auth.uid(), 'company_admin'::app_role)
                   AND NOT public.has_role(auth.uid(), 'super_admin'::app_role);

  RETURN QUERY
  WITH base AS (
    SELECT p.id AS pid, p.name AS pname,
      COUNT(a.id) FILTER (WHERE a.status = 'completed' AND a.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE) AS done_count,
      COALESCE(SUM(s.price) FILTER (WHERE a.status = 'completed' AND a.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE), 0) AS rev,
      COUNT(a.id) FILTER (WHERE a.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE) AS total_count,
      COUNT(a.id) FILTER (WHERE a.status = 'no_show' AND a.date >= DATE_TRUNC('month', CURRENT_DATE)::DATE) AS no_show_count
    FROM public.professionals p
    LEFT JOIN public.appointments a ON a.professional_id = p.id AND a.company_id = _company_id
    LEFT JOIN public.services s ON s.id = a.service_id
    WHERE p.company_id = _company_id AND p.active = true
    GROUP BY p.id, p.name
  )
  SELECT b.pid, b.pname, b.done_count,
    CASE WHEN _hide_finance THEN 0 ELSE b.rev END,
    CASE WHEN b.total_count = 0 THEN 0
         ELSE ROUND((b.no_show_count::NUMERIC / b.total_count::NUMERIC) * 100, 2) END,
    CASE WHEN _hide_finance OR b.done_count = 0 THEN 0
         ELSE ROUND(b.rev / b.done_count, 2) END
  FROM base b
  ORDER BY b.rev DESC, b.done_count DESC;
END;
$$;

-- =====================================================================
-- 8) get_client_retention_metrics — last 6 months
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_client_retention_metrics(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _result JSONB;
  _hide_finance BOOLEAN;
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  _hide_finance := public.has_role(auth.uid(), 'secretary'::app_role)
                   AND NOT public.has_role(auth.uid(), 'company_admin'::app_role)
                   AND NOT public.has_role(auth.uid(), 'super_admin'::app_role);

  WITH months AS (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
      DATE_TRUNC('month', CURRENT_DATE),
      '1 month'::interval
    )::DATE AS m
  ),
  client_first AS (
    SELECT client_id, MIN(date) AS first_date
    FROM public.appointments
    WHERE company_id = _company_id AND status = 'completed'
    GROUP BY client_id
  ),
  monthly AS (
    SELECT m.m AS month,
      COUNT(DISTINCT a.client_id) FILTER (WHERE cf.first_date >= m.m AND cf.first_date < (m.m + INTERVAL '1 month')) AS new_clients,
      COUNT(DISTINCT a.client_id) FILTER (WHERE cf.first_date < m.m) AS returning_clients
    FROM months m
    LEFT JOIN public.appointments a
      ON a.company_id = _company_id
     AND a.date >= m.m AND a.date < (m.m + INTERVAL '1 month')
     AND a.status = 'completed'
    LEFT JOIN client_first cf ON cf.client_id = a.client_id
    GROUP BY m.m
    ORDER BY m.m
  ),
  ltv AS (
    SELECT COALESCE(AVG(per_client), 0) AS avg_ltv
    FROM (
      SELECT a.client_id, SUM(s.price) AS per_client
      FROM public.appointments a
      JOIN public.services s ON s.id = a.service_id
      WHERE a.company_id = _company_id AND a.status = 'completed'
      GROUP BY a.client_id
    ) q
  ),
  retention AS (
    SELECT
      COUNT(DISTINCT client_id) FILTER (WHERE date >= CURRENT_DATE - 90) AS active_90d,
      COUNT(DISTINCT client_id) AS total_ever
    FROM public.appointments
    WHERE company_id = _company_id AND status = 'completed'
  )
  SELECT jsonb_build_object(
    'monthly', COALESCE(jsonb_agg(jsonb_build_object(
      'month', to_char(month, 'YYYY-MM'),
      'new_clients', new_clients,
      'returning_clients', returning_clients
    )), '[]'::jsonb),
    'avg_ltv', CASE WHEN _hide_finance THEN 0 ELSE ROUND((SELECT avg_ltv FROM ltv)::NUMERIC, 2) END,
    'active_clients', (SELECT active_90d FROM retention),
    'retention_rate', CASE
      WHEN (SELECT total_ever FROM retention) = 0 THEN 0
      ELSE ROUND(((SELECT active_90d FROM retention)::NUMERIC / (SELECT total_ever FROM retention)::NUMERIC) * 100, 2)
    END
  )
  INTO _result FROM monthly;

  RETURN _result;
END;
$$;

-- =====================================================================
-- 9) get_at_risk_clients
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_at_risk_clients(
  _company_id UUID,
  _days_threshold INTEGER DEFAULT 60
)
RETURNS TABLE(
  client_id UUID,
  name TEXT,
  phone TEXT,
  last_visit DATE,
  days_since INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.user_in_company(_company_id) THEN
    RAISE EXCEPTION 'Sem permissão' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH last AS (
    SELECT a.client_id, MAX(a.date) AS last_date
    FROM public.appointments a
    WHERE a.company_id = _company_id AND a.status = 'completed'
    GROUP BY a.client_id
  )
  SELECT c.id, c.name, c.phone, l.last_date,
         (CURRENT_DATE - l.last_date)::INT
  FROM public.clients c
  JOIN last l ON l.client_id = c.id
  WHERE c.company_id = _company_id
    AND c.active = true
    AND (CURRENT_DATE - l.last_date) >= _days_threshold
  ORDER BY l.last_date ASC
  LIMIT 50;
END;
$$;