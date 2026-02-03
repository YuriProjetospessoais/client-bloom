import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Target, 
  Users,
  ArrowUpRight,
  Phone,
  Plus,
  Clock,
  ChevronRight,
  Flame,
  TrendingUp,
  BarChart3,
  Cake,
  RefreshCw,
  Package,
  UserPlus
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { leadsStore, clientsStore, appointmentsStore, analyticsStore, opportunitiesStore, productSalesStore } from '@/lib/store';
import { LeadModal } from '@/components/modals/LeadModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { handleCall } from '@/lib/actions';
import { toast } from 'sonner';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  // Get real data from stores
  const [analytics, setAnalytics] = useState(() => analyticsStore.getAnalytics());
  const [appointmentsChartData, setAppointmentsChartData] = useState(() => analyticsStore.getAppointmentsChartData());

  const leads = leadsStore.getAll();
  const clients = clientsStore.getAll();
  const todayAppointments = appointmentsStore.getByDate(new Date().toISOString().split('T')[0]);
  const myLeads = leads.filter(l => l.stage !== 'closed' && l.stage !== 'lost');
  
  // Get opportunities data
  const upcomingBirthdays = clientsStore.getUpcomingBirthdays(7);
  const productsNearEnd = productSalesStore.getProductsNearEnd(7);

  // Refresh analytics
  useEffect(() => {
    opportunitiesStore.generateOpportunities();
    setAnalytics(analyticsStore.getAnalytics());
    setAppointmentsChartData(analyticsStore.getAppointmentsChartData());
  }, [leads.length, clients.length, todayAppointments.length]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const stats = [
    { title: 'Meus Leads', value: myLeads.length.toString(), change: `+${analytics.leadsByStage.new || 0}`, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Atendimentos Hoje', value: todayAppointments.length.toString(), change: '', icon: Calendar, color: 'text-accent', bg: 'bg-accent/10' },
    { title: 'Agendamentos Mês', value: analytics.appointmentsByMonth.toString(), change: '+15%', icon: BarChart3, color: 'text-success', bg: 'bg-success/10' },
    { title: 'Clientes Ativos', value: analytics.totalClients.toString(), change: '+5', icon: Users, color: 'text-info', bg: 'bg-info/10' },
  ];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleSaveLead = (leadData: any) => {
    if (leadData.id) {
      leadsStore.update(leadData.id, leadData);
    } else {
      leadsStore.create(leadData);
    }
    toast.success('Lead salvo com sucesso!');
    setLeadModalOpen(false);
  };

  const handleSaveAppointment = (appointmentData: any) => {
    const dateStr = new Date().toISOString().split('T')[0];
    appointmentsStore.create({
      clientId: '',
      procedureId: '',
      professionalId: '',
      clientName: appointmentData.client || '',
      procedureName: appointmentData.procedure || '',
      professionalName: appointmentData.professional || '',
      date: appointmentData.date || dateStr,
      time: appointmentData.time,
      duration: appointmentData.duration || 60,
      status: 'pending',
    });
    toast.success('Agendamento criado!');
    setAppointmentModalOpen(false);
  };

  return (
    <motion.div className="space-y-6 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Mais do que cortes. Relacionamentos.
          </p>
        </motion.div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2 rounded-xl border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            onClick={() => setLeadModalOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Novo Lead
          </Button>
          <Button 
            className="gap-2 rounded-xl gradient-gold text-primary-foreground hover:opacity-90"
            onClick={() => setAppointmentModalOpen(true)}
          >
            <Calendar className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="barber-card">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 lg:p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 lg:h-5 lg:w-5 ${stat.color}`} />
                  </div>
                  {stat.change && <span className="flex items-center gap-1 text-xs font-medium text-success"><ArrowUpRight className="w-3 h-3" />{stat.change}</span>}
                </div>
                <p className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs lg:text-sm text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Appointments Chart */}
      <Card className="barber-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-display">Agendamentos por Dia</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-medium">{analytics.appointmentsByWeek} na semana</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value, 'Agendamentos']}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="barber-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10"><Clock className="h-4 w-4 text-primary" /></div>
              <div>
                <CardTitle className="text-base font-display">Agenda de Hoje</CardTitle>
                <CardDescription className="text-xs">{todayAppointments.length} agendamentos</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">Ver todos <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.length > 0 ? todayAppointments.slice(0, 4).map((apt, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-semibold text-sm">{apt.time}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{apt.clientName}</p>
                  <p className="text-sm text-muted-foreground truncate">{apt.procedureName}</p>
                </div>
                <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs rounded-full">{apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</Badge>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum agendamento hoje</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="barber-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10"><Flame className="h-4 w-4 text-accent" /></div>
              <div>
                <CardTitle className="text-base font-display">Meus Leads Ativos</CardTitle>
                <CardDescription className="text-xs">{myLeads.length} leads</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myLeads.length > 0 ? myLeads.slice(0, 4).map((lead, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.name}`} />
                  <AvatarFallback className="bg-accent/10 text-accent text-sm">{getInitials(lead.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{lead.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{lead.value}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10" onClick={() => handleCall(lead.phone, lead.name)}><Phone className="w-4 h-4" /></Button>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum lead ativo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Opportunity Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Birthday Opportunities */}
        <Card className="barber-card overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/20">
                <Cake className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base font-display">Aniversariantes</CardTitle>
                <CardDescription className="text-xs">{upcomingBirthdays.length} próximos 7 dias</CardDescription>
              </div>
            </div>
            <Badge className="bg-accent/20 text-accent hover:bg-accent/30 rounded-full">
              {upcomingBirthdays.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBirthdays.length > 0 ? upcomingBirthdays.slice(0, 3).map((client, index) => {
              const birthDate = new Date(client.birthDate!);
              const today = new Date();
              const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
              if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1);
              const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${client.name}`} />
                    <AvatarFallback className="bg-accent/20 text-accent text-xs">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {daysUntil === 0 ? '🎂 Hoje!' : daysUntil === 1 ? '🎁 Amanhã!' : `Em ${daysUntil} dias`}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 px-2 rounded-full hover:bg-primary/10"
                    onClick={() => {
                      handleCall(client.phone, client.name);
                      toast.success(`Ligando para ${client.name}...`);
                    }}
                  >
                    <Phone className="w-3 h-3" />
                  </Button>
                </div>
              );
            }) : (
              <div className="text-center py-4 text-muted-foreground">
                <Cake className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Nenhum aniversário próximo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repurchase Opportunities */}
        <Card className="barber-card overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-display">Recompras</CardTitle>
                <CardDescription className="text-xs">{productsNearEnd.length} produtos acabando</CardDescription>
              </div>
            </div>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 rounded-full">
              {productsNearEnd.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {productsNearEnd.length > 0 ? productsNearEnd.slice(0, 3).map((sale, index) => {
              const daysUntilEnd = Math.ceil((new Date(sale.estimatedEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const client = clientsStore.getById(sale.clientId);
              
              return (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sale.productName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sale.clientName} • {daysUntilEnd <= 0 ? '⚠️ Acabou!' : daysUntilEnd <= 3 ? `⏰ ${daysUntilEnd}d` : `${daysUntilEnd}d`}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 px-2 rounded-full hover:bg-primary/10"
                    onClick={() => {
                      if (client) {
                        handleCall(client.phone, client.name);
                        toast.success(`Ligando para ${sale.clientName}...`);
                      }
                    }}
                  >
                    <Phone className="w-3 h-3" />
                  </Button>
                </div>
              );
            }) : (
              <div className="text-center py-4 text-muted-foreground">
                <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">Nenhum produto acabando</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LeadModal open={leadModalOpen} onOpenChange={setLeadModalOpen} onSave={handleSaveLead} />
      <AppointmentModal open={appointmentModalOpen} onOpenChange={setAppointmentModalOpen} onSave={handleSaveAppointment} />
    </motion.div>
  );
}
