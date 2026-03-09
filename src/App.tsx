import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TenantProtectedRoute } from "@/components/auth/TenantProtectedRoute";
import { TenantProvider } from "@/lib/tenant/TenantContext";

// Public Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import TenantSelectionPage from "./pages/auth/TenantSelectionPage";

// Layouts
import SuperAdminLayout from "./pages/layouts/SuperAdminLayout";
import CompanyAdminLayout from "./pages/layouts/CompanyAdminLayout";
import UserLayout from "./pages/layouts/UserLayout";

// Global Admin Pages
import GlobalDashboardPage from "./pages/global/GlobalDashboardPage";
import CompaniesPage from "./pages/global/CompaniesPage";
import GlobalUsersPage from "./pages/global/GlobalUsersPage";
import PlansPage from "./pages/global/PlansPage";

// Company Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import CRMPage from "./pages/admin/CRMPage";
import LeadsPage from "./pages/admin/LeadsPage";
import ClientsPage from "./pages/admin/ClientsPage";
import ProductsPage from "./pages/admin/ProductsPage";
import SchedulePage from "./pages/admin/SchedulePage";
import AlertsPage from "./pages/admin/AlertsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import AdminPlansPage from "./pages/admin/PlansPage";
import StaffPage from "./pages/admin/StaffPage";


// Barber Pages
import BarberDashboardPage from "./pages/barber/BarberDashboardPage";
// User Pages
import UserDashboardPage from "./pages/user/UserDashboardPage";
import UserCRMPage from "./pages/user/UserCRMPage";
import UserLeadsPage from "./pages/user/UserLeadsPage";
import UserSchedulePage from "./pages/user/UserSchedulePage";
import UserAlertsPage from "./pages/user/UserAlertsPage";
import UserProfilePage from "./pages/user/UserProfilePage";
import UserProductsPage from "./pages/user/UserProductsPage";

// Portal (Client) Pages
import ClientPortalLayout from "./pages/layouts/ClientPortalLayout";
import PortalDashboardPage from "./pages/portal/PortalDashboardPage";
import PortalBookingPage from "./pages/portal/PortalBookingPage";
import PortalAppointmentsPage from "./pages/portal/PortalAppointmentsPage";
import PortalProfilePage from "./pages/portal/PortalProfilePage";

// Tenant Pages & Layouts
import TenantLandingPage from "./pages/tenant/TenantLandingPage";
import TenantBookingPage from "./pages/tenant/TenantBookingPage";
import TenantBookingConfirmationPage from "./pages/tenant/TenantBookingConfirmationPage";
import TenantPortalLayout from "./pages/layouts/TenantPortalLayout";
import TenantAdminLayout from "./pages/layouts/TenantAdminLayout";
import TenantStaffLayout from "./pages/layouts/TenantStaffLayout";
import CustomerReturnReminders from "./pages/staff/CustomerReturnReminders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/select-tenant" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'company_admin', 'employee', 'secretary', 'client']}>
                    <TenantSelectionPage />
                  </ProtectedRoute>
                } />

                {/* Super Admin routes - /global */}
                <Route path="/global" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/global/dashboard" replace />} />
                  <Route path="dashboard" element={<GlobalDashboardPage />} />
                  <Route path="companies" element={<CompaniesPage />} />
                  <Route path="users" element={<GlobalUsersPage />} />
                  <Route path="plans" element={<PlansPage />} />
                </Route>

                {/* Company Admin routes - /admin */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['company_admin']}>
                    <CompanyAdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="crm" element={<CRMPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="schedule" element={<SchedulePage />} />
                   <Route path="alerts" element={<AlertsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                   <Route path="plans" element={<AdminPlansPage />} />
                  <Route path="staff" element={<StaffPage />} />
                  <Route path="barbers" element={<StaffPage />} />
                </Route>

                {/* User routes - /user */}
                <Route path="/user" element={
                  <ProtectedRoute allowedRoles={['employee', 'secretary']}>
                    <UserLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/user/dashboard" replace />} />
                  <Route path="dashboard" element={<UserDashboardPage />} />
                  <Route path="crm" element={<UserCRMPage />} />
                  <Route path="leads" element={<UserLeadsPage />} />
                  <Route path="schedule" element={<UserSchedulePage />} />
                   <Route path="products" element={<UserProductsPage />} />
                  <Route path="alerts" element={<UserAlertsPage />} />
                  <Route path="profile" element={<UserProfilePage />} />
                </Route>

                {/* Client Portal routes - /portal */}
                <Route path="/portal" element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <ClientPortalLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/portal/dashboard" replace />} />
                  <Route path="dashboard" element={<PortalDashboardPage />} />
                  <Route path="agendar" element={<PortalBookingPage />} />
                  <Route path="agendamentos" element={<PortalAppointmentsPage />} />
                  <Route path="perfil" element={<PortalProfilePage />} />
                </Route>

                {/* Tenant routes - /:slug */}
                <Route path="/:slug" element={<TenantProvider><TenantLandingPage /></TenantProvider>} />
                
                {/* Tenant Portal (client) */}
                <Route path="/:slug" element={<TenantProvider><TenantPortalLayout /></TenantProvider>}>
                  <Route path="dashboard" element={<PortalDashboardPage />} />
                  <Route path="agendar" element={<TenantBookingPage />} />
                  <Route path="confirmacao" element={<TenantBookingConfirmationPage />} />
                  <Route path="agendamentos" element={<PortalAppointmentsPage />} />
                  <Route path="perfil" element={<PortalProfilePage />} />
                </Route>

                {/* Tenant Admin — requires company_admin membership */}
                <Route path="/:slug/admin" element={
                  <TenantProvider>
                    <TenantProtectedRoute allowedRoles={['company_admin']}>
                      <TenantAdminLayout />
                    </TenantProtectedRoute>
                  </TenantProvider>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="crm" element={<CRMPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="schedule" element={<SchedulePage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="plans" element={<AdminPlansPage />} />
                  <Route path="staff" element={<StaffPage />} />
                  <Route path="barbers" element={<StaffPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Tenant Staff — requires employee or secretary membership */}
                <Route path="/:slug/agenda" element={
                  <TenantProvider>
                    <TenantProtectedRoute allowedRoles={['employee', 'secretary']}>
                      <TenantStaffLayout />
                    </TenantProtectedRoute>
                  </TenantProvider>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<BarberDashboardPage />} />
                  <Route path="schedule" element={<UserSchedulePage />} />
                  <Route path="crm" element={<UserCRMPage />} />
                  <Route path="leads" element={<UserLeadsPage />} />
                  <Route path="products" element={<UserProductsPage />} />
                  <Route path="alerts" element={<UserAlertsPage />} />
                  <Route path="profile" element={<UserProfilePage />} />
                  <Route path="returns" element={<CustomerReturnReminders />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
