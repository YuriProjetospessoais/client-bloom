-- Prevent double booking (race condition) for same company+professional+date

create or replace function public.prevent_double_booking()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  _lock_key int;
begin
  -- Only enforce when a professional is selected
  if new.professional_id is null then
    return new;
  end if;

  -- Cancelled appointments shouldn't block slots
  if new.status = 'cancelled'::appointment_status then
    return new;
  end if;

  -- Serialize booking attempts for same company+professional+date within the transaction
  _lock_key := hashtext(new.company_id::text || ':' || new.professional_id::text || ':' || new.date::text);
  perform pg_advisory_xact_lock(_lock_key);

  -- Overlap check against active appointments
  if exists (
    select 1
    from public.appointments a
    where a.company_id = new.company_id
      and a.professional_id = new.professional_id
      and a.date = new.date
      and a.status in ('scheduled'::appointment_status, 'confirmed'::appointment_status)
      and (a.start_time, a.end_time) overlaps (new.start_time, new.end_time)
      and a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception using
      errcode = '23505',
      message = 'Horário indisponível: já existe um agendamento nesse intervalo.';
  end if;

  return new;
end;
$$;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON public.appointments;

create trigger trg_prevent_double_booking
before insert or update of company_id, professional_id, date, start_time, end_time, status
on public.appointments
for each row
execute function public.prevent_double_booking();
