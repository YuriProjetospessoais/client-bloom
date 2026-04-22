import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { queryKeys } from './keys';
import { useTenantId } from './useTenantId';

export type Service = Tables<'services'>;

export function useServices(opts: { onlyActive?: boolean } = {}) {
  const companyId = useTenantId();
  const onlyActive = opts.onlyActive ?? true;

  return useQuery({
    queryKey: companyId
      ? [...queryKeys.services.all(companyId), { onlyActive }]
      : ['services', 'no-tenant'],
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Service[]> => {
      let q = supabase
        .from('services')
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