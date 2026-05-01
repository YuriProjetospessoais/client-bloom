import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Lock, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MfaVerify } from '@/components/auth/MfaVerify';
import barbershopBg from '@/assets/barbershop-bg.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const target = redirectParam || from;

  const handleSuccessfulLogin = async (user: { id: string; companyId?: string }) => {
    // Check if user has memberships to show tenant selection
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', user.id);
    
    // Honor explicit redirect (e.g. from /:slug/agendar)
    if (redirectParam) {
      navigate(redirectParam, { replace: true });
      return;
    }

    // If user has memberships (excluding super_admin global access), show selection
    const hasMemberships = roles && roles.some(r => r.company_id !== null);
    if (hasMemberships) {
      navigate('/select-tenant', { replace: true });
      return;
    }
    
    navigate(target, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.rateLimited) {
        toast({
          title: 'Muitas tentativas',
          description: `Conta temporariamente bloqueada. Tente novamente em ${result.minutesRemaining ?? 30} minuto(s).`,
          variant: 'destructive',
        });
      } else if (result.success) {
        if (result.requiresMfa) {
          setMfaRequired(true);
          toast({ title: 'Autenticação em duas etapas', description: 'Por favor, insira seu código 2FA.' });
          setIsLoading(false);
          return;
        }

        toast({ title: 'Bem-vindo de volta!', description: 'Login realizado com sucesso.' });
        if (result.user) {
          await handleSuccessfulLogin(result.user);
        }
      } else {
        toast({ title: 'Erro no login', description: 'Email ou senha inválidos.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${barbershopBg})` }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-gold mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
            <div className="absolute inset-1 rounded-2xl border border-white/20" />
            <Scissors size={36} className="text-white relative z-10 rotate-[-45deg] drop-shadow-md" strokeWidth={2.5} />
          </div>
          
          <h1 className="text-4xl font-display font-bold text-white mb-1 tracking-tight">
            Navalha<span className="text-gold">App</span>
          </h1>
          <p className="text-sm text-white/90 tracking-[0.3em] uppercase font-semibold mb-4">
            Professional Suite
          </p>
          <p className="text-lg text-white/90 font-medium italic">
            Mais do que cortes. Relacionamentos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10"
        >
          {mfaRequired ? (
            <MfaVerify onVerified={async () => {
              toast({ title: 'Bem-vindo de volta!', description: 'Login realizado com sucesso.' });
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                await handleSuccessfulLogin({ id: session.user.id });
              } else {
                navigate(target, { replace: true });
              }
            }} />
          ) : (
            <>
              <h2 className="text-2xl font-display font-semibold text-foreground text-center mb-6">
                Bem-vindo de volta
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 bg-secondary/50 border-border/50 rounded-xl text-base focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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

                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold rounded-xl gradient-gold hover:opacity-90 transition-all duration-200 shadow-lg text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Entrando...</span>
                  ) : (
                    'Entrar no sistema'
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-2 text-center">
                <div className="text-sm text-muted-foreground">
                  Ainda não tem conta?{' '}
                  <Link
                    to={redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup'}
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se aqui
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                  É dono de barbearia?{' '}
                  <Link to="/onboarding" className="text-primary hover:underline font-medium">
                    Cadastre sua barbearia
                  </Link>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
