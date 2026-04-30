import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Loader2, Check, X, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type PayoutStatus = 'pending' | 'paid' | 'rejected';

interface PayoutRow {
  id: string;
  company_id: string;
  amount_cents: number;
  status: PayoutStatus;
  pix_key: string;
  pix_key_type: string;
  notes: string | null;
  admin_notes: string | null;
  receipt_url: string | null;
  requested_at: string;
  paid_at: string | null;
  company_name?: string;
  company_email?: string;
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR');
}

const STATUS: Record<PayoutStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  paid: { label: 'Pago', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
};

export default function PayoutsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [tab, setTab] = useState<PayoutStatus>('pending');

  const reload = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('referral_payouts')
      .select('*')
      .order('requested_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as any[];
    const ids = Array.from(new Set(rows.map((r) => r.company_id)));
    let names: Record<string, { name: string; email: string | null }> = {};
    if (ids.length) {
      const { data: companies } = await supabase
        .from('companies').select('id, name, email').in('id', ids);
      names = Object.fromEntries((companies ?? []).map((c: any) => [c.id, { name: c.name, email: c.email }]));
    }
    setPayouts(rows.map((r) => ({
      ...r,
      company_name: names[r.company_id]?.name,
      company_email: names[r.company_id]?.email ?? undefined,
    })));
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const filtered = payouts.filter((p) => p.status === tab);
  const pendingTotal = payouts
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Banknote className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Resgates de indicação</h1>
          <p className="text-muted-foreground text-sm">
            Pagamentos Pix para barbearias que indicaram outras.
          </p>
        </div>
      </motion.div>

      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground tracking-wider">Total pendente</p>
          <p className="text-2xl font-bold text-amber-400">{formatBRL(pendingTotal)}</p>
        </div>
        <Button variant="outline" onClick={reload} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
        </Button>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as PayoutStatus)}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({payouts.filter((p) => p.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="paid">Pagos ({payouts.filter((p) => p.status === 'paid').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados ({payouts.filter((p) => p.status === 'rejected').length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">Nenhum resgate {STATUS[tab].label.toLowerCase()}.</Card>
          ) : (
            filtered.map((p) => <PayoutCard key={p.id} payout={p} onChanged={reload} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PayoutCard({ payout, onChanged }: { payout: PayoutRow; onChanged: () => void }) {
  const { toast } = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!' });
  };

  const markPaid = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('mark_payout_paid', {
      _payout_id: payout.id,
      _receipt_url: receiptUrl || null,
      _admin_notes: adminNotes || null,
    });
    setBusy(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Pagamento confirmado' });
    setPayOpen(false);
    onChanged();
  };

  const reject = async () => {
    if (!reason.trim()) {
      toast({ title: 'Informe o motivo', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc('reject_payout', {
      _payout_id: payout.id,
      _reason: reason.trim(),
    });
    setBusy(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Resgate rejeitado' });
    setRejectOpen(false);
    onChanged();
  };

  return (
    <Card className="p-4 md:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{payout.company_name ?? '—'}</h3>
          {payout.company_email && (
            <p className="text-xs text-muted-foreground">{payout.company_email}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Solicitado: {formatDateTime(payout.requested_at)}
            {payout.paid_at && ` · Pago: ${formatDateTime(payout.paid_at)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatBRL(payout.amount_cents)}</p>
          <Badge variant="outline" className={`text-xs mt-1 ${STATUS[payout.status].className}`}>
            {STATUS[payout.status].label}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs uppercase text-muted-foreground tracking-wider">
              Chave Pix ({payout.pix_key_type.toUpperCase()})
            </p>
            <p className="font-mono text-sm truncate">{payout.pix_key}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => copy(payout.pix_key)} className="shrink-0">
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
        {payout.notes && (
          <p className="text-sm text-muted-foreground border-t border-border pt-2">
            <span className="font-medium text-foreground">Obs do solicitante:</span> {payout.notes}
          </p>
        )}
        {payout.admin_notes && (
          <p className="text-sm text-muted-foreground border-t border-border pt-2">
            <span className="font-medium text-foreground">Obs interna:</span> {payout.admin_notes}
          </p>
        )}
        {payout.receipt_url && (
          <a href={payout.receipt_url} target="_blank" rel="noreferrer"
             className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Ver comprovante
          </a>
        )}
      </div>

      {payout.status === 'pending' && (
        <div className="flex gap-2 justify-end pt-1">
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                <X className="w-4 h-4 mr-1" /> Rejeitar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Rejeitar resgate</DialogTitle></DialogHeader>
              <div className="space-y-2 py-2">
                <Label>Motivo (será mostrado ao solicitante)</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={reject} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar rejeição'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={payOpen} onOpenChange={setPayOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Check className="w-4 h-4 mr-1" /> Marcar como pago
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar pagamento de {formatBRL(payout.amount_cents)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label>Link do comprovante (opcional)</Label>
                  <Input value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Observação interna (opcional)</Label>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
                <Button onClick={markPaid} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar pagamento'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </Card>
  );
}