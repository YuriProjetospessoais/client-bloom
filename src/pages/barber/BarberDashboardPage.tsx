import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  StickyNote,
  Pencil,
  Ban,
} from 'lucide-react';
import { BlockTimeModal } from '@/components/modals/BlockTimeModal';
import { useTenant } from '@/lib/tenant/TenantContext';
import { format, startOfWeek, endOfWeek, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  notes: string | null;
  clientNotes: string | null;
  clientPreferences: Record<string, string> | null;
}

export default function BarberDashboardPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const companyId = tenant?.id;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Notes modal state
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesTarget, setNotesTarget] = useState<Booking | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Block time
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<{ id: string; date: string; start_time: string; end_time: string; reason: string | null }[]>([]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: prof } = await supabase
        .from('professionals')
        .select('id, company_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!prof) {
        setBookings([]);
        setLoading(false);
        return;
      }

      setProfessionalId(prof.id);

      // Fetch blocked slots for this professional
      const { data: blocks } = await supabase
        .from('blocked_slots')
        .select('id, date, start_time, end_time, reason')
        .eq('professional_id', prof.id)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      setBlockedSlots(blocks || []);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id, date, start_time, end_time, status, notes, client_id,
          clients!appointments_client_id_fkey(name, notes, preferences),
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
        clientId: apt.client_id,
        clientName: apt.clients?.name || 'Cliente',
        serviceName: apt.services?.name || 'Serviço',
        notes: apt.notes,
        clientNotes: apt.clients?.notes || null,
        clientPreferences: apt.clients?.preferences || null,
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

  // Realtime subscription for new appointments
  useEffect(() => {
    if (!user?.id) return;

    let professionalId: string | null = null;

    const setupRealtime = async () => {
      const { data: prof } = await supabase
        .from('professionals')
        .select('id, company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!prof) return;
      professionalId = prof.id;

      const channel = supabase
        .channel('barber-appointments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `professional_id=eq.${prof.id}`,
          },
          async (payload) => {
            const apt = payload.new as any;
            // Fetch client and service names
            const [{ data: client }, { data: service }] = await Promise.all([
              supabase.from('clients').select('name, notes, preferences').eq('id', apt.client_id).maybeSingle(),
              apt.service_id
                ? supabase.from('services').select('name').eq('id', apt.service_id).maybeSingle()
                : Promise.resolve({ data: null }),
            ]);

            const newBooking: Booking = {
              id: apt.id,
              date: apt.date,
              start_time: apt.start_time,
              end_time: apt.end_time,
              status: apt.status,
              clientId: apt.client_id,
              clientName: client?.name || 'Cliente',
              serviceName: service?.name || 'Serviço',
              notes: apt.notes,
              clientNotes: client?.notes || null,
              clientPreferences: client?.preferences as Record<string, string> | null,
            };

            setBookings((prev) => {
              // Avoid duplicates
              if (prev.some((b) => b.id === apt.id)) return prev;
              return [...prev, newBooking].sort((a, b) => {
                const cmp = a.date.localeCompare(b.date);
                return cmp !== 0 ? cmp : a.start_time.localeCompare(b.start_time);
              });
            });

            const dateFormatted = format(new Date(apt.date + 'T00:00:00'), "dd/MM", { locale: ptBR });
            toast.info(`🆕 Novo agendamento: ${client?.name || 'Cliente'} — ${dateFormatted} às ${apt.start_time.slice(0, 5)}`, {
              duration: 8000,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments',
            filter: `professional_id=eq.${prof.id}`,
          },
          (payload) => {
            const apt = payload.new as any;
            setBookings((prev) =>
              apt.status === 'cancelled'
                ? prev.filter((b) => b.id !== apt.id)
                : prev.map((b) => (b.id === apt.id ? { ...b, status: apt.status } : b))
            );

            if (apt.status === 'cancelled') {
              toast.warning('Um agendamento foi cancelado.', { duration: 5000 });
            }
          }
        )
        .subscribe();

      return channel;
    };

    let channelRef: ReturnType<typeof supabase.channel> | undefined;
    setupRealtime().then((ch) => { channelRef = ch; });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [user?.id]);

  const handleStatusChange = async (bookingId: string, newStatus: 'completed' | 'no_show') => {
    setUpdatingId(bookingId);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast.success(
        newStatus === 'completed' ? 'Agendamento concluído!' : 'Marcado como não compareceu'
      );
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + (err.message || ''));
    } finally {
      setUpdatingId(null);
    }
  };

  const openNotesModal = (booking: Booking) => {
    setNotesTarget(booking);
    setNotesValue(booking.clientNotes || '');
    setNotesModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!notesTarget) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ notes: notesValue })
        .eq('id', notesTarget.clientId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) =>
          b.clientId === notesTarget.clientId ? { ...b, clientNotes: notesValue } : b
        )
      );
      toast.success('Notas do cliente salvas!');
      setNotesModalOpen(false);
    } catch (err: any) {
      toast.error('Erro ao salvar notas: ' + (err.message || ''));
    } finally {
      setSavingNotes(false);
    }
  };

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
      case 'today': return todayBookings;
      case 'week': return weekBookings;
      case 'upcoming': return upcomingBookings;
      case 'calendar': return calendarBookings;
      default: return todayBookings;
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

  const bookingDates = [...new Set(bookings.map((b) => b.date))];
  const filtered = getFilteredBookings();
  const canChangeStatus = (status: string) => status === 'scheduled' || status === 'confirmed';

  const getClientPreferencesSummary = (booking: Booking) => {
    const parts: string[] = [];
    if (booking.clientPreferences?.cutStyle) parts.push(booking.clientPreferences.cutStyle);
    if (booking.clientNotes) parts.push(booking.clientNotes);
    if (booking.clientPreferences?.freeNotes) parts.push(booking.clientPreferences.freeNotes);
    return parts.join(' • ') || null;
  };

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
                  {filtered.map((booking) => {
                    const prefSummary = getClientPreferencesSummary(booking);
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors space-y-3"
                      >
                        <div className="flex items-center gap-4">
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
                          <div className="flex-shrink-0">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>

                        {/* Client notes */}
                        {prefSummary && (
                          <div className="flex items-start gap-2 px-2 py-2 rounded-lg bg-accent/10 border border-accent/20">
                            <StickyNote className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-accent-foreground/80 leading-relaxed">{prefSummary}</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {canChangeStatus(booking.status) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-950"
                                disabled={updatingId === booking.id}
                                onClick={() => handleStatusChange(booking.id, 'completed')}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Concluído
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                                disabled={updatingId === booking.id}
                                onClick={() => handleStatusChange(booking.id, 'no_show')}
                              >
                                <XCircle className="w-4 h-4" />
                                Não compareceu
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 ml-auto text-muted-foreground"
                            onClick={() => openNotesModal(booking)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Notas
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Notas do Cliente — {notesTarget?.clientName}
            </DialogTitle>
            <DialogDescription>
              Adicione preferências de corte, barba ou observações. Essas notas aparecerão automaticamente nos próximos agendamentos deste cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {notesTarget?.clientPreferences?.cutStyle && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Estilo de corte salvo</p>
                <p className="text-sm text-foreground">{notesTarget.clientPreferences.cutStyle}</p>
              </div>
            )}
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Ex: Prefere low fade, manter comprimento no topo, barba com navalha..."
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="gradient-primary text-white" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? 'Salvando...' : 'Salvar Notas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
