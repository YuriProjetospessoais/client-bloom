import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors, Loader2, ArrowRight, ArrowLeft, Check, AlertCircle,
  Building2, User as UserIcon, Mail, Lock, Phone, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const RESERVED_SLUGS = new Set([
  'admin', 'login', 'signup', 'api', 'app', 'dashboard', 'onboarding', 'global',
  'staff', 'tenant', 'user', 'client', 'portal', 'select-tenant', 'billing',
  'referral', 'settings', 'help', 'support', 'terms', 'privacy', 'pricing',
]);

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
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

type SlugState = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'invalid';

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const referralCode = searchParams.get('ref') ?? undefined;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>('idle');
  const [phone, setPhone] = useState('');

  // Step 2
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Auto-suggest slug from company name (until user manually edits it)
  useEffect(() => {
    if (!slugTouched && companyName) setSlug(slugify(companyName));
  }, [companyName, slugTouched]);

  // Validate slug in real-time
  useEffect(() => {
    if (!slug) { setSlugState('idle'); return; }
    if (slug.length < 3) { setSlugState('invalid'); return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { setSlugState('invalid'); return; }
    if (RESERVED_SLUGS.has(slug)) { setSlugState('reserved'); return; }

    setSlugState('checking');
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      setSlugState(data ? 'taken' : 'available');
    }, 400);
    return () => clearTimeout(t);
  }, [slug]);

  const pwStrength = useMemo(() => passwordStrength(password), [password]);

  const canStep1 =
    companyName.trim().length >= 3 &&
    slugState === 'available';

  const canStep2 =
    fullName.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    password === confirmPassword;

  const canSubmit = canStep1 && canStep2 && acceptTerms && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('onboarding-barbershop', {
        body: {
          company: { name: companyName.trim(), slug, phone: phone || undefined },
          admin: { full_name: fullName.trim(), email: email.trim().toLowerCase(), password },
          referral_code: referralCode,
        },
      });

      if (error || (data && data.error)) {
        const msg = (data?.error as string) || error?.message || 'Erro ao criar conta';
        toast({ title: 'Não foi possível criar sua barbearia', description: msg, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      setDone(true);
      toast({ title: 'Barbearia criada com sucesso!', description: 'Verifique seu email para confirmar a conta.' });
    } catch (e) {
      toast({
        title: 'Erro inesperado',
        description: e instanceof Error ? e.message : 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-8 text-center shadow-2xl"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verifique seu email</h1>
          <p className="text-neutral-400 mb-6">
            Enviamos um link de confirmação para <span className="text-amber-400 font-medium">{email}</span>.
            Clique no link para ativar sua conta e começar a usar o Navalhapp.
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            Ir para o login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 py-12 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Scissors className="w-5 h-5 text-black -rotate-45" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight">Navalhapp</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex-1 flex items-center gap-2">
              <div
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step >= n ? 'bg-amber-500' : 'bg-white/10'
                }`}
              />
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-500 mb-8">Passo {step} de 3</p>

        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-1">Dados da barbearia</h2>
                <p className="text-sm text-neutral-400 mb-6">Vamos começar com as informações básicas.</p>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="companyName" className="text-neutral-300">Nome da barbearia *</Label>
                    <div className="relative mt-1.5">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Barbearia do João"
                        className="pl-10 bg-neutral-950 border-white/10 text-white"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slug" className="text-neutral-300">Link público *</Label>
                    <div className="mt-1.5 flex items-center bg-neutral-950 border border-white/10 rounded-md overflow-hidden">
                      <span className="px-3 text-sm text-neutral-500 select-none">navalhapp.com.br/</span>
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                        placeholder="seu-link"
                        className="border-0 bg-transparent text-white focus-visible:ring-0 px-0"
                        maxLength={50}
                      />
                    </div>
                    <div className="mt-2 min-h-[20px] text-xs">
                      {slugState === 'checking' && (
                        <span className="text-neutral-500 inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Verificando…
                        </span>
                      )}
                      {slugState === 'available' && (
                        <span className="text-emerald-400 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Disponível
                        </span>
                      )}
                      {slugState === 'taken' && (
                        <span className="text-red-400 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Este link já está em uso
                        </span>
                      )}
                      {slugState === 'reserved' && (
                        <span className="text-red-400 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Este nome é reservado, escolha outro
                        </span>
                      )}
                      {slugState === 'invalid' && (
                        <span className="text-amber-400 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Use só letras minúsculas, números e hífens (mín. 3)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-neutral-300">Telefone (opcional)</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(maskPhone(e.target.value))}
                        placeholder="(11) 91234-5678"
                        className="pl-10 bg-neutral-950 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canStep1}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-50"
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-1">Seu acesso</h2>
                <p className="text-sm text-neutral-400 mb-6">Você será o administrador da barbearia.</p>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="fullName" className="text-neutral-300">Nome completo *</Label>
                    <div className="relative mt-1.5">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome"
                        className="pl-10 bg-neutral-950 border-white/10 text-white"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-neutral-300">Email *</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10 bg-neutral-950 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-neutral-300">Senha *</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="pl-10 pr-10 bg-neutral-950 border-white/10 text-white"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${pwStrength.color}`}
                            style={{ width: `${(pwStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{pwStrength.label}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-neutral-300">Confirmar senha *</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="mt-1.5 bg-neutral-950 border-white/10 text-white"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-400">As senhas não coincidem</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="border-white/10 bg-transparent hover:bg-white/5 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canStep2}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-50"
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold mb-1">Confirme os dados</h2>
                <p className="text-sm text-neutral-400 mb-6">Revise antes de criar sua conta.</p>

                <div className="space-y-3 bg-neutral-950 border border-white/5 rounded-xl p-4 mb-6">
                  <Row label="Barbearia" value={companyName} />
                  <Row label="Link público" value={`navalhapp.com.br/${slug}`} />
                  {phone && <Row label="Telefone" value={phone} />}
                  <Row label="Administrador" value={fullName} />
                  <Row label="Email" value={email} />
                  {referralCode && <Row label="Código de indicação" value={referralCode} />}
                </div>

                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 mb-6">
                  <p className="text-sm text-amber-300 font-medium mb-1">🎁 14 dias grátis no plano Pro</p>
                  <p className="text-xs text-amber-200/70">
                    Você terá acesso a todos os recursos avançados durante o teste, sem precisar de cartão.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer mb-6">
                  <Checkbox
                    checked={acceptTerms}
                    onCheckedChange={(v) => setAcceptTerms(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-neutral-300">
                    Aceito os{' '}
                    <a href="#" className="text-amber-400 hover:underline">termos de uso</a>{' '}
                    e a{' '}
                    <a href="#" className="text-amber-400 hover:underline">política de privacidade</a>.
                  </span>
                </label>

                <div className="flex justify-between gap-3">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    disabled={submitting}
                    className="border-white/10 bg-transparent hover:bg-white/5 text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando…</>
                    ) : (
                      <>Criar minha barbearia <Check className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-amber-400 hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-white font-medium text-right truncate">{value}</span>
    </div>
  );
}