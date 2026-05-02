import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { showMutationError, showMutationSuccess } from './_shared';

type ProductSaleInsert = Omit<TablesInsert<'product_sales'>, 'company_id'>;
type ProductSaleUpdate = TablesUpdate<'product_sales'>;

function invalidate(qc: ReturnType<typeof useQueryClient>, companyId: string | null) {
  if (!companyId) return;
  qc.invalidateQueries({ queryKey: ['product_sales', companyId] });
  qc.invalidateQueries({ queryKey: ['products', companyId] });
}

export function useCreateProductSale() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async (input: ProductSaleInsert) => {
      if (!companyId) throw new Error('Empresa não identificada.');
      const { data, error } = await supabase
        .from('product_sales')
        .insert({ ...input, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate(qc, companyId);
      showMutationSuccess('Venda registrada.')();
    },
    onError: showMutationError('Não foi possível registrar a venda.'),
  });
}

export function useUpdateProductSale() {
  const qc = useQueryClient();
  const companyId = useTenantId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProductSaleUpdate }) => {
      const { data, error } = await supabase
        .from('product_sales')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate(qc, companyId);
      showMutationSuccess('Venda atualizada.')();
    },
    onError: showMutationError('Não foi possível atualizar a venda.'),
  });
}