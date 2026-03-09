import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, parse, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon, Download, FileText, FileSpreadsheet,
  Users, CalendarDays, DollarSign, Scissors, TrendingUp, UserPlus, RotateCcw, UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CHART_COLORS = [
  'hsl(38, 55%, 50%)', 'hsl(30, 45%, 40%)', 'hsl(142, 60%, 40%)',
  'hsl(199, 70%, 50%)', 'hsl(25, 30%, 35%)', 'hsl(0, 72%, 51%)',
];

function generateMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase()),
    });
  }
  return options;
}

export default function MonthlyReportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId;
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const dateRange = useMemo(() => {
    const start = parse(selectedMonth, 'yyyy-MM', new Date());
    return { start: format(startOfMonth(start), 'yyyy-MM-dd'), end: format(endOfMonth(start), 'yyyy-MM-dd') };
  }, [selectedMonth]);

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['report-appointments', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('appointments')
        .select('*, professionals(name), services(name, price)')
        .eq('company_id', companyId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);
      return data ?? [];
    },
    enabled: !!companyId,
  });

  // Fetch clients
  const { data: allClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['report-clients', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('clients')
        .select('id, name, created_at')
        .eq('company_id', companyId);
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const isLoading = loadingAppts || loadingClients;

  // === METRICS ===
  const metrics = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const noShow = appointments.filter(a => a.status === 'no_show').length;
    const scheduled = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;

    // Revenue from completed appointments
    const revenue = appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);

    // Per barber
    const barberMap = new Map<string, { name: string; count: number; revenue: number }>();
    appointments.forEach(a => {
      const name = (a.professionals as any)?.name ?? 'Sem profissional';
      const existing = barberMap.get(name) || { name, count: 0, revenue: 0 };
      existing.count++;
      if (a.status === 'completed') existing.revenue += (a.services?.price ?? 0);
      barberMap.set(name, existing);
    });
    const barberStats = Array.from(barberMap.values()).sort((a, b) => b.count - a.count);
    const topBarber = barberStats[0]?.name ?? '-';

    // Services
    const serviceMap = new Map<string, number>();
    appointments.filter(a => a.status === 'completed').forEach(a => {
      const name = (a.services as any)?.name ?? 'Sem serviço';
      serviceMap.set(name, (serviceMap.get(name) ?? 0) + 1);
    });
    const serviceStats = Array.from(serviceMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const topService = serviceStats[0]?.name ?? '-';
    const totalServices = serviceStats.reduce((s, i) => s + i.count, 0);

    // Clients
    const servedClientIds = new Set(appointments.filter(a => a.status === 'completed').map(a => a.client_id));
    const totalServed = servedClientIds.size;

    const rangeStart = parse(dateRange.start, 'yyyy-MM-dd', new Date());
    const rangeEnd = parse(dateRange.end, 'yyyy-MM-dd', new Date());
    const newClients = allClients.filter(c => {
      const created = new Date(c.created_at);
      return isWithinInterval(created, { start: rangeStart, end: rangeEnd });
    });
    const newClientIds = new Set(newClients.map(c => c.id));
    const returningClients = Array.from(servedClientIds).filter(id => !newClientIds.has(id)).length;

    return {
      total, completed, cancelled, noShow, scheduled,
      revenue, barberStats, topBarber,
      serviceStats, topService, totalServices,
      totalServed, newClients: newClients.length, returningClients,
    };
  }, [appointments, allClients, dateRange]);

  // === EXPORT ===
  const exportCSV = () => {
    const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label ?? selectedMonth;
    const rows = [
      ['Relatório Mensal', monthLabel],
      [],
      ['AGENDAMENTOS'],
      ['Total', metrics.total],
      ['Concluídos', metrics.completed],
      ['Cancelados', metrics.cancelled],
      ['No-show', metrics.noShow],
      [],
      ['RECEITA'],
      ['Total', `R$ ${metrics.revenue.toFixed(2)}`],
      [],
      ['PROFISSIONAL', 'Atendimentos', 'Receita'],
      ...metrics.barberStats.map(b => [b.name, b.count, `R$ ${b.revenue.toFixed(2)}`]),
      [],
      ['SERVIÇO', 'Quantidade'],
      ...metrics.serviceStats.map(s => [s.name, s.count]),
      [],
      ['CLIENTES'],
      ['Atendidos', metrics.totalServed],
      ['Novos', metrics.newClients],
      ['Recorrentes', metrics.returningClients],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${selectedMonth}.csv`;
    link.click();
    toast({ title: 'CSV exportado com sucesso!' });
  };

  const exportPDF = () => {
    const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label ?? selectedMonth;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Relatório Mensal - ${monthLabel}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 14, 28);

    // Appointments summary
    autoTable(doc, {
      startY: 35,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de agendamentos', String(metrics.total)],
        ['Concluídos', String(metrics.completed)],
        ['Cancelados', String(metrics.cancelled)],
        ['No-show', String(metrics.noShow)],
        ['Receita total', `R$ ${metrics.revenue.toFixed(2)}`],
        ['Clientes atendidos', String(metrics.totalServed)],
        ['Novos clientes', String(metrics.newClients)],
        ['Clientes recorrentes', String(metrics.returningClients)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [163, 125, 63] },
    });

    // Barber stats
    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Desempenho por Profissional', 14, y1);
    autoTable(doc, {
      startY: y1 + 4,
      head: [['Profissional', 'Atendimentos', 'Receita']],
      body: metrics.barberStats.map(b => [b.name, String(b.count), `R$ ${b.revenue.toFixed(2)}`]),
      theme: 'striped',
      headStyles: { fillColor: [163, 125, 63] },
    });

    // Service stats
    const y2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('Serviços Realizados', 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Serviço', 'Quantidade']],
      body: metrics.serviceStats.map(s => [s.name, String(s.count)]),
      theme: 'striped',
      headStyles: { fillColor: [163, 125, 63] },
    });

    doc.save(`relatorio-${selectedMonth}.pdf`);
    toast({ title: 'PDF exportado com sucesso!' });
  };

  const selectedLabel = monthOptions.find(m => m.value === selectedMonth)?.label ?? '';

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Relatório Mensal</h1>
          <p className="text-muted-foreground text-sm mt-1">Desempenho da barbearia em {selectedLabel}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[220px]">
              <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={exportCSV} disabled={isLoading}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={isLoading}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={CalendarDays} label="Agendamentos" value={metrics.total} />
            <MetricCard icon={TrendingUp} label="Concluídos" value={metrics.completed} color="text-success" />
            <MetricCard icon={RotateCcw} label="Cancelados" value={metrics.cancelled} color="text-destructive" />
            <MetricCard icon={UserX} label="No-show" value={metrics.noShow} color="text-warning" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard icon={DollarSign} label="Receita Total" value={`R$ ${metrics.revenue.toFixed(2)}`} large />
            <MetricCard icon={Users} label="Clientes Atendidos" value={metrics.totalServed} large />
            <MetricCard icon={UserPlus} label="Novos Clientes" value={metrics.newClients} large />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard icon={Scissors} label="Profissional Top" value={metrics.topBarber} />
            <MetricCard icon={Scissors} label="Serviço Top" value={metrics.topService} />
            <MetricCard icon={RotateCcw} label="Clientes Recorrentes" value={metrics.returningClients} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments per barber */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Atendimentos por Profissional</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {metrics.barberStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.barberStats} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => [v, 'Atendimentos']} />
                      <Bar dataKey="count" fill="hsl(38, 55%, 50%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </CardContent>
            </Card>

            {/* Revenue per barber */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Receita por Profissional</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {metrics.barberStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.barberStats} layout="vertical">
                      <XAxis type="number" tickFormatter={v => `R$${v}`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Receita']} />
                      <Bar dataKey="revenue" fill="hsl(142, 60%, 40%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </CardContent>
            </Card>

            {/* Services pie chart */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Serviços Realizados</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {metrics.serviceStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.serviceStats}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {metrics.serviceStats.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, 'Atendimentos']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </CardContent>
            </Card>

            {/* Client breakdown */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Perfil de Clientes</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {metrics.totalServed > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Novos', value: metrics.newClients },
                          { name: 'Recorrentes', value: metrics.returningClients },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        <Cell fill="hsl(38, 55%, 50%)" />
                        <Cell fill="hsl(142, 60%, 40%)" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart />}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// === Sub-components ===

function MetricCard({ icon: Icon, label, value, color, large }: {
  icon: any; label: string; value: string | number; color?: string; large?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="card-interactive">
        <CardContent className={`flex items-center gap-4 ${large ? 'p-6' : 'p-4'}`}>
          <div className={`${large ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl gradient-gold flex items-center justify-center shrink-0`}>
            <Icon className={`${large ? 'w-6 h-6' : 'w-5 h-5'} text-primary-foreground`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className={`${large ? 'text-2xl' : 'text-lg'} font-bold ${color ?? 'text-foreground'} truncate`}>
              {value}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
      Sem dados para este período
    </div>
  );
}
