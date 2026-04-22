import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/hooks/queries/keys';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { useAuth } from '@/lib/auth/AuthContext';
import { showMutationError, showMutationSuccess } from './_shared';

type OpportunityInsert = Omit<TablesInsert<'opportunities'>, 'company_id' | 'created_by'>;
type OpportunityUpdate = TablesUpdate<'opportunities'>;

export function useCreateOpportunity() {
  const qc = useQueryClient();
  const companyId = useTenantId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: OpportunityInsert) => {
      if (!companyId) throw new Error('Empresa não identificada.');
      const { data, error } = await supabase
        .from('opportunities')
        .insert({ ...input, company_id: companyId, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.opportunities.all(companyId) });
      showMutationSuccess('Oportunidade criada.')();
    },
    onError: showMutationError('Não foi possível criar a oportunidade.'),
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: OpportunityUpdate }) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.opportunities.all(companyId) });
      showMutationSuccess('Oportunidade atualizada.')();
    },
    onError: showMutationError('Não foi possível atualizar a oportunidade.'),
  });
}

export function useDeleteOpportunity() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.opportunities.all(companyId) });
      showMutationSuccess('Oportunidade removida.')();
    },
    onError: showMutationError('Não foi possível remover a oportunidade.'),
  });
}