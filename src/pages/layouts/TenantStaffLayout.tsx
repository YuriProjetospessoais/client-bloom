import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useTenant } from '@/lib/tenant/TenantContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UserMenu } from '@/components/layout/UserMenu';
import TenantNotFound from '@/pages/tenant/TenantNotFound';
import { LayoutDashboard, Calendar, User, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointmentNotifications } from '@/hooks/use-appointment-notifications';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger
} from '@/components/ui/sidebar';


export default function TenantStaffLayout() {
  const { slug } = useParams();
  const { tenant, isLoading, error } = useTenant();
  useAppointmentNotifications();

  const navItems = [
    { to: `/${slug}/agenda/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/${slug}/agenda/schedule`, label: 'Agenda', icon: Calendar },
    { to: `/${slug}/agenda/returns`, label: 'Retornos', icon: RotateCcw },
    { to: `/${slug}/agenda/profile`, label: 'Perfil', icon: User },
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
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            cn(isActive && 'bg-accent text-accent-foreground')
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
                <span className="text-lg font-semibold text-foreground">{tenant.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
