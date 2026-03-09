import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus,
  Calendar,
  Bell,
  Target,
  User,
  Package
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
  { key: 'dashboard', url: '/user/dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { key: 'crm', url: '/user/crm', icon: Target, label: 'crm' },
  { key: 'leads', url: '/user/leads', icon: UserPlus, label: 'leads' },
  { key: 'schedule', url: '/user/schedule', icon: Calendar, label: 'schedule' },
 { key: 'products', url: '/user/products', icon: Package, label: 'products' },
  { key: 'alerts', url: '/user/alerts', icon: Bell, label: 'alerts' },
  { key: 'profile', url: '/user/profile', icon: User, label: 'profile' },
];

export function UserSidebar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <BarberFlowLogo size="md" />
        <p className="text-xs text-sidebar-foreground/60 mt-1 truncate max-w-[180px]">
          {user?.name}
        </p>
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
                      <span>{t.nav[item.label as keyof typeof t.nav] || item.label}</span>
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
