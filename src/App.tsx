import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

// Layouts
import SuperAdminLayout from "./pages/layouts/SuperAdminLayout";
import CompanyAdminLayout from "./pages/layouts/CompanyAdminLayout";
import UserLayout from "./pages/layouts/UserLayout";

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

                {/* Super Admin routes */}
                <Route path="/super-admin" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="companies" element={<DashboardPage />} />
                  <Route path="users" element={<DashboardPage />} />
                  <Route path="plans" element={<DashboardPage />} />
                </Route>

                {/* Company Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['company_admin']}>
                    <CompanyAdminLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="crm" element={<DashboardPage />} />
                  <Route path="leads" element={<DashboardPage />} />
                  <Route path="clients" element={<DashboardPage />} />
                  <Route path="schedule" element={<DashboardPage />} />
                  <Route path="alerts" element={<DashboardPage />} />
                  <Route path="settings" element={<DashboardPage />} />
                </Route>

                {/* User routes */}
                <Route element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/crm" element={<DashboardPage />} />
                  <Route path="/leads" element={<DashboardPage />} />
                  <Route path="/schedule" element={<DashboardPage />} />
                  <Route path="/alerts" element={<DashboardPage />} />
                  <Route path="/attendance" element={<DashboardPage />} />
                  <Route path="/profile" element={<DashboardPage />} />
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
