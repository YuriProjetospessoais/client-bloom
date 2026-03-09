import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTenant } from '@/lib/tenant/TenantContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LayoutDashboard, CalendarPlus, CalendarDays, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TenantNotFound from '@/pages/tenant/TenantNotFound';

export default function TenantPortalLayout() {
  const { slug } = useParams();
  const { tenant, isLoading, error } = useTenant();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: `/${slug}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/${slug}/agendar`, label: 'Agendar', icon: CalendarPlus },
    { to: `/${slug}/agendamentos`, label: 'Agendamentos', icon: CalendarDays },
    { to: `/${slug}/perfil`, label: 'Perfil', icon: User },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return <TenantNotFound />;
  }

  const handleLogout = async () => {
    await logout();
    navigate(`/${slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-container">
      {/* Top navbar with tenant branding */}
      <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-foreground">{tenant.name}</span>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )
                }
                style={({ isActive }) => isActive ? { backgroundColor: tenant.primaryColor } : {}}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
                  isActive ? '' : 'text-muted-foreground'
                )
              }
              style={({ isActive }) => isActive ? { color: tenant.primaryColor } : {}}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 lg:p-6 pb-20 sm:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
