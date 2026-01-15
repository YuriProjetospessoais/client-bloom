import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  Calendar,
  Bell,
  Settings,
  Target,
  ClipboardList
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
import { useAuth } from '@/lib/auth/AuthContext';

const menuItems = [
  { 
    key: 'dashboard',
    url: '/admin/dashboard', 
    icon: LayoutDashboard,
    label: 'dashboard',
  },
  { 
    key: 'crm',
    url: '/admin/crm', 
    icon: Target,
    label: 'crm',
  },
  { 
    key: 'leads',
    url: '/admin/leads', 
    icon: UserPlus,
    label: 'leads',
  },
  { 
    key: 'clients',
    url: '/admin/clients', 
    icon: Users,
    label: 'clients',
  },
  { 
    key: 'schedule',
    url: '/admin/schedule', 
    icon: Calendar,
    label: 'schedule',
  },
  { 
    key: 'alerts',
    url: '/admin/alerts', 
    icon: Bell,
    label: 'alerts',
  },
  { 
    key: 'settings',
    url: '/admin/settings', 
    icon: Settings,
    label: 'settings',
  },
];

export function CompanyAdminSidebar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground truncate max-w-[140px]">
              {user?.companyName || 'Lovable'}
            </h2>
            <p className="text-xs text-sidebar-foreground/60">Admin</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Menu
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
          Lovable v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
