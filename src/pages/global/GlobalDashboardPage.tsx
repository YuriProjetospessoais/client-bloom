import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Activity
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
  Cell
} from 'recharts';
import { companiesStore, plansStore } from '@/lib/store';
import { CompanyModal } from '@/components/modals/CompanyModal';

const mrrData = [
  { month: 'Set', value: 32000 },
  { month: 'Out', value: 38000 },
  { month: 'Nov', value: 42000 },
  { month: 'Dez', value: 45200 },
  { month: 'Jan', value: 52000 },
  { month: 'Fev', value: 58000 },
];

const planDistribution = [
  { name: 'Starter', value: 45, color: 'hsl(243, 75%, 59%)' },
  { name: 'Professional', value: 52, color: 'hsl(258, 90%, 66%)' },
  { name: 'Enterprise', value: 27, color: 'hsl(142, 76%, 36%)' },
];

export default function GlobalDashboardPage() {
  const { t } = useLanguage();
  const [companyModalOpen, setCompanyModalOpen] = useState(false);

  const companies = companiesStore.getAll();
  const plans = plansStore.getAll();
  const totalUsers = companies.reduce((acc, c) => acc + c.currentUsers, 0);

  const stats = [
    { 
      title: 'Total Empresas', 
      value: companies.length.toString(), 
      change: '+12%', 
      up: true,
      icon: Building2, 
      color: 'text-primary', 
      bg: 'bg-primary/10'
    },
    { 
      title: 'Total Usuários', 
      value: totalUsers.toLocaleString('pt-BR'), 
      change: '+8%', 
      up: true,
      icon: Users, 
      color: 'text-accent', 
      bg: 'bg-accent/10'
    },
    { 
      title: 'MRR Estimado', 
      value: 'R$ 58.000', 
      change: '+15%', 
      up: true,
      icon: TrendingUp, 
      color: 'text-success', 
      bg: 'bg-success/10'
    },
    { 
      title: 'Planos Ativos', 
      value: plans.filter(p => p.active).length.toString(), 
      change: '0%', 
      up: true,
      icon: CreditCard, 
      color: 'text-warning', 
      bg: 'bg-warning/10'
    },
  ];

  const recentCompanies = companies.slice(0, 4);

  const handleSaveCompany = (data: any) => {
    if (data.id) {
      companiesStore.update(data.id, data);
    } else {
      companiesStore.create(data);
    }
    setCompanyModalOpen(false);
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
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Painel Global 🌐
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema
          </p>
        </div>
        
        <Button 
          className="gradient-primary text-primary-foreground gap-1.5 w-fit"
          onClick={() => setCompanyModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.up ? 'text-success' : 'text-destructive'}`}>
                    {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Chart */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Evolução do MRR</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-success font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +15%
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
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
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'MRR']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorMrr)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Empresas por Plano</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} empresas`, 'Quantidade']}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {planDistribution.map((item, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }} />
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Companies */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Empresas Recentes</CardTitle>
                <CardDescription className="text-xs">Últimas empresas cadastradas</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todas <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentCompanies.map((company, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.plan} • {company.currentUsers}/{company.userLimit} usuários</p>
                    </div>
                  </div>
                  <Badge 
                    className={company.status === 'active' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-destructive/20 text-destructive'
                    }
                  >
                    {company.status === 'active' ? 'Ativo' : 'Suspenso'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal */}
      <CompanyModal
        open={companyModalOpen}
        onOpenChange={setCompanyModalOpen}
        onSave={handleSaveCompany}
      />
    </motion.div>
  );
}
