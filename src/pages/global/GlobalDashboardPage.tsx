import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TrendingUp, CreditCard } from 'lucide-react';

export default function GlobalDashboardPage() {
  const { t } = useLanguage();

  const stats = [
    { title: 'Total Empresas', value: '124', change: '+12%', icon: Building2, color: 'text-primary' },
    { title: 'Total Usuários', value: '1,847', change: '+8%', icon: Users, color: 'text-accent' },
    { title: 'MRR Estimado', value: 'R$ 45.200', change: '+15%', icon: TrendingUp, color: 'text-green-500' },
    { title: 'Planos Ativos', value: '5', change: '0%', icon: CreditCard, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.nav.dashboard}</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">{stat.change}</span> em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Empresas por Plano</CardTitle>
            <CardDescription>Distribuição de clientes por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { plan: 'Starter', count: 45, percentage: 36 },
                { plan: 'Professional', count: 52, percentage: 42 },
                { plan: 'Enterprise', count: 27, percentage: 22 },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{item.plan}</span>
                    <span className="text-muted-foreground">{item.count} empresas</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Últimas Empresas Cadastradas</CardTitle>
            <CardDescription>Empresas registradas recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Clínica Saúde Total', plan: 'Professional', date: '15 Jan 2026' },
                { name: 'Barbearia Vintage', plan: 'Starter', date: '14 Jan 2026' },
                { name: 'Studio Beauty', plan: 'Enterprise', date: '12 Jan 2026' },
                { name: 'Clínica Bem Estar', plan: 'Professional', date: '10 Jan 2026' },
              ].map((company, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.plan}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{company.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
