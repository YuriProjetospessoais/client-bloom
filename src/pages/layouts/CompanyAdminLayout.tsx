import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CompanyAdminSidebar } from '@/components/layout/CompanyAdminSidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { UserMenu } from '@/components/layout/UserMenu';
import { ReturnAlertsPopup } from '@/components/alerts/ReturnAlertsPopup';
import { useAuth } from '@/lib/auth/AuthContext';

export default function CompanyAdminLayout() {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CompanyAdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top header */}
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-foreground">
                  {user?.companyName || 'Dashboard'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Return alerts popup */}
      <ReturnAlertsPopup />
    </SidebarProvider>
  );
}
