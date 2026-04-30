-- Add trial_ends_at to companies (default 14 days from creation)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days');

-- View of users without any role (limbo accounts)
CREATE OR REPLACE VIEW public.orphan_users AS
SELECT
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL
  AND u.deleted_at IS NULL;

GRANT SELECT ON public.orphan_users TO authenticated;