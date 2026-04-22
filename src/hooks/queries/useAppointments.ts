import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { queryKeys } from './keys';
import { useTenantId } from './useTenantId';

export type Appointment = Tables<'appointments'>;

export function useAppointments() {
  const companyId = useTenantId();
  return useQuery({
    queryKey: companyId ? queryKeys.appointments.all(companyId) : ['appointments', 'no-tenant'],
    enabled: !!companyId,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId!)
        .order('date', { ascending: false })
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAppointmentsByDate(date: string | null | undefined) {
  const companyId = useTenantId();
  return useQuery({
    queryKey: companyId && date
      ? queryKeys.appointments.byDate(companyId, date)
      : ['appointments', 'no-date'],
    enabled: !!companyId && !!date,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId!)
        .eq('date', date!)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAppointmentsByRange(from: string | null, to: string | null) {
  const companyId = useTenantId();
  return useQuery({
    queryKey: companyId && from && to
      ? queryKeys.appointments.byRange(companyId, from, to)
      : ['appointments', 'no-range'],
    enabled: !!companyId && !!from && !!to,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId!)
        .gte('date', from!)
        .lte('date', to!)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}