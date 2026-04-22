import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/hooks/queries/keys';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { showMutationError, showMutationSuccess } from './_shared';

type AppointmentInsert = Omit<TablesInsert<'appointments'>, 'company_id'>;
type AppointmentUpdate = TablesUpdate<'appointments'>;

export function useCreateAppointment() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (input: AppointmentInsert) => {
      if (!companyId) throw new Error('Empresa não identificada.');
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...input, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.appointments.all(companyId) });
      showMutationSuccess('Agendamento criado.')();
    },
    onError: showMutationError('Não foi possível criar o agendamento.'),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: AppointmentUpdate }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.appointments.all(companyId) });
      showMutationSuccess('Agendamento atualizado.')();
    },
    onError: showMutationError('Não foi possível atualizar o agendamento.'),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.appointments.all(companyId) });
      showMutationSuccess('Agendamento removido.')();
    },
    onError: showMutationError('Não foi possível remover o agendamento.'),
  });
}