-- 1) Tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  company_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- 2) RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admins veem tudo
CREATE POLICY "Super admins view all audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Company admins veem logs da própria empresa
CREATE POLICY "Company admins view own company audit logs"
ON public.audit_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Bloqueia INSERT/UPDATE/DELETE direto via API (somente via funções SECURITY DEFINER)
CREATE POLICY "No direct writes to audit_logs"
ON public.audit_logs
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 3) Função pública para registrar eventos manualmente (login/logout)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action TEXT,
  _resource_type TEXT DEFAULT NULL,
  _resource_id UUID DEFAULT NULL,
  _details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
  _uid UUID := auth.uid();
  _email TEXT;
  _company UUID;
BEGIN
  IF _uid IS NOT NULL THEN
    SELECT email INTO _email FROM auth.users WHERE id = _uid;
    _company := public.get_user_company_id(_uid);
  END IF;

  INSERT INTO public.audit_logs (
    user_id, user_email, company_id, action, resource_type, resource_id,
    ip_address, user_agent, details
  )
  VALUES (
    _uid,
    COALESCE(_email, _details->>'email'),
    _company,
    _action,
    _resource_type,
    _resource_id,
    NULLIF(public.get_request_header('x-forwarded-for'), '')::INET,
    public.get_request_header('user-agent'),
    COALESCE(_details, '{}'::jsonb)
  )
  RETURNING id INTO _id;

  RETURN _id;
EXCEPTION WHEN OTHERS THEN
  -- Nunca quebrar a operação principal por erro de auditoria
  RETURN NULL;
END;
$$;

-- 4) Trigger genérico para registrar mudanças em tabelas críticas
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action TEXT;
  _resource_id UUID;
  _company UUID;
  _details JSONB;
  _uid UUID := auth.uid();
  _email TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'CREATE_' || UPPER(TG_TABLE_NAME);
    _resource_id := (to_jsonb(NEW)->>'id')::UUID;
    _company := NULLIF(to_jsonb(NEW)->>'company_id', '')::UUID;
    _details := jsonb_build_object('new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'DELETE_' || UPPER(TG_TABLE_NAME);
    _resource_id := (to_jsonb(OLD)->>'id')::UUID;
    _company := NULLIF(to_jsonb(OLD)->>'company_id', '')::UUID;
    _details := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'UPDATE_' || UPPER(TG_TABLE_NAME);
    _resource_id := (to_jsonb(NEW)->>'id')::UUID;
    _company := NULLIF(to_jsonb(NEW)->>'company_id', '')::UUID;
    _details := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  IF _uid IS NOT NULL THEN
    SELECT email INTO _email FROM auth.users WHERE id = _uid;
  END IF;

  INSERT INTO public.audit_logs (
    user_id, user_email, company_id, action, resource_type, resource_id,
    ip_address, user_agent, details
  )
  VALUES (
    _uid, _email, _company, _action, TG_TABLE_NAME, _resource_id,
    NULLIF(public.get_request_header('x-forwarded-for'), '')::INET,
    public.get_request_header('user-agent'),
    _details
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- 5) Aplica triggers nas tabelas críticas

-- user_roles: registra TODAS as mudanças (atribuição, alteração e remoção de papéis)
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- clients: registra criação e exclusão
DROP TRIGGER IF EXISTS audit_clients_changes ON public.clients;
CREATE TRIGGER audit_clients_changes
AFTER INSERT OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- appointments: registra criação e exclusão
DROP TRIGGER IF EXISTS audit_appointments_changes ON public.appointments;
CREATE TRIGGER audit_appointments_changes
AFTER INSERT OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- products: registra criação e exclusão
DROP TRIGGER IF EXISTS audit_products_changes ON public.products;
CREATE TRIGGER audit_products_changes
AFTER INSERT OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- companies: registra mudanças (importante para alterações de plano/status)
DROP TRIGGER IF EXISTS audit_companies_changes ON public.companies;
CREATE TRIGGER audit_companies_changes
AFTER UPDATE OR DELETE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();