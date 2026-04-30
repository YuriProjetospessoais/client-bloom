-- Status enum for payouts
CREATE TYPE public.payout_status AS ENUM ('pending', 'paid', 'rejected');

-- Payout requests table
CREATE TABLE public.referral_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status public.payout_status NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  pix_key TEXT,
  pix_key_type TEXT,
  notes TEXT,
  admin_notes TEXT,
  receipt_url TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  paid_by UUID,
  credit_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_payouts_company ON public.referral_payouts(company_id);
CREATE INDEX idx_referral_payouts_status ON public.referral_payouts(status);

ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins view own payouts"
ON public.referral_payouts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Super admins manage all payouts"
ON public.referral_payouts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "No direct writes to payouts"
ON public.referral_payouts FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct updates to payouts"
ON public.referral_payouts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_referral_payouts_updated_at
BEFORE UPDATE ON public.referral_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add 'requested' status to existing referral_credits (for credits awaiting payout)
ALTER TYPE public.referral_credit_status ADD VALUE IF NOT EXISTS 'requested';

-- Function: company admin requests payout
CREATE OR REPLACE FUNCTION public.request_referral_payout(
  _pix_key TEXT,
  _pix_key_type TEXT,
  _notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _credit_ids UUID[];
  _total_cents INTEGER;
  _payout_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'company_admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores da barbearia podem solicitar resgate.' USING ERRCODE = '42501';
  END IF;

  _company_id := public.get_user_company_id(auth.uid());
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não identificada.';
  END IF;

  IF _pix_key IS NULL OR length(trim(_pix_key)) = 0 THEN
    RAISE EXCEPTION 'Chave Pix obrigatória.';
  END IF;

  -- Lock and gather available credits
  SELECT array_agg(id), COALESCE(SUM(amount_cents), 0)::INTEGER
  INTO _credit_ids, _total_cents
  FROM public.referral_credits
  WHERE company_id = _company_id
    AND status = 'available'
    AND expires_at > now()
  FOR UPDATE;

  IF _credit_ids IS NULL OR _total_cents <= 0 THEN
    RAISE EXCEPTION 'Sem saldo disponível para resgate.';
  END IF;

  -- Mark credits as requested
  UPDATE public.referral_credits
  SET status = 'requested', updated_at = now()
  WHERE id = ANY(_credit_ids);

  -- Create payout record
  INSERT INTO public.referral_payouts (
    company_id, amount_cents, pix_key, pix_key_type, notes, credit_ids
  ) VALUES (
    _company_id, _total_cents, trim(_pix_key), _pix_key_type, _notes, _credit_ids
  )
  RETURNING id INTO _payout_id;

  RETURN jsonb_build_object('payout_id', _payout_id, 'amount_cents', _total_cents, 'credits_count', array_length(_credit_ids, 1));
END;
$$;

-- Function: super admin marks payout as paid
CREATE OR REPLACE FUNCTION public.mark_payout_paid(
  _payout_id UUID,
  _receipt_url TEXT DEFAULT NULL,
  _admin_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payout public.referral_payouts%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas super_admin pode marcar pagamentos.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _payout FROM public.referral_payouts WHERE id = _payout_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Resgate não encontrado.'; END IF;
  IF _payout.status <> 'pending' THEN RAISE EXCEPTION 'Resgate já processado.'; END IF;

  UPDATE public.referral_payouts
  SET status = 'paid',
      paid_at = now(),
      paid_by = auth.uid(),
      receipt_url = _receipt_url,
      admin_notes = _admin_notes
  WHERE id = _payout_id;

  -- Mark linked credits as applied
  UPDATE public.referral_credits
  SET status = 'applied',
      applied_at = now(),
      applied_invoice_id = 'payout:' || _payout_id::text
  WHERE id = ANY(_payout.credit_ids);

  RETURN jsonb_build_object('paid', true, 'amount_cents', _payout.amount_cents);
END;
$$;

-- Function: super admin rejects payout (restores credits)
CREATE OR REPLACE FUNCTION public.reject_payout(
  _payout_id UUID,
  _reason TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payout public.referral_payouts%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas super_admin pode rejeitar.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _payout FROM public.referral_payouts WHERE id = _payout_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Resgate não encontrado.'; END IF;
  IF _payout.status <> 'pending' THEN RAISE EXCEPTION 'Resgate já processado.'; END IF;

  UPDATE public.referral_payouts
  SET status = 'rejected', admin_notes = _reason, paid_by = auth.uid()
  WHERE id = _payout_id;

  -- Restore credits
  UPDATE public.referral_credits
  SET status = 'available', updated_at = now()
  WHERE id = ANY(_payout.credit_ids) AND status = 'requested';

  RETURN jsonb_build_object('rejected', true);
END;
$$;

-- Helper: find company by admin email (for Kiwify webhook)
CREATE OR REPLACE FUNCTION public.find_company_by_admin_email(_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _normalized TEXT := lower(trim(_email));
BEGIN
  SELECT ur.company_id INTO _company_id
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE lower(u.email) = _normalized
    AND ur.role = 'company_admin'::app_role
    AND ur.company_id IS NOT NULL
  ORDER BY ur.created_at ASC
  LIMIT 1;
  RETURN _company_id;
END;
$$;