import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";

// Only LoginPage is eagerly loaded — everything else is lazy
import LoginPage from "./pages/auth/LoginPage";
import { FeatureGate } from "./components/plans/FeatureGate";

// Lightweight loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Lazy-loaded route guards
const ProtectedRoute = lazy(() => import("@/components/auth/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
const TenantProtectedRoute = lazy(() => import("@/components/auth/TenantProtectedRoute").then(m => ({ default: m.TenantProtectedRoute })));
const TenantProvider = lazy(() => import("@/lib/tenant/TenantContext").then(m => ({ default: m.TenantProvider })));

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TenantSelectionPage = lazy(() => import("./pages/auth/TenantSelectionPage"));
const OnboardingPage = lazy(() => import("./pages/onboarding/OnboardingPage"));

// Layouts
const SuperAdminLayout = lazy(() => import("./pages/layouts/SuperAdminLayout"));
const CompanyAdminLayout = lazy(() => import("./pages/layouts/CompanyAdminLayout"));
const UserLayout = lazy(() => import("./pages/layouts/UserLayout"));
const ClientPortalLayout = lazy(() => import("./pages/layouts/ClientPortalLayout"));
const TenantPortalLayout = lazy(() => import("./pages/layouts/TenantPortalLayout"));
const TenantAdminLayout = lazy(() => import("./pages/layouts/TenantAdminLayout"));
const TenantStaffLayout = lazy(() => import("./pages/layouts/TenantStaffLayout"));

// Global Admin Pages
const GlobalDashboardPage = lazy(() => import("./pages/global/GlobalDashboardPage"));
const CompaniesPage = lazy(() => import("./pages/global/CompaniesPage"));
const GlobalUsersPage = lazy(() => import("./pages/global/GlobalUsersPage"));
const PlansPage = lazy(() => import("./pages/global/PlansPage"));
const PayoutsPage = lazy(() => import("./pages/global/PayoutsPage"));

// Company Admin Pages
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const CRMPage = lazy(() => import("./pages/admin/CRMPage"));
const LeadsPage = lazy(() => import("./pages/admin/LeadsPage"));
const ClientsPage = lazy(() => import("./pages/admin/ClientsPage"));
const ProductsPage = lazy(() => import("./pages/admin/ProductsPage"));
const SchedulePage = lazy(() => import("./pages/admin/SchedulePage"));
const AlertsPage = lazy(() => import("./pages/admin/AlertsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const AdminPlansPage = lazy(() => import("./pages/admin/PlansPage"));
const StaffPage = lazy(() => import("./pages/admin/StaffPage"));
const BlockedSlotsPage = lazy(() => import("./pages/admin/BlockedSlotsPage"));
const MonthlyReportPage = lazy(() => import("./pages/admin/MonthlyReportPage"));
const ReferralPage = lazy(() => import("./pages/admin/ReferralPage"));

// User Pages
const BarberDashboardPage = lazy(() => import("./pages/barber/BarberDashboardPage"));
const UserDashboardPage = lazy(() => import("./pages/user/UserDashboardPage"));
const UserCRMPage = lazy(() => import("./pages/user/UserCRMPage"));
const UserLeadsPage = lazy(() => import("./pages/user/UserLeadsPage"));
const UserSchedulePage = lazy(() => import("./pages/user/UserSchedulePage"));
const UserAlertsPage = lazy(() => import("./pages/user/UserAlertsPage"));
const UserProfilePage = lazy(() => import("./pages/user/UserProfilePage"));
const UserProductsPage = lazy(() => import("./pages/user/UserProductsPage"));

// Portal Pages
const PortalDashboardPage = lazy(() => import("./pages/portal/PortalDashboardPage"));
const PortalBookingPage = lazy(() => import("./pages/portal/PortalBookingPage"));
const PortalAppointmentsPage = lazy(() => import("./pages/portal/PortalAppointmentsPage"));
const PortalProfilePage = lazy(() => import("./pages/portal/PortalProfilePage"));
const PortalContactPage = lazy(() => import("./pages/portal/PortalContactPage"));

// Tenant Pages
const TenantLandingPage = lazy(() => import("./pages/tenant/TenantLandingPage"));
const TenantBookingPage = lazy(() => import("./pages/tenant/TenantBookingPage"));
const TenantBookingConfirmationPage = lazy(() => import("./pages/tenant/TenantBookingConfirmationPage"));
const CustomerReturnReminders = lazy(() => import("./pages/staff/CustomerReturnReminders"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s — bom equilíbrio para dados de agenda
      gcTime: 1000 * 60 * 5, // 5min em cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
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
                    <Route path="payouts" element={<PayoutsPage />} />
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
                    <Route path="blocked-slots" element={<BlockedSlotsPage />} />
                    <Route path="relatorio" element={<MonthlyReportPage />} />
                    <Route path="indicacoes" element={<ReferralPage />} />
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
                    <Route path="contato" element={<PortalContactPage />} />
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
                    <Route path="contato" element={<PortalContactPage />} />
                    <Route path="perfil" element={<PortalProfilePage />} />
                  </Route>

                  {/* Tenant Admin */}
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
                    <Route path="products" element={<FeatureGate feature="products"><ProductsPage /></FeatureGate>} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="alerts" element={<FeatureGate feature="return_alerts"><AlertsPage /></FeatureGate>} />
                    <Route path="plans" element={<AdminPlansPage />} />
                    <Route path="staff" element={<StaffPage />} />
                    <Route path="barbers" element={<StaffPage />} />
                    <Route path="blocked-slots" element={<BlockedSlotsPage />} />
                    <Route path="relatorio" element={<FeatureGate feature="reports"><MonthlyReportPage /></FeatureGate>} />
                    <Route path="indicacoes" element={<ReferralPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Tenant Staff */}
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
                    <Route path="clients" element={<ClientsPage />} />
                    <Route path="crm" element={<UserCRMPage />} />
                    <Route path="leads" element={<UserLeadsPage />} />
                    <Route path="products" element={<FeatureGate feature="products"><UserProductsPage /></FeatureGate>} />
                    <Route path="alerts" element={<FeatureGate feature="return_alerts"><UserAlertsPage /></FeatureGate>} />
                    <Route path="profile" element={<UserProfilePage />} />
                    <Route path="returns" element={<FeatureGate feature="return_alerts"><CustomerReturnReminders /></FeatureGate>} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
