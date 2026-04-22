import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { queryKeys } from './keys';
import { useTenantId } from './useTenantId';

export type Opportunity = Tables<'opportunities'>;
export type OpportunityStatus = Opportunity['status'];

export function useOpportunities() {
  const companyId = useTenantId();
  return useQuery({
    queryKey: companyId ? queryKeys.opportunities.all(companyId) : ['opportunities', 'no-tenant'],
    enabled: !!companyId,
    queryFn: async (): Promise<Opportunity[]> => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOpportunitiesByStatus(status: OpportunityStatus) {
  const companyId = useTenantId();
  return useQuery({
    queryKey: companyId
      ? queryKeys.opportunities.byStatus(companyId, status)
      : ['opportunities', 'no-tenant', status],
    enabled: !!companyId,
    queryFn: async (): Promise<Opportunity[]> => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('company_id', companyId!)
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}