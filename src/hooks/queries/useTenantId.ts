import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Returns the active tenant (company) id for the logged-in user.
 * All queries/mutations should pass through this hook to enforce
 * the multi-tenant boundary on the client.
 */
export function useTenantId(): string | null {
  const { user } = useAuth();
  return user?.companyId ?? null;
}