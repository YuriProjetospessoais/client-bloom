import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { queryKeys } from './keys';
import { useTenantId } from './useTenantId';

export type Professional = Tables<'professionals'>;

export function useProfessionals(opts: { onlyActive?: boolean } = {}) {
  const companyId = useTenantId();
  const onlyActive = opts.onlyActive ?? true;

  return useQuery({
    queryKey: companyId
      ? [...queryKeys.professionals.all(companyId), { onlyActive }]
      : ['professionals', 'no-tenant'],
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Professional[]> => {
      let q = supabase
        .from('professionals')
        .select('*')
        .eq('company_id', companyId!)
        .order('name', { ascending: true });
      if (onlyActive) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}