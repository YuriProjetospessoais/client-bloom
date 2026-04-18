
-- Tabela para rastrear tentativas de login (anti brute-force)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked ON public.login_attempts(blocked_until) WHERE blocked_until IS NOT NULL;

-- RLS: ninguém acessa diretamente; só Edge Functions com service role
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Política restritiva: nenhum acesso para clientes anon/authenticated
CREATE POLICY "No direct client access to login_attempts"
ON public.login_attempts
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Função: registra tentativa falha e retorna estado de bloqueio
CREATE OR REPLACE FUNCTION public.record_failed_login(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_attempts INTEGER := 5;
  _window_minutes INTEGER := 15;
  _block_minutes INTEGER := 30;
  _row public.login_attempts%ROWTYPE;
  _normalized TEXT := LOWER(TRIM(_email));
BEGIN
  IF _normalized IS NULL OR _normalized = '' THEN
    RETURN jsonb_build_object('blocked', false, 'attempts', 0);
  END IF;

  SELECT * INTO _row FROM public.login_attempts WHERE LOWER(email) = _normalized;

  IF NOT FOUND THEN
    INSERT INTO public.login_attempts (email, attempt_count, last_attempt_at)
    VALUES (_normalized, 1, now());
    RETURN jsonb_build_object('blocked', false, 'attempts', 1, 'remaining', _max_attempts - 1);
  END IF;

  -- Se ainda bloqueado, retorna bloqueado
  IF _row.blocked_until IS NOT NULL AND _row.blocked_until > now() THEN
    RETURN jsonb_build_object(
      'blocked', true,
      'attempts', _row.attempt_count,
      'minutes_remaining', CEIL(EXTRACT(EPOCH FROM (_row.blocked_until - now())) / 60.0)
    );
  END IF;

  -- Se janela expirou, reseta
  IF _row.last_attempt_at < (now() - (_window_minutes || ' minutes')::INTERVAL) THEN
    UPDATE public.login_attempts
    SET attempt_count = 1, last_attempt_at = now(), blocked_until = NULL, updated_at = now()
    WHERE id = _row.id;
    RETURN jsonb_build_object('blocked', false, 'attempts', 1, 'remaining', _max_attempts - 1);
  END IF;

  -- Incrementa
  UPDATE public.login_attempts
  SET
    attempt_count = _row.attempt_count + 1,
    last_attempt_at = now(),
    blocked_until = CASE
      WHEN _row.attempt_count + 1 >= _max_attempts THEN now() + (_block_minutes || ' minutes')::INTERVAL
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = _row.id
  RETURNING * INTO _row;

  IF _row.blocked_until IS NOT NULL AND _row.blocked_until > now() THEN
    RETURN jsonb_build_object(
      'blocked', true,
      'attempts', _row.attempt_count,
      'minutes_remaining', _block_minutes
    );
  END IF;

  RETURN jsonb_build_object(
    'blocked', false,
    'attempts', _row.attempt_count,
    'remaining', GREATEST(0, _max_attempts - _row.attempt_count)
  );
END;
$$;

-- Função: verifica se email está bloqueado (sem incrementar)
CREATE OR REPLACE FUNCTION public.check_login_blocked(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.login_attempts%ROWTYPE;
  _normalized TEXT := LOWER(TRIM(_email));
BEGIN
  SELECT * INTO _row FROM public.login_attempts WHERE LOWER(email) = _normalized;
  IF NOT FOUND OR _row.blocked_until IS NULL OR _row.blocked_until <= now() THEN
    RETURN jsonb_build_object('blocked', false);
  END IF;
  RETURN jsonb_build_object(
    'blocked', true,
    'minutes_remaining', CEIL(EXTRACT(EPOCH FROM (_row.blocked_until - now())) / 60.0)
  );
END;
$$;

-- Função: reseta tentativas após login bem-sucedido
CREATE OR REPLACE FUNCTION public.reset_login_attempts(_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE LOWER(email) = LOWER(TRIM(_email));
END;
$$;
