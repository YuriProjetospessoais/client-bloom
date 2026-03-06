import { Link, useParams } from 'react-router-dom';
import { useTenant } from '@/lib/tenant/TenantContext';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Scissors } from 'lucide-react';
import TenantNotFound from './TenantNotFound';

export default function TenantLandingPage() {
  const { slug } = useParams();
  const { tenant, isLoading, error } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !tenant) return <TenantNotFound />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-lg">
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt={tenant.name} className="h-20 w-20 rounded-2xl object-cover mx-auto" />
        ) : (
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            <Scissors className="h-10 w-10 text-white" />
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
          <p className="text-muted-foreground">Agende seu horário de forma rápida e prática</p>
        </div>

        <Button asChild size="lg" style={{ backgroundColor: tenant.primaryColor }}>
          <Link to={`/${slug}/agendar`} className="text-white">
            <CalendarPlus className="h-5 w-5 mr-2" />
            Agendar agora
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="underline hover:text-foreground">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
