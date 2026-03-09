import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  ChevronRight,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isToday, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  clientName: string;
  serviceName: string;
  notes: string | null;
}

export default function BarberDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('today');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // Get professional_id for current user
      const { data: prof } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!prof) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Fetch appointments — RLS already restricts to own appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id, date, start_time, end_time, status, notes,
          clients!appointments_client_id_fkey(name),
          services!appointments_service_id_fkey(name)
        `)
        .eq('professional_id', prof.id)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const mapped: Booking[] = (appointments || []).map((apt: any) => ({
        id: apt.id,
        date: apt.date,
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        clientName: apt.clients?.name || 'Cliente',
        serviceName: apt.services?.name || 'Serviço',
        notes: apt.notes,
      }));

      setBookings(mapped);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const todayBookings = bookings.filter((b) => b.date === todayStr);
  const weekBookings = bookings.filter((b) => {
    const d = new Date(b.date + 'T00:00:00');
    return d >= weekStart && d <= weekEnd;
  });
  const upcomingBookings = bookings.filter((b) => {
    const d = new Date(b.date + 'T00:00:00');
    return d >= startOfDay(new Date());
  });
  const calendarBookings = bookings.filter(
    (b) => b.date === format(selectedDate, 'yyyy-MM-dd')
  );

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'today':
        return todayBookings;
      case 'week':
        return weekBookings;
      case 'upcoming':
        return upcomingBookings;
      case 'calendar':
        return calendarBookings;
      default:
        return todayBookings;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Agendado', className: 'bg-amber-500/20 text-amber-600' },
      confirmed: { label: 'Confirmado', className: 'bg-emerald-500/20 text-emerald-500' },
      completed: { label: 'Concluído', className: 'bg-primary/20 text-primary' },
      no_show: { label: 'Não compareceu', className: 'bg-destructive/20 text-destructive' },
    };
    const s = map[status] || map.scheduled;
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Dates that have bookings (for calendar dots)
  const bookingDates = [...new Set(bookings.map((b) => b.date))];

  const filtered = getFilteredBookings();

  return (
    <motion.div className="space-y-6 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">Seus agendamentos e compromissos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hoje', value: todayBookings.length, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Esta Semana', value: weekBookings.length, icon: CalendarIcon, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Próximos', value: upcomingBookings.length, icon: ChevronRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="barber-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        {/* Calendar picker (only in calendar tab) */}
        <TabsContent value="calendar" className="mt-4">
          <Card className="glass-card mb-4">
            <CardContent className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                locale={ptBR}
                modifiers={{ hasBooking: bookingDates.map((d) => new Date(d + 'T00:00:00')) }}
                modifiersClassNames={{ hasBooking: 'bg-primary/20 font-bold' }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings list - rendered for all tabs */}
        <div className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {activeTab === 'today' && `Agendamentos de Hoje — ${format(new Date(), "dd 'de' MMMM", { locale: ptBR })}`}
                {activeTab === 'week' && 'Agendamentos da Semana'}
                {activeTab === 'upcoming' && 'Próximos Agendamentos'}
                {activeTab === 'calendar' && `Agendamentos — ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`}
              </CardTitle>
              <CardDescription>{filtered.length} agendamento{filtered.length !== 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhum agendamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      {/* Time block */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <span className="text-lg font-bold leading-none">
                          {booking.start_time.slice(0, 5)}
                        </span>
                        <span className="text-[10px] mt-0.5 text-muted-foreground">
                          {booking.end_time.slice(0, 5)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-foreground truncate">{booking.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">{booking.serviceName}</span>
                        </div>
                        {activeTab !== 'today' && (
                          <div className="flex items-center gap-2 mt-1">
                            <CalendarIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(booking.date + 'T00:00:00'), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      {getStatusBadge(booking.status)}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </motion.div>
  );
}
