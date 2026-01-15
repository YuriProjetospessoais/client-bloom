import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, UserPlus, Calendar, Bell, TrendingUp, Gift } from 'lucide-react';

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const stats = [
    { title: 'Leads Ativos', value: '47', change: '+12', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Clientes', value: '234', change: '+5', icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Agendamentos Hoje', value: '18', change: '', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Alertas Pendentes', value: '12', change: '', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const opportunities = [
    { client: 'Maria Silva', procedure: 'Limpeza de pele', value: 'R$ 250', stage: 'Proposta' },
    { client: 'João Santos', procedure: 'Botox', value: 'R$ 1.200', stage: 'Negociação' },
    { client: 'Ana Costa', procedure: 'Peeling', value: 'R$ 450', stage: 'Fechamento' },
  ];

  const birthdays = [
    { name: 'Carlos Oliveira', date: 'Hoje', lastVisit: '15/12/2025' },
    { name: 'Patricia Lima', date: 'Amanhã', lastVisit: '20/11/2025' },
    { name: 'Roberto Alves', date: '17/01', lastVisit: '05/01/2026' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.nav.dashboard}</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo, {user?.name} • {user?.companyName}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                {stat.change && (
                  <span className="text-sm text-green-500 font-medium">{stat.change}</span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Oportunidades em Andamento</CardTitle>
              <CardDescription>Leads com maior potencial</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunities.map((opp, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{opp.client}</p>
                    <p className="text-sm text-muted-foreground">{opp.procedure}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{opp.value}</p>
                    <p className="text-xs text-primary">{opp.stage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <Gift className="h-5 w-5 text-pink-500" />
            <div>
              <CardTitle>Aniversariantes</CardTitle>
              <CardDescription>Clientes para parabenizar</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {birthdays.map((birthday, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{birthday.name}</p>
                    <p className="text-sm text-muted-foreground">Última visita: {birthday.lastVisit}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    birthday.date === 'Hoje' 
                      ? 'bg-pink-500/20 text-pink-500' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {birthday.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <div>
            <CardTitle>Clientes Inativos</CardTitle>
            <CardDescription>Clientes sem visita há mais de 60 dias</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Fernanda Reis', lastVisit: '45 dias', procedure: 'Corte feminino' },
              { name: 'Lucas Mendes', lastVisit: '62 dias', procedure: 'Barba' },
              { name: 'Camila Souza', lastVisit: '78 dias', procedure: 'Coloração' },
              { name: 'Ricardo Nunes', lastVisit: '90 dias', procedure: 'Tratamento capilar' },
              { name: 'Julia Ferreira', lastVisit: '55 dias', procedure: 'Manicure' },
              { name: 'Bruno Costa', lastVisit: '70 dias', procedure: 'Massagem' },
            ].map((client, index) => (
              <div key={index} className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <p className="font-medium text-foreground">{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.procedure}</p>
                <p className="text-xs text-orange-500 mt-1">Sem visita há {client.lastVisit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
