import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useTenant } from '@/lib/tenant/TenantContext';
import { PlanProvider, usePlan } from '@/lib/plans/PlanContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserMenu } from '@/components/layout/UserMenu';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import TenantNotFound from '@/pages/tenant/TenantNotFound';
import {
  LayoutDashboard, Users, UserPlus, Package, Calendar, Bell, Settings, CreditCard, Scissors, Ban, FileBarChart, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointmentNotifications } from '@/hooks/use-appointment-notifications';
import { Feature } from '@/lib/plans/features';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger
} from '@/components/ui/sidebar';

function TenantAdminContent() {
  const { slug } = useParams();
  const { tenant, isLoading, error } = useTenant();
  const { canAccess } = usePlan();
  useAppointmentNotifications();

  const navItems: { to: string; label: string; icon: any; feature?: Feature }[] = [
    { to: `/${slug}/admin/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/${slug}/admin/crm`, label: 'CRM', icon: Users },
    { to: `/${slug}/admin/leads`, label: 'Leads', icon: UserPlus },
    { to: `/${slug}/admin/clients`, label: 'Clientes', icon: Users },
    { to: `/${slug}/admin/products`, label: 'Produtos', icon: Package, feature: 'products' },
    { to: `/${slug}/admin/schedule`, label: 'Agenda', icon: Calendar },
    { to: `/${slug}/admin/alerts`, label: 'Alertas', icon: Bell, feature: 'return_alerts' },
    { to: `/${slug}/admin/plans`, label: 'Meu Plano', icon: CreditCard },
    { to: `/${slug}/admin/staff`, label: 'Gestão de Equipe', icon: Users },
    { to: `/${slug}/admin/blocked-slots`, label: 'Bloqueios', icon: Ban },
    { to: `/${slug}/admin/relatorio`, label: 'Relatório Mensal', icon: FileBarChart, feature: 'reports' },
    { to: `/${slug}/admin/settings`, label: 'Configurações', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !tenant) return <TenantNotFound />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden bg-background safe-area-container">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                {tenant.logoUrl ? (
                  <img src={tenant.logoUrl} alt={tenant.name} className="h-5 w-5 rounded object-cover" />
                ) : (
                  <div
                    className="h-5 w-5 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                )}
                {tenant.name}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const locked = item.feature && !canAccess(item.feature);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              cn(
                                isActive && 'bg-accent text-accent-foreground',
                                locked && 'opacity-50'
                              )
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {locked && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="safe-area-header border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden lg:flex items-center gap-2">
                <Scissors className="h-5 w-5" style={{ color: tenant.primaryColor }} />
                <span className="text-lg font-semibold text-foreground">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function TenantAdminLayout() {
  return (
    <PlanProvider>
      <TenantAdminContent />
    </PlanProvider>
  );
}
