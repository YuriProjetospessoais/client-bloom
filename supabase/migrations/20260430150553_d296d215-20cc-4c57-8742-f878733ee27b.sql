-- Drop the insecure view
DROP VIEW IF EXISTS public.orphan_users;

-- Replace with a security-definer function that gates by super_admin role
CREATE OR REPLACE FUNCTION public.get_orphan_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::TEXT, u.created_at, u.email_confirmed_at
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE ur.id IS NULL
    AND u.deleted_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_orphan_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_orphan_users() TO authenticated;