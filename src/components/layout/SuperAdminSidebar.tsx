import { useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  CreditCard,
  Settings
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { BarberFlowLogo } from './BarberFlowLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const menuItems = [
  { key: 'dashboard', url: '/global/dashboard', icon: LayoutDashboard, translationKey: 'dashboard' as const },
  { key: 'companies', url: '/global/companies', icon: Building2, translationKey: 'companies' as const },
  { key: 'users', url: '/global/users', icon: Users, translationKey: 'users' as const },
  { key: 'plans', url: '/global/plans', icon: CreditCard, translationKey: 'plans' as const },
];

export function SuperAdminSidebar() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <BarberFlowLogo size="md" />
        <p className="text-xs text-sidebar-foreground/60 mt-1 ml-13">Super Admin</p>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4 mb-2">
            {t.admin.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-4 border-primary"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{t.nav[item.translationKey]}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/40 text-center">
          BarberFlow v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
