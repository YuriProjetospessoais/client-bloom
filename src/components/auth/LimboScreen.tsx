import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/AuthContext';

export function LimboScreen() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          Sua conta não está vinculada a nenhuma barbearia
        </h1>
        <p className="text-sm text-neutral-400 text-center mb-2">
          {user?.email}
        </p>
        <p className="text-neutral-300 text-center mb-8">
          Para continuar, escolha uma das opções abaixo:
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => navigate('/onboarding')}
            className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Cadastrar minha barbearia
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 border-white/10 bg-transparent hover:bg-white/5 text-white"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Entrar com outro email
          </Button>

          <button
            onClick={handleLogout}
            className="w-full text-sm text-neutral-500 hover:text-neutral-300 py-2 inline-flex items-center justify-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}