import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/queries/useTenantId';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Calendar, DollarSign, Users, AlertTriangle, Trophy, Briefcase, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type Kpis = Record<string, number | boolean | null>;

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function UserDashboardPage() {
  const companyId = useTenantId();
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['user-kpis', companyId, role, user?.id],
    enabled: !!companyId && !!role,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_kpis', {
        _company_id: companyId!,
        _user_role: role ?? null,
        _user_id: user?.id ?? null,
      });
      if (error) throw error;
      return data as Kpis;
    },
  });

  const { data: revenueChart = [] } = useQuery({
    queryKey: ['user-revenue-chart', companyId, user?.id],
    enabled: !!companyId && role === 'employee',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_chart_data', {
        _company_id: companyId!, _days: 30, _user_id: user?.id ?? null,
      });
      if (error) throw error;
      return (data ?? []) as Array<{ d: string; revenue: number; appointments_count: number }>;
    },
  });

  useEffect(() => {
    if (!error) return;
    const msg = (error as Error).message ?? '';
    if (msg.includes('42501') || msg.toLowerCase().includes('sem permiss')) {
      toast.error('Sem permissão. Selecione uma barbearia.');
      navigate('/select-tenant');
    }
  }, [error, navigate]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const hideFinance = Boolean(kpis?.is_finance_hidden) || role === 'secretary';
  const isEmployee = role === 'employee';

  return (
    <motion.div className="space-y-6 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Olá, {user?.name?.split(' ')[0] || 'usuário'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Seu painel pessoal</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-card/80 shadow-md">
          <CardContent className="p-5">
            <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{Number(kpis?.appointments_today ?? 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">Atendimentos hoje</p>
          </CardContent>
        </Card>

        {!hideFinance && (
          <>
            <Card className="border-0 bg-card/80 shadow-md">
              <CardContent className="p-5">
                <div className="p-2.5 rounded-xl bg-success/10 w-fit mb-3">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold text-foreground">{formatBRL(Number(kpis?.revenue_month ?? 0))}</p>
                <p className="text-sm text-muted-foreground mt-1">Receita do mês</p>
              </CardContent>
            </Card>

            {isEmployee && (
              <Card className="border-0 bg-card/80 shadow-md">
                <CardContent className="p-5">
                  <div className="p-2.5 rounded-xl bg-accent/10 w-fit mb-3">
                    <Briefcase className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatBRL(Number(kpis?.commission_month ?? 0))}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comissão ({Number(kpis?.commission_percent ?? 0)}%)
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {isEmployee && kpis?.my_rank != null && (
          <Card className="border-0 bg-card/80 shadow-md">
            <CardContent className="p-5">
              <div className="p-2.5 rounded-xl bg-warning/10 w-fit mb-3">
                <Trophy className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                #{Number(kpis.my_rank)}/{Number(kpis.total_professionals ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Meu ranking</p>
            </CardContent>
          </Card>
        )}

        {isEmployee && (
          <Card className="border-0 bg-card/80 shadow-md">
            <CardContent className="p-5">
              <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{Number(kpis?.my_appointments_month ?? 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">Atendimentos no mês</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-card/80 shadow-md">
          <CardContent className="p-5">
            <div className="p-2.5 rounded-xl bg-warning/10 w-fit mb-3">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">{Number(kpis?.new_clients_this_month ?? 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">Novos clientes (mês)</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/80 shadow-md">
          <CardContent className="p-5">
            <div className="p-2.5 rounded-xl bg-destructive/10 w-fit mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground">{Number(kpis?.no_show_rate_month ?? 0).toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-1">Taxa de no-show</p>
          </CardContent>
        </Card>
      </div>

      {isEmployee && !hideFinance && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Minha receita (30 dias)</CardTitle>
            <CardDescription>Apenas atendimentos concluídos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="urev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11}
                    tickFormatter={(v) => v?.slice(5)} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    formatter={(v: number) => [formatBRL(v), 'Receita']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#urev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
