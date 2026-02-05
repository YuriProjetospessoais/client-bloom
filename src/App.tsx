import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";

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

// User Pages
import UserDashboardPage from "./pages/user/UserDashboardPage";
import UserCRMPage from "./pages/user/UserCRMPage";
import UserLeadsPage from "./pages/user/UserLeadsPage";
import UserSchedulePage from "./pages/user/UserSchedulePage";
import UserAlertsPage from "./pages/user/UserAlertsPage";
import UserProfilePage from "./pages/user/UserProfilePage";
 import UserProductsPage from "./pages/user/UserProductsPage";

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
                </Route>

                {/* User routes - /user */}
                <Route path="/user" element={
                  <ProtectedRoute allowedRoles={['user']}>
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
