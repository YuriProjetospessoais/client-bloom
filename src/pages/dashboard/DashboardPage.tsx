import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Bell, 
  UserMinus, 
  Gift,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';

const stats = [
  { key: 'totalSales', value: 'R$ 45.230', change: '+12%', up: true, icon: TrendingUp },
  { key: 'activeLeads', value: '127', change: '+8%', up: true, icon: Target },
  { key: 'pendingAlerts', value: '23', change: '-5%', up: false, icon: Bell },
  { key: 'inactiveClients', value: '45', change: '+3%', up: true, icon: UserMinus },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          {t.dashboard.welcomeBack}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Aqui está o resumo do seu negócio hoje.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="card-interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.dashboard[stat.key as keyof typeof t.dashboard]}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className={`flex items-center text-xs ${stat.up ? 'text-success' : 'text-destructive'}`}>
                  {stat.up ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {stat.change} vs mês anterior
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>{t.dashboard.leadsByStage}</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Gráfico de Leads por Estágio</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>{t.dashboard.monthlyRevenue}</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Gráfico de Receita Mensal</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
