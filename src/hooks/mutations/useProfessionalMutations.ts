import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { queryKeys } from '@/hooks/queries/keys';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { showMutationError, showMutationSuccess } from './_shared';

type ProfessionalInsert = Omit<TablesInsert<'professionals'>, 'company_id'>;
type ProfessionalUpdate = TablesUpdate<'professionals'>;

export function useCreateProfessional() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (input: ProfessionalInsert) => {
      if (!companyId) throw new Error('Empresa não identificada.');
      const { data, error } = await supabase
        .from('professionals')
        .insert({ ...input, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.professionals.all(companyId) });
      showMutationSuccess('Profissional criado.')();
    },
    onError: showMutationError('Não foi possível criar o profissional.'),
  });
}

export function useUpdateProfessional() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProfessionalUpdate }) => {
      const { data, error } = await supabase
        .from('professionals')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.professionals.all(companyId) });
      showMutationSuccess('Profissional atualizado.')();
    },
    onError: showMutationError('Não foi possível atualizar o profissional.'),
  });
}

export function useDeleteProfessional() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      if (companyId) qc.invalidateQueries({ queryKey: queryKeys.professionals.all(companyId) });
      showMutationSuccess('Profissional removido.')();
    },
    onError: showMutationError('Não foi possível remover o profissional.'),
  });
}