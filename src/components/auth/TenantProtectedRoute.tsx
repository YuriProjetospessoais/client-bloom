import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTenant } from '@/lib/tenant/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/auth/types';

interface TenantProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

/**
 * Protects tenant routes by verifying the logged-in user
 * has a matching role+company_id membership for this tenant.
 * Super admins always pass.
 */
export function TenantProtectedRoute({ children, allowedRoles }: TenantProtectedRouteProps) {
  const { slug } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { tenant, isLoading: tenantLoading } = useTenant();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading || tenantLoading) return;

    if (!isAuthenticated || !user || !tenant) {
      setChecking(false);
      setAuthorized(false);
      return;
    }

    // Super admin bypasses membership check
    if (user.role === 'super_admin') {
      setChecking(false);
      setAuthorized(true);
      return;
    }

    checkMembership(user.id, tenant.id);
  }, [authLoading, tenantLoading, user, tenant, isAuthenticated]);

  async function checkMembership(userId: string, companyId: string) {
    setChecking(true);

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .in('role', allowedRoles);

    if (error || !data || data.length === 0) {
      setAuthorized(false);
    } else {
      setAuthorized(true);
    }

    setChecking(false);
  }

  if (authLoading || tenantLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/${slug}`} replace />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Acesso negado</h1>
          <p className="text-muted-foreground text-sm">
            Você não tem permissão para acessar esta área de <strong>{tenant?.name}</strong>.
          </p>
          <a href={`/${slug}`} className="inline-block text-sm text-primary hover:underline">
            Voltar para a página inicial
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
