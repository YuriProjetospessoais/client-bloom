// TODO: reativar fluxo de confirmação de email quando
// Resend/SMTP estiver configurado (ver PROMPT-2 PARTE D).
// Hoje, após signUp bem-sucedido, redirecionamos direto para /login
// (ou para o destino indicado em ?redirect=) porque o "Confirm email"
// está desativado manualmente no dashboard do Supabase.

import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Loader2, Mail, Lock, Scissors, User as UserIcon, Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import barbershopBg from '@/assets/barbershop-bg.jpg';

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Excelente'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-500'];
  return { score: s, label: labels[s], color: colors[s] };
}

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('duplicate') || lower.includes('already exists')) {
    return 'Esse email já está cadastrado. Faça login ou use outro email.';
  }
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('compromised') || lower.includes('leaked') || lower.includes('pwned'))) {
    return 'Senha bloqueada por segurança (consta em listas de vazamentos). Use uma senha diferente, com letras, números e símbolos.';
  }
  if (lower.includes('rate') || lower.includes('429') || lower.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (lower.includes('invalid email')) {
    return 'Email inválido. Verifique e tente novamente.';
  }
  return message;
}

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const redirectTarget = searchParams.get('redirect') || '/login';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pwStrength = useMemo(() => passwordStrength(password), [password]);

  const phoneDigits = phone.replace(/\D/g, '');

  const canSubmit =
    fullName.trim().length >= 3 &&
    fullName.trim().length <= 100 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phoneDigits.length >= 10 &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptTerms &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        toast({
          title: 'Não foi possível cadastrar',
          description: friendlyError(error.message),
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      // Record terms acceptance (best-effort; never blocks signup).
      // Only works if a session was created (i.e. email confirmation OFF).
      if (data.session) {
        try {
          await supabase.rpc('record_terms_acceptance', {
            _email: email.trim().toLowerCase(),
            _terms_version: 'v1',
          });
        } catch {
          // ignore — auditing must never break signup
        }
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: data.session
          ? 'Você já pode entrar e agendar.'
          : 'Faça login para continuar.',
      });

      // If we already have a session (email confirmation is OFF), go straight to redirect
      if (data.session) {
        navigate(redirectTarget, { replace: true });
      } else {
        // Otherwise send to /login (preserving redirect so login flow continues)
        const loginUrl = redirectTarget && redirectTarget !== '/login'
          ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
          : '/login';
        navigate(loginUrl, { replace: true });
      }
    } catch (err) {
      toast({
        title: 'Erro inesperado',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-10">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl gradient-gold mb-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
            <Scissors size={28} className="text-white relative z-10 rotate-[-45deg] drop-shadow-md" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Crie sua conta
          </h1>
          <p className="text-sm text-white/80 mt-2">
            Agende em qualquer barbearia parceira do Navalhapp.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-card/95 backdrop-blur-xl rounded-3xl p-7 shadow-2xl border border-white/10"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <div className="relative mt-1.5">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="pl-10 h-12"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 91234-5678"
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10 pr-10 h-12"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${pwStrength.color}`}
                      style={{ width: `${(pwStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pwStrength.label}</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="mt-1.5 h-12"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <Checkbox
                checked={acceptTerms}
                onCheckedChange={(v) => setAcceptTerms(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground">
                Aceito os{' '}
                <a href="#" className="text-primary hover:underline">termos de uso</a>{' '}
                e a{' '}
                <a href="#" className="text-primary hover:underline">política de privacidade</a>.
              </span>
            </label>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl gradient-gold hover:opacity-90 text-primary-foreground"
              disabled={!canSubmit}
            >
              {submitting ? (
                <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Criando conta...</span>
              ) : (
                'Criar conta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link
              to={redirectTarget && redirectTarget !== '/login'
                ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
                : '/login'}
              className="text-primary hover:underline font-medium"
            >
              Fazer login
            </Link>
          </div>

          <div className="mt-2 text-center text-xs text-muted-foreground">
            É dono de barbearia?{' '}
            <Link to="/onboarding" className="text-primary hover:underline">
              Cadastre sua barbearia
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}