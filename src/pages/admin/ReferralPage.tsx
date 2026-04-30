import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Copy, Check, Share2, Users, Wallet, Clock, AlertCircle, Loader2, ExternalLink, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

type CreditStatus = 'pending' | 'available' | 'requested' | 'applied' | 'expired';

interface CreditRow {
  id: string;
  amount_cents: number;
  status: CreditStatus;
  created_at: string;
  available_at: string | null;
  expires_at: string;
  applied_at: string | null;
  referred_company_id: string;
  referred_company_name?: string;
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

const STATUS_LABEL: Record<CreditStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  available: { label: 'Disponível', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  requested: { label: 'Em resgate', className: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  applied: { label: 'Aplicado', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  expired: { label: 'Expirado', className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30' },
};

export default function ReferralPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId;

  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [credits, setCredits] = useState<CreditRow[]>([]);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: company }, { data: creditRows }] = await Promise.all([
        supabase.from('companies').select('referral_code, slug').eq('id', companyId).maybeSingle(),
        supabase
          .from('referral_credits')
          .select('id, amount_cents, status, created_at, available_at, expires_at, applied_at, referred_company_id')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      setCode(company?.referral_code ?? '');
      setSlug(company?.slug ?? '');

      // Fetch referred company names
      const ids = (creditRows ?? []).map((r) => r.referred_company_id);
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', ids);
        names = Object.fromEntries((companies ?? []).map((c) => [c.id, c.name]));
      }
      setCredits(
        (creditRows ?? []).map((r) => ({ ...r, referred_company_name: names[r.referred_company_id] })),
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  const referralLink = useMemo(() => {
    if (!code) return '';
    return `${window.location.origin}/onboarding?ref=${code}`;
  }, [code]);

  const stats = useMemo(() => {
    const available = credits.filter((c) => c.status === 'available').reduce((s, c) => s + c.amount_cents, 0);
    const pending = credits.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount_cents, 0);
    const requested = credits.filter((c) => c.status === 'requested').reduce((s, c) => s + c.amount_cents, 0);
    const applied = credits.filter((c) => c.status === 'applied').reduce((s, c) => s + c.amount_cents, 0);
    const totalReferrals = credits.length;
    return { available, pending, requested, applied, totalReferrals };
  }, [credits]);

  const copy = async (text: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast({ title: kind === 'code' ? 'Código copiado!' : 'Link copiado!' });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá! Estou usando o Navalhapp pra gerenciar minha barbearia (agenda, clientes, financeiro). ` +
      `Cadastra a sua usando meu código e ganha 14 dias grátis no plano Pro: ${referralLink}`,
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const reload = async () => {
    if (!companyId) return;
    const { data: creditRows } = await supabase
      .from('referral_credits')
      .select('id, amount_cents, status, created_at, available_at, expires_at, applied_at, referred_company_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    const ids = (creditRows ?? []).map((r) => r.referred_company_id);
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: companies } = await supabase.from('companies').select('id, name').in('id', ids);
      names = Object.fromEntries((companies ?? []).map((c) => [c.id, c.name]));
    }
    setCredits((creditRows ?? []).map((r) => ({ ...r, referred_company_name: names[r.referred_company_id] })) as CreditRow[]);
  };

  const submitPayout = async () => {
    if (!pixKey.trim()) {
      toast({ title: 'Informe a chave Pix', variant: 'destructive' });
      return;
    }
    setSubmittingPayout(true);
    const { data, error } = await supabase.rpc('request_referral_payout', {
      _pix_key: pixKey.trim(),
      _pix_key_type: pixKeyType,
      _notes: payoutNotes || null,
    });
    setSubmittingPayout(false);
    if (error) {
      toast({ title: 'Erro ao solicitar resgate', description: error.message, variant: 'destructive' });
      return;
    }
    const result = data as { amount_cents: number };
    toast({
      title: 'Resgate solicitado!',
      description: `R$ ${(result.amount_cents / 100).toFixed(2)} em análise. Você receberá o Pix em até 7 dias úteis.`,
    });
    setPayoutOpen(false);
    setPixKey('');
    setPayoutNotes('');
    await reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Indique e ganhe R$ 50</h1>
            <p className="text-muted-foreground max-w-xl">
              Para cada barbearia que se cadastrar com seu código <strong className="text-foreground">e pagar a primeira fatura</strong>,
              você ganha <strong className="text-primary">R$ 50 de crédito</strong> que será abatido automaticamente da sua próxima fatura.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Wallet} label="Saldo disponível" value={formatBRL(stats.available)} color="text-emerald-400" />
        <StatCard icon={Clock} label="Pendente" value={formatBRL(stats.pending)} color="text-amber-400" />
        <StatCard icon={Check} label="Já aplicado" value={formatBRL(stats.applied)} color="text-blue-400" />
        <StatCard icon={Users} label="Indicações" value={String(stats.totalReferrals)} color="text-foreground" />
      </div>

      {/* Resgate */}
      <Card className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold">Resgatar saldo via Pix</h3>
            <p className="text-sm text-muted-foreground">
              {stats.available > 0
                ? `Você tem ${formatBRL(stats.available)} disponível para resgate.`
                : stats.requested > 0
                ? `${formatBRL(stats.requested)} em análise — aguarde o pagamento.`
                : 'Quando alguma indicação pagar a 1ª fatura, o saldo aparece aqui.'}
            </p>
          </div>
        </div>
        <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={stats.available <= 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Solicitar resgate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar resgate de {formatBRL(stats.available)}</DialogTitle>
              <DialogDescription>
                O pagamento é feito via Pix em até 7 dias úteis após a aprovação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Tipo de chave Pix</Label>
                <Select value={pixKeyType} onValueChange={setPixKeyType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Chave aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chave Pix</Label>
                <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Digite sua chave" />
              </div>
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancelar</Button>
              <Button onClick={submitPayout} disabled={submittingPayout} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {submittingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar solicitação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Code & Link */}
      <Card className="p-4 md:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold mb-1">Seu código de indicação</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Compartilhe o link ou peça pra outra barbearia digitar seu código no cadastro.
          </p>
        </div>

        {/* Código */}
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Código</label>
          <div className="flex gap-2">
            <Input
              value={code}
              readOnly
              className="font-mono text-lg tracking-wider bg-muted/30"
            />
            <Button
              onClick={() => copy(code, 'code')}
              variant="outline"
              className="shrink-0"
            >
              {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Link pronto</label>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-muted/30 text-sm" />
            <Button onClick={() => copy(referralLink, 'link')} variant="outline" className="shrink-0">
              {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={shareWhatsApp} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar no WhatsApp
          </Button>
          {slug && (
            <Button
              variant="outline"
              onClick={() => window.open(referralLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir página de cadastro
            </Button>
          )}
        </div>
      </Card>

      {/* Como funciona */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Como funciona</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Step n={1} title="Compartilhe seu link" desc="Envie pra outras barbearias por WhatsApp, redes sociais ou pessoalmente." />
          <Step n={2} title="Eles se cadastram" desc="A barbearia indicada cria a conta e começa o teste grátis de 14 dias." />
          <Step n={3} title="Você ganha R$ 50" desc="Quando ela paga a primeira fatura, R$ 50 entram no seu saldo disponível." />
        </div>
      </Card>

      {/* Histórico */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Histórico de indicações</h2>
          <span className="text-sm text-muted-foreground">{credits.length} no total</span>
        </div>
        {credits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma indicação ainda. Compartilhe seu link pra começar a ganhar!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {credits.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {c.referred_company_name ?? 'Barbearia'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cadastro: {formatDate(c.created_at)}
                    {c.available_at && ` · Liberado: ${formatDate(c.available_at)}`}
                    {c.applied_at && ` · Aplicado: ${formatDate(c.applied_at)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-primary">{formatBRL(c.amount_cents)}</p>
                  <Badge variant="outline" className={`text-xs mt-1 ${STATUS_LABEL[c.status].className}`}>
                    {STATUS_LABEL[c.status].label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className={`text-xl md:text-2xl font-bold ${color}`}>{value}</div>
    </Card>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="space-y-2">
      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm">
        {n}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
