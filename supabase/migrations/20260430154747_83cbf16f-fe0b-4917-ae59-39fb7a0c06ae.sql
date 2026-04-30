
-- 1. Add referral fields to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_payment_at TIMESTAMPTZ;

-- 2. Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
  _exists BOOLEAN;
  _attempts INT := 0;
BEGIN
  LOOP
    _code := 'BARBER-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE referral_code = _code) INTO _exists;
    EXIT WHEN NOT _exists OR _attempts > 10;
    _attempts := _attempts + 1;
  END LOOP;
  RETURN _code;
END;
$$;

-- 3. Trigger to auto-assign referral_code on insert
CREATE OR REPLACE FUNCTION public.set_referral_code_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_set_referral_code ON public.companies;
CREATE TRIGGER trg_companies_set_referral_code
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_referral_code_on_insert();

-- 4. Backfill referral codes for existing companies
UPDATE public.companies
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;

-- 5. Make referral_code NOT NULL after backfill
ALTER TABLE public.companies
  ALTER COLUMN referral_code SET NOT NULL;

-- 6. Referral credits table
CREATE TYPE referral_credit_status AS ENUM ('pending', 'available', 'applied', 'expired');

CREATE TABLE public.referral_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referred_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL DEFAULT 5000,
  status referral_credit_status NOT NULL DEFAULT 'pending',
  available_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '180 days'),
  applied_invoice_id TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (company_id <> referred_company_id),
  CONSTRAINT unique_referral UNIQUE (company_id, referred_company_id)
);

CREATE INDEX idx_referral_credits_company ON public.referral_credits(company_id, status);
CREATE INDEX idx_referral_credits_referred ON public.referral_credits(referred_company_id);

CREATE TRIGGER update_referral_credits_updated_at
  BEFORE UPDATE ON public.referral_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RLS
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins view own referral credits"
ON public.referral_credits FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Super admins manage all referral credits"
ON public.referral_credits FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Block all direct writes from clients (only edge functions via service_role)
CREATE POLICY "No direct client writes to referral_credits"
ON public.referral_credits FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct client updates to referral_credits"
ON public.referral_credits FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 8. Get available balance (in cents)
CREATE OR REPLACE FUNCTION public.get_referral_balance(_company_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount_cents), 0)::INTEGER
  FROM public.referral_credits
  WHERE company_id = _company_id
    AND status = 'available'
    AND expires_at > now();
$$;

-- 9. Apply referral on signup (called by onboarding edge function)
CREATE OR REPLACE FUNCTION public.apply_referral_on_signup(_code TEXT, _new_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer_id UUID;
BEGIN
  IF _code IS NULL OR _code = '' THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'no_code');
  END IF;

  SELECT id INTO _referrer_id
  FROM public.companies
  WHERE referral_code = upper(_code)
  LIMIT 1;

  IF _referrer_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'invalid_code');
  END IF;

  IF _referrer_id = _new_company_id THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'self_referral');
  END IF;

  -- Link new company to referrer
  UPDATE public.companies
  SET referred_by_company_id = _referrer_id
  WHERE id = _new_company_id
    AND referred_by_company_id IS NULL;

  -- Create pending credit (waits for first payment)
  INSERT INTO public.referral_credits (company_id, referred_company_id, amount_cents, status)
  VALUES (_referrer_id, _new_company_id, 5000, 'pending')
  ON CONFLICT (company_id, referred_company_id) DO NOTHING;

  RETURN jsonb_build_object('applied', true, 'referrer_id', _referrer_id);
END;
$$;

-- 10. Release credits on first payment (called by Stripe webhook in Phase 3)
CREATE OR REPLACE FUNCTION public.mark_first_payment_and_release_credits(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _already_paid TIMESTAMPTZ;
  _released INT := 0;
BEGIN
  SELECT first_payment_at INTO _already_paid
  FROM public.companies WHERE id = _company_id;

  -- Idempotent: only run once
  IF _already_paid IS NOT NULL THEN
    RETURN jsonb_build_object('released', false, 'reason', 'already_marked');
  END IF;

  UPDATE public.companies
  SET first_payment_at = now()
  WHERE id = _company_id;

  -- Release all pending credits owed to this company's referrer
  UPDATE public.referral_credits
  SET status = 'available',
      available_at = now()
  WHERE referred_company_id = _company_id
    AND status = 'pending'
    AND expires_at > now();

  GET DIAGNOSTICS _released = ROW_COUNT;
  RETURN jsonb_build_object('released', true, 'credits_released', _released);
END;
$$;

-- 11. Audit trigger
CREATE TRIGGER audit_referral_credits
  AFTER INSERT OR UPDATE OR DELETE ON public.referral_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_table_changes();
