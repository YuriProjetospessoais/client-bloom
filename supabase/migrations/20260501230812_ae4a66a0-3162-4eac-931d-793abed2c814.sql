CREATE TABLE IF NOT EXISTS public.terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  terms_version TEXT NOT NULL DEFAULT 'v1',
  ip_address INET,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptance_user ON public.terms_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptance_email ON public.terms_acceptance(lower(email));

ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own acceptance"
ON public.terms_acceptance FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins manage all acceptances"
ON public.terms_acceptance FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "No direct inserts"
ON public.terms_acceptance FOR INSERT TO authenticated
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.record_terms_acceptance(
  _email TEXT,
  _terms_version TEXT DEFAULT 'v1'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.terms_acceptance (
    user_id, email, terms_version, ip_address, user_agent
  ) VALUES (
    auth.uid(),
    lower(trim(_email)),
    COALESCE(_terms_version, 'v1'),
    NULLIF(split_part(public.get_request_header('x-forwarded-for'), ',', 1), '')::INET,
    public.get_request_header('user-agent')
  )
  RETURNING id INTO _id;
  RETURN _id;
EXCEPTION WHEN OTHERS THEN
  -- Don't break signup if logging fails
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_terms_acceptance(TEXT, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.record_terms_acceptance(TEXT, TEXT) TO authenticated;