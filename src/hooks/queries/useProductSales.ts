import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useTenantId } from './useTenantId';

export type ProductSale = Tables<'product_sales'>;

function isPermissionError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (!e) return false;
  if (e.code === '42501') return true;
  return typeof e.message === 'string' && /permission|denied|RLS|policy/i.test(e.message);
}

export function useProductSales() {
  const companyId = useTenantId();
  return useQuery({
    queryKey: ['product_sales', companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<ProductSale[]> => {
      const { data, error } = await supabase
        .from('product_sales')
        .select('*')
        .eq('company_id', companyId!)
        .order('sale_date', { ascending: false });
      if (error) {
        if (isPermissionError(error)) return [];
        throw error;
      }
      return data ?? [];
    },
  });
}

export function useProductSalesByClient(clientId: string | null | undefined) {
  const companyId = useTenantId();
  return useQuery({
    queryKey: ['product_sales', companyId, 'client', clientId],
    enabled: !!companyId && !!clientId,
    queryFn: async (): Promise<ProductSale[]> => {
      const { data, error } = await supabase
        .from('product_sales')
        .select('*')
        .eq('company_id', companyId!)
        .eq('client_id', clientId!)
        .order('sale_date', { ascending: false });
      if (error) {
        if (isPermissionError(error)) return [];
        throw error;
      }
      return data ?? [];
    },
  });
}