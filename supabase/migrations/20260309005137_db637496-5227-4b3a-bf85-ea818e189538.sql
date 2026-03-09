-- Tighten public RLS to prevent cross-tenant reads on public endpoints

-- 1) Helper: read a request header (PostgREST/Supabase sets request.headers)
create or replace function public.get_request_header(_name text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    (current_setting('request.headers', true)::jsonb ->> lower(_name))
  , '')
$$;

-- 2) Helper: map request tenant slug -> company_id (only active companies)
create or replace function public.get_public_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.companies c
  where c.slug = public.get_request_header('x-company-slug')
    and c.status = 'active'::company_status
  limit 1
$$;

-- 3) SERVICES: replace overly-permissive public policy
DROP POLICY IF EXISTS "Public can view active services" ON public.services;

create policy "Public can view active services for requested company"
on public.services
for select
to anon
using (
  active = true
  and company_id = public.get_public_company_id()
);

-- 4) PROFESSIONALS: replace overly-permissive public policy
DROP POLICY IF EXISTS "Public can view active professionals" ON public.professionals;

create policy "Public can view active professionals for requested company"
on public.professionals
for select
to anon
using (
  active = true
  and company_id = public.get_public_company_id()
);

-- 5) WORKING HOURS: replace overly-permissive public policy
DROP POLICY IF EXISTS "Public can view working hours" ON public.working_hours;

create policy "Public can view working hours for requested company"
on public.working_hours
for select
to anon
using (
  is_available = true
  and company_id = public.get_public_company_id()
);
