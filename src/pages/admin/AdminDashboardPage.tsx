import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  RotateCcw, 
  DollarSign,
  UserPlus,
  Calendar,
  Plus,
  Phone,
  MessageSquare,
  History,
  Gift,
  UserX,
  Package,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  clientsStore, 
  appointmentsStore, 
  opportunitiesStore,
  productSalesStore,
  productsStore 
} from '@/lib/store';
import { ClientModal } from '@/components/modals/ClientModal';
import { LeadModal } from '@/components/modals/LeadModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { ClientHistoryModal } from '@/components/modals/ClientHistoryModal';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('today');
  
  // Modals
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Data
  const clients = clientsStore.getAll();
  const appointments = appointmentsStore.getAll();
  const opportunities = opportunitiesStore.getAll();
  const products = productsStore.getAll();

  // Generate opportunities on mount
  useEffect(() => {
    opportunitiesStore.generateOpportunities();
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments
    .filter(a => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Stats calculation
  const clientsToday = todayAppointments.length;
  const freeSlots = 8 - clientsToday;
  const pendingReturns = opportunities.filter(o => o.type === 'repurchase' && o.status === 'pending').length;
  const todayRevenue = todayAppointments.reduce((acc) => acc + 50, 0);

  // Birthday opportunities
  const birthdayOpportunities = opportunities.filter(o => o.type === 'birthday' && o.status === 'pending');

  // Inactive clients (no appointment in 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const inactiveClients = clients.filter(client => {
    const lastAppointment = appointments
      .filter(a => a.clientId === client.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!lastAppointment) return true;
    return new Date(lastAppointment.date) < thirtyDaysAgo;
  });

  // Products running low
  const repurchaseOpportunities = opportunities.filter(o => o.type === 'repurchase' && o.status === 'pending');

  // Chart data
  const chartData = [
    { name: 'Seg', value: 4200 },
    { name: 'Ter', value: 3800 },
    { name: 'Qua', value: 5100 },
    { name: 'Qui', value: 4600 },
    { name: 'Sex', value: 6200 },
    { name: 'Sáb', value: 7800 },
  ];

  const handleCall = (phone: string | undefined) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
      toast({ title: 'Ligando...', description: `Iniciando chamada` });
    }
  };

  const handleWhatsApp = (phone: string | undefined) => {
    if (phone) {
      window.open(`https://wa.me/55${phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleViewHistory = (client: any) => {
    setSelectedClient(client);
    setHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with greeting and quick actions */}
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
            onClick={() => setClientModalOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Novo Cliente
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 rounded-xl border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            onClick={() => setLeadModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
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

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        {(['today', 'week', 'month'] as const).map((period) => (
          <Button
            key={period}
            variant={periodFilter === period ? 'default' : 'outline'}
            size="sm"
            className={`rounded-xl ${periodFilter === period ? 'gradient-gold text-primary-foreground' : ''}`}
            onClick={() => setPeriodFilter(period)}
          >
            {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Clientes Hoje', value: clientsToday, change: '+2', icon: Users, positive: true },
          { label: 'Horários Livres', value: freeSlots, change: '+1', icon: Clock, positive: true },
          { label: 'Retornos Pendentes', value: pendingReturns, change: '+7', icon: RotateCcw, positive: false },
          { label: 'Faturamento Hoje', value: `R$${todayRevenue}`, change: '+R$115', icon: DollarSign, positive: true, highlight: true },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`barber-card ${stat.highlight ? 'ring-2 ring-primary/20' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className="w-5 h-5 text-primary/60" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                  <Badge 
                    variant="secondary" 
                    className={`rounded-full ${stat.positive ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
                  >
                    {stat.positive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {stat.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="barber-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-display">
                Agenda de Hoje
                <Badge variant="secondary" className="ml-2 rounded-full">{todayAppointments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum agendamento para hoje</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 rounded-xl"
                    onClick={() => setAppointmentModalOpen(true)}
                  >
                    Agendar cliente
                  </Button>
                </div>
              ) : (
                todayAppointments.map((apt) => {
                  const client = clients.find(c => c.id === apt.clientId);
                  return (
                    <div 
                      key={apt.id} 
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-lg font-bold text-foreground">{apt.time}</div>
                          <div className="text-xs text-muted-foreground">+ {Math.floor(Math.random() * 2000)}pts</div>
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${client?.name}`} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {client?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{client?.name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">{apt.procedureName || 'Corte e Barba'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="rounded-full hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleWhatsApp(client?.phone)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="rounded-full hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleCall(client?.phone)}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="rounded-full hover:bg-primary/10 hover:text-primary"
                          onClick={() => client && handleViewHistory(client)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Birthdays */}
          <Card className="barber-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="w-5 h-5 text-primary" />
                Aniversários Próximos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {birthdayOpportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aniversário próximo</p>
              ) : (
                birthdayOpportunities.slice(0, 2).map((opp) => {
                  const client = clients.find(c => c.id === opp.clientId);
                  return (
                    <div key={opp.id} className="flex items-center gap-3 py-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${client?.name}`} />
                        <AvatarFallback>{client?.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{client?.name}</p>
                        <p className="text-xs text-muted-foreground">🎂 {opp.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Inactive Clients */}
          <Card className="barber-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-warning/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserX className="w-5 h-5 text-warning" />
                Clientes Inativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inactiveClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todos os clientes estão ativos!</p>
              ) : (
                inactiveClients.slice(0, 2).map((client) => (
                  <div key={client.id} className="flex items-center gap-3 py-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${client.name}`} />
                      <AvatarFallback>{client.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground">Sem retornar há 30 dias</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Products Running Low */}
          <Card className="barber-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-destructive/10 to-transparent rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="w-5 h-5 text-destructive" />
                Produtos em Falta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repurchaseOpportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto para recompra</p>
              ) : (
                repurchaseOpportunities.slice(0, 2).map((opp) => {
                  const product = products.find(p => p.id === opp.productId);
                  return (
                    <div key={opp.id} className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{product?.name || 'Produto'}</p>
                        <p className="text-xs text-muted-foreground">Acabando em 03 dias</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Statistics Chart */}
          <Card className="barber-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Estatísticas
                </CardTitle>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">R$5.320</span>
                  <Badge variant="secondary" className="ml-2 bg-success/10 text-success rounded-full">
                    +28%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <ClientModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        client={null}
        onSave={(data) => {
          clientsStore.create(data);
          setClientModalOpen(false);
        }}
      />
      <LeadModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        lead={null}
        onSave={(data) => {
          import('@/lib/store').then(({ leadsStore }) => {
            leadsStore.create(data as any);
          });
          setLeadModalOpen(false);
        }}
      />
      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        appointment={null}
        onSave={(data) => {
          appointmentsStore.create({
            clientId: '',
            procedureId: '',
            professionalId: '',
            clientName: data.client || '',
            procedureName: data.procedure || '',
            professionalName: data.professional || '',
            date: data.date || new Date().toISOString().split('T')[0],
            time: data.time || '09:00',
            duration: data.duration || 60,
            status: 'pending',
          });
          setAppointmentModalOpen(false);
        }}
      />
      <ClientHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        client={selectedClient}
      />
    </div>
  );
}
