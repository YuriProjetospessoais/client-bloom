import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { queryKeys } from './keys';
import { useTenantId } from './useTenantId';

export type Client = Tables<'clients'>;

export function useClients() {
  const companyId = useTenantId();

  return useQuery({
    queryKey: companyId ? queryKeys.clients.all(companyId) : ['clients', 'no-tenant'],
    enabled: !!companyId,
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId!)
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClient(id: string | null | undefined) {
  const companyId = useTenantId();
  return useQuery({
    queryKey: companyId && id ? queryKeys.clients.detail(companyId, id) : ['clients', 'none'],
    enabled: !!companyId && !!id,
    queryFn: async (): Promise<Client | null> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId!)
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}