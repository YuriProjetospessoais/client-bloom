import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import barbershopBg from '@/assets/barbershop-bg.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: 'Bem-vindo de volta!',
          description: 'Login realizado com sucesso.',
        });
        navigate(from, { replace: true });
      } else {
        toast({
          title: 'Erro no login',
          description: 'Email ou senha inválidos.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: 'Email ou senha inválidos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${barbershopBg})` }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Premium Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-gold mb-6 shadow-2xl relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
            {/* Decorative ring */}
            <div className="absolute inset-1 rounded-2xl border border-white/20" />
            <Scissors 
              size={36} 
              className="text-white relative z-10 rotate-[-45deg] drop-shadow-md" 
              strokeWidth={2.5}
            />
          </div>
          
          <h1 className="text-4xl font-display font-bold text-white mb-1 tracking-tight">
            Barber<span className="text-gold">Flow</span>
          </h1>
          <p className="text-xs text-white/60 tracking-[0.3em] uppercase font-medium mb-4">
            Professional Suite
          </p>
          <p className="text-lg text-primary-foreground/80 font-light italic">
            Mais do que cortes. Relacionamentos.
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10"
        >
          <h2 className="text-2xl font-display font-semibold text-foreground text-center mb-6">
            Bem-vindo de volta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 pl-12 bg-secondary/50 border-border/50 rounded-xl text-base focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 pl-12 pr-12 bg-secondary/50 border-border/50 rounded-xl text-base focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold rounded-xl gradient-gold hover:opacity-90 transition-all duration-200 shadow-lg text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar no sistema'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Esqueceu sua senha?
            </a>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Contas de demonstração:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-secondary/50 rounded-lg">
                <span className="font-medium text-foreground">Super Admin:</span>
                <span className="text-muted-foreground font-mono">admin@lovable.com / admin123</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-secondary/50 rounded-lg">
                <span className="font-medium text-foreground">Admin:</span>
                <span className="text-muted-foreground font-mono">empresa@clinica.com / empresa123</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-secondary/50 rounded-lg">
                <span className="font-medium text-foreground">Usuário:</span>
                <span className="text-muted-foreground font-mono">usuario@clinica.com / usuario123</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
