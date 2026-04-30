import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import LandingPage from './LandingPage';
import { LimboScreen } from '@/components/auth/LimboScreen';

const Index = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  switch (user?.role) {
    case 'super_admin':
      return <Navigate to="/global/dashboard" replace />;
    case 'company_admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'employee':
    case 'secretary':
      return <Navigate to="/user/dashboard" replace />;
    case 'client':
      return <Navigate to="/portal" replace />;
    default:
      // Logged-in user with no role assigned (limbo)
      return <LimboScreen />;
  }
};

export default Index;
