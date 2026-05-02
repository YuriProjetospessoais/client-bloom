import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useTenantId } from './useTenantId';

export type Product = Tables<'products'>;

function isPermissionError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (!e) return false;
  if (e.code === '42501') return true;
  return typeof e.message === 'string' && /permission|denied|RLS|policy/i.test(e.message);
}

export function useProducts(opts: { onlyActive?: boolean } = {}) {
  const companyId = useTenantId();
  const onlyActive = opts.onlyActive ?? true;

  return useQuery({
    queryKey: ['products', companyId, { onlyActive }],
    enabled: !!companyId,
    queryFn: async (): Promise<Product[]> => {
      let q = supabase.from('products').select('*').eq('company_id', companyId!);
      if (onlyActive) q = q.eq('active', true);
      const { data, error } = await q.order('name');
      if (error) {
        // Plano sem feature 'products' ou RLS bloqueia: não quebrar UI
        if (isPermissionError(error)) return [];
        throw error;
      }
      return data ?? [];
    },
  });
}