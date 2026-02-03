import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { UserMenu } from '@/components/layout/UserMenu';
import { BarberFlowLogo } from '@/components/layout/BarberFlowLogo';
import { Outlet } from 'react-router-dom';

export default function SuperAdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden bg-background">
        <SuperAdminSidebar />
        
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top header */}
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden lg:flex items-center gap-2">
                <BarberFlowLogo showText={false} size="sm" />
                <span className="text-lg font-display font-semibold text-foreground">Painel Administrativo</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
