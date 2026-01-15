import { useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  CreditCard,
  Settings
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
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
  { 
    key: 'dashboard',
    url: '/super-admin/dashboard', 
    icon: LayoutDashboard,
    translationKey: 'dashboard' as const,
  },
  { 
    key: 'companies',
    url: '/super-admin/companies', 
    icon: Building2,
    translationKey: 'companies' as const,
  },
  { 
    key: 'users',
    url: '/super-admin/users', 
    icon: Users,
    translationKey: 'users' as const,
  },
  { 
    key: 'plans',
    url: '/super-admin/plans', 
    icon: CreditCard,
    translationKey: 'plans' as const,
  },
];

export function SuperAdminSidebar() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">Lovable</h2>
            <p className="text-xs text-sidebar-foreground/60">Super Admin</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {t.admin.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
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
          Lovable v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
