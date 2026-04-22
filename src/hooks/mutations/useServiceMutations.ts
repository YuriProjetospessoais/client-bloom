import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/hooks/queries/keys';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { showMutationError, showMutationSuccess } from './_shared';

type ServiceInsert = Omit<TablesInsert<'services'>, 'company_id'>;
type ServiceUpdate = TablesUpdate<'services'>;

export function useCreateService() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (input: ServiceInsert) => {
      if (!companyId) throw new Error('Empresa não identificada.');
      const { data, error } = await supabase
        .from('services')
        .insert({ ...input, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.services.all(companyId) });
      showMutationSuccess('Serviço criado.')();
    },
    onError: showMutationError('Não foi possível criar o serviço.'),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ServiceUpdate }) => {
      const { data, error } = await supabase
        .from('services')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.services.all(companyId) });
      showMutationSuccess('Serviço atualizado.')();
    },
    onError: showMutationError('Não foi possível atualizar o serviço.'),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.services.all(companyId) });
      showMutationSuccess('Serviço removido.')();
    },
    onError: showMutationError('Não foi possível remover o serviço.'),
  });
}