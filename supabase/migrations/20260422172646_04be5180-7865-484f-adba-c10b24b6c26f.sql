-- Enum para status de oportunidades de venda (CRM/Leads)
DO $$ BEGIN
  CREATE TYPE public.opportunity_status AS ENUM ('lead', 'contacted', 'qualified', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela de oportunidades (CRM / Leads)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.opportunity_status NOT NULL DEFAULT 'lead',
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  source TEXT,
  assigned_to UUID,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  next_action_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_company ON public.opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_client ON public.opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(company_id, status);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- RLS: super_admin gerencia tudo
CREATE POLICY "Super admins manage all opportunities"
ON public.opportunities
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: company_admin gerencia oportunidades da própria empresa
CREATE POLICY "Company admins manage opportunities"
ON public.opportunities
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- RLS: secretárias gerenciam oportunidades da empresa
CREATE POLICY "Secretaries manage opportunities"
ON public.opportunities
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'secretary'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- RLS: employees apenas visualizam oportunidades da empresa
CREATE POLICY "Employees view company opportunities"
ON public.opportunities
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'employee'::app_role)
  AND company_id = public.get_user_company_id(auth.uid())
);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();