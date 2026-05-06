import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Phone, MessageCircle, Calendar, Cake, RotateCcw, ShoppingBag, Loader2 } from 'lucide-react';
import { handleCall, handleWhatsApp } from '@/lib/actions';

type AlertKind = 'birthday' | 'return' | 'restock';
interface AlertItem {
  id: string;
  kind: AlertKind;
  client: string;
  phone: string | null;
  detail: string;
  daysInfo: string;
  badgeClass: string;
}

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

function useAlerts(companyId: string | null) {
  return useQuery({
    queryKey: ['alerts', companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<AlertItem[]> => {
      const today = new Date();
      const in7 = new Date(); in7.setDate(today.getDate() + 7);
      const in14 = new Date(); in14.setDate(today.getDate() + 14);

      const [clientsRes, atRiskRes, salesRes] = await Promise.all([
        supabase.from('clients').select('id, name, phone, birthday')
          .eq('company_id', companyId!).eq('active', true).not('birthday', 'is', null),
        supabase.rpc('get_at_risk_clients', { _company_id: companyId!, _days_threshold: 60 }),
        supabase.from('product_sales')
          .select('id, client_id, estimated_end_date, products(name), clients(name, phone)')
          .eq('company_id', companyId!)
          .gte('estimated_end_date', today.toISOString().slice(0, 10))
          .lte('estimated_end_date', in14.toISOString().slice(0, 10)),
      ]);

      const out: AlertItem[] = [];

      // Birthdays in next 7 days (compare month/day)
      const mdNow = today.getMonth() * 31 + today.getDate();
      const mdEnd = in7.getMonth() * 31 + in7.getDate();
      (clientsRes.data ?? []).forEach((c: any) => {
        if (!c.birthday) return;
        const b = new Date(c.birthday + 'T00:00:00');
        const md = b.getMonth() * 31 + b.getDate();
        const inRange = mdEnd >= mdNow ? md >= mdNow && md <= mdEnd : md >= mdNow || md <= mdEnd;
        if (!inRange) return;
        const daysTo = Math.max(0, Math.round((new Date(today.getFullYear(), b.getMonth(), b.getDate()).getTime() - today.getTime()) / 86400000));
        out.push({
          id: `bday-${c.id}`, kind: 'birthday', client: c.name, phone: c.phone,
          detail: 'Aniversário próximo',
          daysInfo: daysTo === 0 ? 'Hoje!' : `Em ${daysTo}d`,
          badgeClass: 'bg-pink-500/20 text-pink-500',
        });
      });

      // Return / at-risk (last visit > 60d)
      (atRiskRes.data ?? []).forEach((c: any) => {
        out.push({
          id: `ret-${c.client_id}`, kind: 'return', client: c.name, phone: c.phone,
          detail: 'Cliente sem retorno',
          daysInfo: `${c.days_since}d sem vir`,
          badgeClass: c.days_since > 90
            ? 'bg-red-500/20 text-red-500'
            : 'bg-orange-500/20 text-orange-500',
        });
      });

      // Restock (product ending in next 14d)
      (salesRes.data ?? []).forEach((s: any) => {
        const end = new Date(s.estimated_end_date + 'T00:00:00');
        const days = Math.max(0, Math.round((end.getTime() - today.getTime()) / 86400000));
        out.push({
          id: `restock-${s.id}`, kind: 'restock',
          client: s.clients?.name ?? 'Cliente',
          phone: s.clients?.phone ?? null,
          detail: `Recompra: ${s.products?.name ?? 'produto'}`,
          daysInfo: days === 0 ? 'Acaba hoje' : `${days}d restantes`,
          badgeClass: 'bg-amber-500/20 text-amber-500',
        });
      });

      return out;
    },
  });
}

const KIND_META: Record<AlertKind, { label: string; icon: typeof Bell }> = {
  birthday: { label: 'Aniversários', icon: Cake },
  return:   { label: 'Retorno',      icon: RotateCcw },
  restock:  { label: 'Recompra',     icon: ShoppingBag },
};

function AlertCard({ a, readOnly = false }: { a: AlertItem; readOnly?: boolean }) {
  const Icon = KIND_META[a.kind].icon;
  return (
    <Card className="bg-background/50 border-border/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(a.client)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-foreground truncate">{a.client}</h4>
              <Badge className={`flex-shrink-0 ${a.badgeClass}`}>{a.daysInfo}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Icon className="w-3.5 h-3.5" /> {a.detail}
            </p>
            {a.phone && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {a.phone}
              </p>
            )}
          </div>
        </div>
        {!readOnly && a.phone && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="flex-1 gap-1" onClick={() => handleWhatsApp(a.phone!, undefined, a.client)}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleCall(a.phone!, a.client)}>
              <Phone className="w-4 h-4" /> Ligar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full text-center py-12 text-muted-foreground">
      <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
      <p>Nenhum alerta no momento. Volte mais tarde.</p>
    </div>
  );
}

export default function AlertsPage() {
  const { t } = useLanguage();
  const companyId = useTenantId();
  const { data: alerts = [], isLoading } = useAlerts(companyId);

  const groups = useMemo(() => ({
    all: alerts,
    birthday: alerts.filter(a => a.kind === 'birthday'),
    return:   alerts.filter(a => a.kind === 'return'),
    restock:  alerts.filter(a => a.kind === 'restock'),
  }), [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.alerts}</h1>
          <p className="text-muted-foreground mt-1">Aniversários, retornos e recompras</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Bell className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-orange-500">{groups.all.length} alertas</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="all" className="gap-2"><Calendar className="w-4 h-4" />Todos ({groups.all.length})</TabsTrigger>
            <TabsTrigger value="birthday" className="gap-2"><Cake className="w-4 h-4" />Aniversários ({groups.birthday.length})</TabsTrigger>
            <TabsTrigger value="return" className="gap-2"><RotateCcw className="w-4 h-4" />Retorno ({groups.return.length})</TabsTrigger>
            <TabsTrigger value="restock" className="gap-2"><ShoppingBag className="w-4 h-4" />Recompra ({groups.restock.length})</TabsTrigger>
          </TabsList>
          {(['all', 'birthday', 'return', 'restock'] as const).map(k => (
            <TabsContent key={k} value={k} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups[k].length === 0 ? <EmptyState /> : groups[k].map(a => <AlertCard key={a.id} a={a} />)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
