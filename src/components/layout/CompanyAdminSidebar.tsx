import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  Calendar,
  Bell,
  Settings,
  Target,
   Package,
   CreditCard,
} from 'lucide-react';
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
import { useAuth } from '@/lib/auth/AuthContext';

const menuItems = [
  { key: 'dashboard', url: '/admin/dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { key: 'crm', url: '/admin/crm', icon: Target, label: 'crm' },
  { key: 'leads', url: '/admin/leads', icon: UserPlus, label: 'leads' },
  { key: 'clients', url: '/admin/clients', icon: Users, label: 'clients' },
  { key: 'schedule', url: '/admin/schedule', icon: Calendar, label: 'schedule' },
  { key: 'products', url: '/admin/products', icon: Package, label: 'products' },
  { key: 'alerts', url: '/admin/alerts', icon: Bell, label: 'alerts' },
   { key: 'plans', url: '/admin/plans', icon: CreditCard, label: 'plans' },
  { key: 'staff', url: '/admin/staff', icon: Users, label: 'staff' },
  { key: 'settings', url: '/admin/settings', icon: Settings, label: 'settings' },
];

export function CompanyAdminSidebar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <BarberFlowLogo size="md" />
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4 mb-2">
            Menu
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
                      <span>{t.nav[item.label as keyof typeof t.nav]}</span>
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
          NavalhApp v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
