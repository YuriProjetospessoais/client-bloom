import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/hooks/queries/keys';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { showMutationError, showMutationSuccess } from './_shared';

type ClientInsert = Omit<TablesInsert<'clients'>, 'company_id'>;
type ClientUpdate = TablesUpdate<'clients'>;

export function useCreateClient() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (input: ClientInsert) => {
      if (!companyId) throw new Error('Empresa não identificada.');
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...input, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.clients.all(companyId) });
      showMutationSuccess('Cliente cadastrado.')();
    },
    onError: showMutationError('Não foi possível cadastrar o cliente.'),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ClientUpdate }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.clients.all(companyId) });
      showMutationSuccess('Cliente atualizado.')();
    },
    onError: showMutationError('Não foi possível atualizar o cliente.'),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.clients.all(companyId) });
      showMutationSuccess('Cliente removido.')();
    },
    onError: showMutationError('Não foi possível remover o cliente.'),
  });
}