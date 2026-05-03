import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Calendar as CalendarIcon, Trash2, GripVertical, LayoutList, LayoutGrid } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import WeeklyScheduleView from '@/components/schedule/WeeklyScheduleView';
import { useAppointmentsByDate, type Appointment } from '@/hooks/queries/useAppointments';
import { useUpdateAppointment, useDeleteAppointment } from '@/hooks/mutations/useAppointmentMutations';
import { useServices } from '@/hooks/queries/useServices';
import { useProfessionals } from '@/hooks/queries/useProfessionals';
import { useClients } from '@/hooks/queries/useClients';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
type ViewMode = 'daily' | 'weekly';

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const getStatusColor = (s: string) => {
  switch (s) {
    case 'confirmed': return 'bg-green-500';
    case 'completed': return 'bg-blue-500';
    case 'cancelled': return 'bg-red-500';
    case 'no_show': return 'bg-gray-500';
    default: return 'bg-yellow-500';
  }
};
const getStatusLabel = (s: string) => ({
  confirmed: 'Confirmado', completed: 'Realizado', cancelled: 'Cancelado',
  no_show: 'Não compareceu', scheduled: 'Pendente',
}[s] ?? s);

export default function SchedulePage() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfId, setSelectedProfId] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [delOpen, setDelOpen] = useState(false);
  const [delAppt, setDelAppt] = useState<Appointment | null>(null);

  const dateStr = currentDate.toISOString().split('T')[0];
  const { data: appts = [] } = useAppointmentsByDate(dateStr);
  const { data: services = [] } = useServices({ onlyActive: false });
  const { data: professionals = [] } = useProfessionals({ onlyActive: true });
  const { data: clients = [] } = useClients();
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();

  const filtered = useMemo(
    () => appts.filter(a => selectedProfId === 'all' || a.professional_id === selectedProfId),
    [appts, selectedProfId]
  );

  const getAt = (time: string) => filtered.find(a => a.start_time?.slice(0, 5) === time);
  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? '—';
  const serviceInfo = (id: string | null) => services.find(s => s.id === id);
  const profName = (id: string | null) => professionals.find(p => p.id === id)?.name ?? '';

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleNew = (time?: string, date?: string) => {
    setSelectedTime(time);
    setSelectedDate(date);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (delAppt) {
      await deleteAppt.mutateAsync(delAppt.id);
      setDelOpen(false);
      setDelAppt(null);
    }
  };

  const handleDailyDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newTime = destination.droppableId;
    const appt = filtered.find(a => a.id === draggableId);
    if (!appt || appt.start_time?.slice(0, 5) === newTime) return;
    if (filtered.find(a => a.start_time?.slice(0, 5) === newTime)) {
      toast.error('Esse horário já está ocupado.');
      return;
    }
    const svc = serviceInfo(appt.service_id);
    const newEnd = addMinutes(newTime, svc?.duration_minutes ?? 30);
    try {
      await updateAppt.mutateAsync({ id: draggableId, patch: { start_time: newTime, end_time: newEnd } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code;
      if (code === '23505' || /já existe um agendamento/i.test(msg)) {
        toast.error('Esse horário acabou de ser ocupado.');
      }
    }
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.schedule}</h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === 'daily'
              ? `${appts.length} agendamento${appts.length !== 1 ? 's' : ''} para este dia`
              : 'Visualização semanal • arraste para reagendar'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'daily' ? 'default' : 'ghost'} size="sm" className="rounded-none gap-1.5" onClick={() => setViewMode('daily')}>
              <LayoutList className="w-4 h-4" /> Dia
            </Button>
            <Button variant={viewMode === 'weekly' ? 'default' : 'ghost'} size="sm" className="rounded-none gap-1.5" onClick={() => setViewMode('weekly')}>
              <LayoutGrid className="w-4 h-4" /> Semana
            </Button>
          </div>
          <Select value={selectedProfId} onValueChange={setSelectedProfId}>
            <SelectTrigger className="w-[180px]">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="gradient-primary text-white gap-2" onClick={() => handleNew()}>
            <Plus className="w-4 h-4" /> Novo
          </Button>
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <WeeklyScheduleView
          selectedProfessionalId={selectedProfId}
          onNewAppointment={handleNew}
          onDeleteAppointment={(a) => { setDelAppt(a); setDelOpen(true); }}
        />
      ) : (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <CardTitle className="text-lg capitalize">{formatDate(currentDate)}</CardTitle>
                {!isToday && (
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-primary">
                    <CalendarIcon className="w-4 h-4 mr-1" /> Hoje
                  </Button>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum agendamento neste dia. Clique em + para criar.
              </p>
            )}
            <DragDropContext onDragEnd={handleDailyDragEnd}>
              <div className="space-y-2">
                {timeSlots.map((time) => {
                  const appt = getAt(time);
                  const svc = appt ? serviceInfo(appt.service_id) : null;
                  return (
                    <Droppable key={time} droppableId={time}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex items-stretch gap-4 p-3 rounded-lg border transition-colors ${
                            snapshot.isDraggingOver ? 'border-primary bg-primary/10'
                              : appt ? 'border-border/50 bg-muted/30'
                              : 'border-border/50 hover:bg-muted/20'
                          }`}>
                          <div className="flex items-center gap-2 w-20 flex-shrink-0">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{time}</span>
                          </div>
                          {appt ? (
                            <Draggable draggableId={appt.id} index={0}>
                              {(dp, ds2) => (
                                <div ref={dp.innerRef} {...dp.draggableProps}
                                  className={`flex-1 flex items-center gap-4 ${
                                    ds2.isDragging ? 'opacity-90 bg-card rounded-lg p-2 shadow-lg ring-2 ring-primary' : ''
                                  }`}>
                                  <div {...dp.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div className={`w-1 self-stretch rounded-full ${getStatusColor(appt.status)}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">{clientName(appt.client_id)}</span>
                                      {svc && <Badge variant="secondary" className="text-xs">{svc.duration_minutes}min</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{svc?.name ?? '—'}</p>
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{profName(appt.professional_id)}</p>
                                      <Badge className="text-xs bg-muted/40 text-foreground">
                                        {getStatusLabel(appt.status)}
                                      </Badge>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => { setDelAppt(appt); setDelOpen(true); }}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground"
                                onClick={() => handleNew(time, dateStr)}>
                                <Plus className="w-4 h-4 mr-1" /> Horário livre - Clique para agendar
                              </Button>
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          </CardContent>
        </Card>
      )}

      <AppointmentModal open={modalOpen} onOpenChange={setModalOpen}
        defaultTime={selectedTime} defaultDate={selectedDate || dateStr} />

      <ConfirmDialog open={delOpen} onOpenChange={setDelOpen}
        title="Excluir Agendamento"
        description={`Deseja excluir este agendamento das ${delAppt?.start_time?.slice(0, 5)}?`}
        onConfirm={confirmDelete} confirmLabel="Excluir" variant="destructive" />
    </div>
  );
}
