import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect based on user role
    if (user?.role === 'super_admin') {
      navigate('/global/dashboard', { replace: true });
    } else if (user?.role === 'company_admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/user/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-gold mb-4 shadow-xl">
          <span className="text-3xl">✂️</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">NavalhApp</h1>
        <p className="text-muted-foreground mt-2">Carregando...</p>
      </motion.div>
    </div>
  );
}
