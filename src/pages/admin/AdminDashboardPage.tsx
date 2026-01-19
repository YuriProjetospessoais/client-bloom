import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Target, 
  Users, 
  UserPlus, 
  Calendar, 
  Bell, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Plus,
  Clock,
  Flame,
  DollarSign,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { leadsStore, clientsStore, appointmentsStore } from '@/lib/store';
import { LeadModal } from '@/components/modals/LeadModal';
import { ClientModal } from '@/components/modals/ClientModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { handleCall } from '@/lib/actions';

// Chart data
const revenueData = [
  { month: 'Set', value: 28000 },
  { month: 'Out', value: 35000 },
  { month: 'Nov', value: 32000 },
  { month: 'Dez', value: 45000 },
  { month: 'Jan', value: 52000 },
  { month: 'Fev', value: 48000 },
];

const leadsChartData = [
  { name: 'Novos', value: 35, color: 'hsl(243, 75%, 59%)' },
  { name: 'Contato', value: 28, color: 'hsl(258, 90%, 66%)' },
  { name: 'Proposta', value: 18, color: 'hsl(199, 89%, 48%)' },
  { name: 'Negociação', value: 12, color: 'hsl(142, 76%, 36%)' },
  { name: 'Fechados', value: 8, color: 'hsl(38, 92%, 50%)' },
];

const conversionData = [
  { stage: 'Leads', value: 100, fill: 'hsl(243, 75%, 59%)' },
  { stage: 'Contato', value: 75, fill: 'hsl(258, 90%, 66%)' },
  { stage: 'Proposta', value: 45, fill: 'hsl(199, 89%, 48%)' },
  { stage: 'Fechamento', value: 28, fill: 'hsl(142, 76%, 36%)' },
];

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  // Get real data from stores
  const leads = leadsStore.getAll();
  const clients = clientsStore.getAll();
  const appointments = appointmentsStore.getAll();
  const todayAppointments = appointmentsStore.getByDate(new Date().toISOString().split('T')[0]);

  const stats = [
    { 
      title: 'Leads Ativos', 
      value: leads.filter(l => l.stage !== 'closed' && l.stage !== 'lost').length.toString(), 
      change: '+12%', 
      up: true,
      icon: UserPlus, 
      color: 'text-primary', 
      bg: 'bg-primary/10',
      gradient: 'from-primary/20 to-accent/10'
    },
    { 
      title: 'Oportunidades', 
      value: leads.filter(l => l.stage === 'proposal' || l.stage === 'negotiation').length.toString(), 
      change: '+8%', 
      up: true,
      icon: Target, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      gradient: 'from-accent/20 to-primary/10'
    },
    { 
      title: 'Vendas do Mês', 
      value: 'R$ 52.480', 
      change: '+23%', 
      up: true,
      icon: DollarSign, 
      color: 'text-success', 
      bg: 'bg-success/10',
      gradient: 'from-success/20 to-success/5'
    },
    { 
      title: 'Alertas de Retorno', 
      value: '12', 
      change: '-3', 
      up: false,
      icon: Bell, 
      color: 'text-warning', 
      bg: 'bg-warning/10',
      gradient: 'from-warning/20 to-warning/5'
    },
  ];

  const hotLeads = leads
    .filter(l => l.stage === 'negotiation' || l.stage === 'proposal')
    .slice(0, 4);

  const upcomingReturns = [
    { name: 'Maria Silva', procedure: 'Limpeza de pele', days: 2, phone: '(11) 99999-1111' },
    { name: 'João Santos', procedure: 'Botox', days: 5, phone: '(11) 99999-2222' },
    { name: 'Ana Costa', procedure: 'Peeling', days: 7, phone: '(11) 99999-3333' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSaveLead = (leadData: any) => {
    if (leadData.id) {
      leadsStore.update(leadData.id, leadData);
    } else {
      leadsStore.create(leadData);
    }
    setLeadModalOpen(false);
  };

  const handleSaveClient = (clientData: any) => {
    if (clientData.id) {
      clientsStore.update(clientData.id, clientData);
    } else {
      clientsStore.create(clientData);
    }
    setClientModalOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6 pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo do seu negócio • {user?.companyName}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === p 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="gradient-primary text-primary-foreground gap-1.5"
              onClick={() => setLeadModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Lead
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1.5"
              onClick={() => setClientModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Cliente
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1.5"
              onClick={() => setAppointmentModalOpen(true)}
            >
              <Calendar className="w-4 h-4" />
              Agendar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group"
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} backdrop-blur-sm hover:shadow-xl transition-all duration-300`}>
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-gradient-to-br from-background/10 to-transparent" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.up ? 'text-success' : 'text-destructive'}`}>
                    {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Receita Mensal</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-success font-medium">+23% vs período anterior</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
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
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(243, 75%, 59%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Leads by Stage */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Leads por Estágio</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {leadsChartData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Agenda de Hoje</CardTitle>
                <CardDescription className="text-xs">{todayAppointments.length} agendamentos</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.length > 0 ? todayAppointments.slice(0, 4).map((apt, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  {apt.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{apt.clientName}</p>
                  <p className="text-sm text-muted-foreground truncate">{apt.procedureName}</p>
                </div>
                <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                  {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </Badge>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum agendamento hoje</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hot Leads */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <Flame className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Leads Quentes</CardTitle>
                <CardDescription className="text-xs">Maior potencial de fechamento</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {hotLeads.length > 0 ? hotLeads.map((lead, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-accent/10 text-accent text-sm">
                    {getInitials(lead.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{lead.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{lead.value}</p>
                </div>
                <Badge 
                  className={`text-xs ${
                    lead.stage === 'negotiation' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  {lead.stage === 'negotiation' ? 'Negociação' : 'Proposta'}
                </Badge>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum lead quente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Alerts */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Bell className="h-4 w-4 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Retornos Próximos</CardTitle>
                <CardDescription className="text-xs">Clientes para contatar</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReturns.map((client, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-warning/10 text-warning text-sm">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{client.procedure}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    client.days <= 3 
                      ? 'bg-destructive/20 text-destructive' 
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {client.days}d
                  </span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-success"
                    onClick={() => handleCall(client.phone, client.name)}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversion Funnel */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Funil de Conversão</CardTitle>
                <CardDescription>Taxa de conversão por estágio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Taxa']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <LeadModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        onSave={handleSaveLead}
      />

      <ClientModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        onSave={handleSaveClient}
      />

      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        onSave={() => setAppointmentModalOpen(false)}
      />
    </motion.div>
  );
}
