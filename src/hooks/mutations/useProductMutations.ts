import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { showMutationError, showMutationSuccess } from './_shared';

type ProductInsert = Omit<TablesInsert<'products'>, 'company_id'>;
type ProductUpdate = TablesUpdate<'products'>;

function invalidateProducts(qc: ReturnType<typeof useQueryClient>, companyId: string | null) {
  if (!companyId) return;
  qc.invalidateQueries({ queryKey: ['products', companyId] });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (input: ProductInsert) => {
      if (!companyId) throw new Error('Empresa não identificada.');
      const { data, error } = await supabase
        .from('products')
        .insert({ ...input, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateProducts(qc, companyId);
      showMutationSuccess('Produto cadastrado.')();
    },
    onError: showMutationError('Não foi possível cadastrar o produto.'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProductUpdate }) => {
      const { data, error } = await supabase
        .from('products')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateProducts(qc, companyId);
      showMutationSuccess('Produto atualizado.')();
    },
    onError: showMutationError('Não foi possível atualizar o produto.'),
  });
}

/** Soft delete: marca active = false. */
export function useDeleteProduct() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidateProducts(qc, companyId);
      showMutationSuccess('Produto removido.')();
    },
    onError: showMutationError('Não foi possível remover o produto.'),
  });
}