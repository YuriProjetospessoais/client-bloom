import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, TrendingUp, CreditCard, Clock, CheckCircle, XCircle, Calendar, Loader2,
} from 'lucide-react';

type Kpis = Record<string, number>;

export default function GlobalDashboardPage() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['global-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_global_kpis');
      if (error) throw error;
      return data as Kpis;
    },
  });

  const { data: expiringSoon = [] } = useQuery({
    queryKey: ['expiring-trials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug, trial_ends_at')
        .is('first_payment_at', null)
        .gt('trial_ends_at', new Date().toISOString())
        .lt('trial_ends_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('trial_ends_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const cards = [
    { title: 'Total empresas',     value: kpis?.total_companies ?? 0,         icon: Building2,   color: 'text-primary',    bg: 'bg-primary/10' },
    { title: 'Empresas ativas',    value: kpis?.active_companies ?? 0,        icon: CheckCircle, color: 'text-success',    bg: 'bg-success/10' },
    { title: 'Em trial',           value: kpis?.trial_companies ?? 0,         icon: Clock,       color: 'text-warning',    bg: 'bg-warning/10' },
    { title: 'Pagantes',           value: kpis?.paying_companies ?? 0,        icon: CreditCard,  color: 'text-accent',     bg: 'bg-accent/10' },
    { title: 'Trials expirados',   value: kpis?.expired_trials ?? 0,          icon: XCircle,     color: 'text-destructive',bg: 'bg-destructive/10' },
    { title: 'Agendamentos (mês)', value: kpis?.appointments_this_month ?? 0, icon: Calendar,    color: 'text-primary',    bg: 'bg-primary/10' },
    { title: 'Concluídos (mês)',   value: kpis?.completed_this_month ?? 0,    icon: CheckCircle, color: 'text-success',    bg: 'bg-success/10' },
    { title: 'Total de clientes',  value: kpis?.total_clients ?? 0,           icon: Users,       color: 'text-accent',     bg: 'bg-accent/10' },
    { title: 'Novas empresas (30d)', value: kpis?.companies_last_30d ?? 0,    icon: TrendingUp,  color: 'text-success',    bg: 'bg-success/10' },
  ];

  return (
    <motion.div className="space-y-6 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Painel global 🌐</h1>
        <p className="text-muted-foreground mt-1">Visão de plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="border-0 bg-card/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-5">
              <div className={`p-2.5 rounded-xl ${c.bg} w-fit mb-3`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{Number(c.value).toLocaleString('pt-BR')}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Trials expirando em 7 dias
          </CardTitle>
          <CardDescription>Empresas que ainda não fizeram o primeiro pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          {expiringSoon.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum trial expirando em breve.</p>
          ) : (
            <div className="space-y-2">
              {expiringSoon.map((c) => {
                const daysLeft = Math.ceil((new Date(c.trial_ends_at!).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                    </div>
                    <Badge className={daysLeft <= 2 ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}>
                      {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
