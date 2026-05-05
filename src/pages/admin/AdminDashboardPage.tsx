import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Calendar, DollarSign, Users, TrendingUp, AlertTriangle, MessageCircle, Loader2,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { handleWhatsApp } from '@/lib/actions';

type Kpis = Record<string, number | boolean | null>;

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const companyId = useTenantId();
  const { user } = useAuth();

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis', companyId, user?.role, user?.id],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        _company_id: companyId!,
        _user_role: user?.role ?? null,
        _user_id: user?.id ?? null,
      });
      if (error) throw error;
      return data as Kpis;
    },
  });

  const { data: revenueChart = [] } = useQuery({
    queryKey: ['revenue-chart', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_chart_data', {
        _company_id: companyId!, _days: 30, _user_id: null,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ d: string; revenue: number; appointments_count: number }>;
    },
  });

  const { data: topServices = [] } = useQuery({
    queryKey: ['top-services', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_services', {
        _company_id: companyId!, _limit: 5,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ service_id: string; name: string; count: number; revenue: number }>;
    },
  });

  const { data: ranking = [] } = useQuery({
    queryKey: ['prof-ranking', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_professional_ranking', {
        _company_id: companyId!,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        professional_id: string; name: string; appointments_count: number;
        revenue: number; no_show_rate: number; avg_ticket: number;
      }>;
    },
  });

  const { data: atRisk = [] } = useQuery({
    queryKey: ['at-risk', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_at_risk_clients', {
        _company_id: companyId!, _days_threshold: 60,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        client_id: string; name: string; phone: string | null;
        last_visit: string; days_since: number;
      }>;
    },
  });

  const revenueDelta = useMemo(() => {
    if (!kpis) return { up: true, pct: 0 };
    const cur = Number(kpis.revenue_month ?? 0);
    const prev = Number(kpis.revenue_last_month ?? 0);
    if (prev === 0) return { up: cur >= 0, pct: cur > 0 ? 100 : 0 };
    const pct = ((cur - prev) / prev) * 100;
    return { up: pct >= 0, pct: Math.abs(pct) };
  }, [kpis]);

  const isEmpty = !kpisLoading && kpis && Number(kpis.appointments_today) === 0
    && Number(kpis.new_clients_this_month) === 0 && revenueChart.every(r => r.appointments_count === 0);

  if (kpisLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const cards = [
    {
      title: 'Receita do mês', value: formatBRL(Number(kpis?.revenue_month ?? 0)),
      icon: DollarSign, color: 'text-success', bg: 'bg-success/10',
      delta: `${revenueDelta.up ? '+' : '-'}${revenueDelta.pct.toFixed(1)}%`, up: revenueDelta.up,
    },
    {
      title: 'Ticket médio', value: formatBRL(Number(kpis?.avg_ticket_month ?? 0)),
      icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10',
    },
    {
      title: 'Agendamentos hoje',
      value: `${Number(kpis?.appointments_today ?? 0)}/${Number(kpis?.appointments_total_slots ?? 0)}`,
      icon: Calendar, color: 'text-accent', bg: 'bg-accent/10',
    },
    {
      title: 'Novos clientes (mês)', value: String(kpis?.new_clients_this_month ?? 0),
      icon: Users, color: 'text-warning', bg: 'bg-warning/10',
    },
    {
      title: 'Taxa de no-show', value: `${Number(kpis?.no_show_rate_month ?? 0).toFixed(1)}%`,
      icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10',
    },
  ];

  return (
    <motion.div className="space-y-6 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Painel da barbearia</h1>
        <p className="text-muted-foreground mt-1">Visão geral em tempo real</p>
      </div>

      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            Sem dados ainda. Cadastre seu primeiro cliente e agendamento para começar.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="border-0 bg-card/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
                {c.delta && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${c.up ? 'text-success' : 'text-destructive'}`}>
                    {c.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {c.delta}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Receita (últimos 30 dias)</CardTitle>
            <CardDescription>Apenas atendimentos concluídos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false}
                    tickFormatter={(v) => v?.slice(5)} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    formatter={(v: number) => [formatBRL(v), 'Receita']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Top serviços (mês)</CardTitle>
            <CardDescription>Por receita gerada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    formatter={(v: number) => [formatBRL(v), 'Receita']}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topServices.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Ranking de profissionais (mês)</CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem atendimentos este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2">Profissional</th>
                    <th className="text-right py-2">Atendimentos</th>
                    <th className="text-right py-2">Receita</th>
                    <th className="text-right py-2">Ticket médio</th>
                    <th className="text-right py-2">No-show</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r) => (
                    <tr key={r.professional_id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-foreground">{r.name}</td>
                      <td className="text-right">{r.appointments_count}</td>
                      <td className="text-right">{formatBRL(Number(r.revenue))}</td>
                      <td className="text-right">{formatBRL(Number(r.avg_ticket))}</td>
                      <td className="text-right">{Number(r.no_show_rate).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Clientes em risco
          </CardTitle>
          <CardDescription>Sem visitas há 60+ dias</CardDescription>
        </CardHeader>
        <CardContent>
          {atRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum cliente em risco. 🎉</p>
          ) : (
            <div className="space-y-2">
              {atRisk.map((c) => (
                <div key={c.client_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Última visita: {new Date(c.last_visit).toLocaleDateString('pt-BR')} · {c.days_since} dias
                    </p>
                  </div>
                  {c.phone && (
                    <Button size="sm" variant="outline" className="gap-1.5"
                      onClick={() => handleWhatsApp(c.phone!, `Olá ${c.name}, sentimos sua falta! Que tal agendar um horário?`, c.name)}>
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
