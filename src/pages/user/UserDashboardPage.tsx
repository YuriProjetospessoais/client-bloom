import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, UserPlus, Calendar, Bell, CheckCircle } from 'lucide-react';

export default function UserDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const stats = [
    { title: 'Meus Leads', value: '12', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Agendamentos Hoje', value: '5', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Alertas Pendentes', value: '3', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Atendimentos Mês', value: '28', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const myAppointments = [
    { client: 'Maria Silva', time: '09:00', procedure: 'Limpeza de pele' },
    { client: 'Carlos Santos', time: '10:30', procedure: 'Botox' },
    { client: 'Ana Costa', time: '14:00', procedure: 'Peeling' },
    { client: 'Roberto Alves', time: '15:30', procedure: 'Consulta' },
    { client: 'Patricia Lima', time: '17:00', procedure: 'Tratamento Facial' },
  ];

  const myLeads = [
    { name: 'João Ferreira', stage: 'Contato', value: 'R$ 500' },
    { name: 'Camila Souza', stage: 'Proposta', value: 'R$ 1.200' },
    { name: 'Bruno Costa', stage: 'Negociação', value: 'R$ 800' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.nav.dashboard}</h1>
        <p className="text-muted-foreground mt-1">
          Olá, {user?.name} • {user?.companyName}
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
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle>Meus Agendamentos de Hoje</CardTitle>
              <CardDescription>Próximos atendimentos</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myAppointments.map((apt, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{apt.client}</p>
                    <p className="text-sm text-muted-foreground">{apt.procedure}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">{apt.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle>Meus Leads Ativos</CardTitle>
              <CardDescription>Oportunidades em andamento</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myLeads.map((lead, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="text-sm text-primary">{lead.stage}</p>
                  </div>
                  <span className="font-semibold text-foreground">{lead.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
