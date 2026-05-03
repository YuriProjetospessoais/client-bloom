import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GripVertical, Trash2, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppointmentsByRange, type Appointment } from '@/hooks/queries/useAppointments';
import { useUpdateAppointment } from '@/hooks/mutations/useAppointmentMutations';
import { useServices } from '@/hooks/queries/useServices';
import { useProfessionals } from '@/hooks/queries/useProfessionals';
import { useClients } from '@/hooks/queries/useClients';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const WEEKDAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  selectedProfessionalId: string;
  onNewAppointment: (time?: string, date?: string) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
}

function getWeekDays(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

function fmt(d: Date): string { return d.toISOString().split('T')[0]; }

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-500';
    case 'completed': return 'bg-blue-500';
    case 'cancelled': return 'bg-red-500';
    case 'no_show': return 'bg-gray-500';
    default: return 'bg-yellow-500';
  }
};

export default function WeeklyScheduleView({ selectedProfessionalId, onNewAppointment, onDeleteAppointment }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekDays(new Date())[0]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const from = fmt(weekDays[0]);
  const to = fmt(weekDays[6]);

  const { data: appts = [] } = useAppointmentsByRange(from, to);
  const { data: services = [] } = useServices({ onlyActive: false });
  const { data: clients = [] } = useClients();
  const { data: professionals = [] } = useProfessionals({ onlyActive: false });
  const updateAppt = useUpdateAppointment();

  const filtered = useMemo(() => {
    return appts.filter(a => selectedProfessionalId === 'all' || a.professional_id === selectedProfessionalId);
  }, [appts, selectedProfessionalId]);

  const map: Record<string, Appointment[]> = {};
  for (const d of weekDays) map[fmt(d)] = [];
  for (const a of filtered) {
    if (map[a.date]) map[a.date].push(a);
  }

  const getAt = (dateStr: string, time: string) =>
    map[dateStr]?.find(a => a.start_time?.slice(0, 5) === time);

  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? '—';
  const serviceName = (id: string | null) => services.find(s => s.id === id)?.name ?? '';
  const profName = (id: string | null) => professionals.find(p => p.id === id)?.name ?? '';

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const [targetDate, targetTime] = destination.droppableId.split('__');
    if (!targetDate || !targetTime) return;
    const appt = filtered.find(a => a.id === draggableId);
    if (!appt) return;
    if (appt.date === targetDate && appt.start_time?.slice(0, 5) === targetTime) return;
    if (getAt(targetDate, targetTime)) {
      toast.error('Esse horário já está ocupado.');
      return;
    }
    const svc = services.find(s => s.id === appt.service_id);
    const newEnd = addMinutes(targetTime, svc?.duration_minutes ?? 30);
    try {
      await updateAppt.mutateAsync({
        id: draggableId,
        patch: { date: targetDate, start_time: targetTime, end_time: newEnd },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code;
      if (code === '23505' || /já existe um agendamento/i.test(msg)) {
        toast.error('Esse horário acabou de ser ocupado.');
      }
    }
  };

  const todayStr = fmt(new Date());
  const isThisWeek = weekDays.some(d => fmt(d) === todayStr);
  const weekLabel = `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold text-foreground capitalize min-w-[200px] text-center">{weekLabel}</span>
            <Button variant="outline" size="icon" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {!isThisWeek && (
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(getWeekDays(new Date())[0])} className="text-primary">
              <CalendarIcon className="w-4 h-4 mr-1" /> Esta semana
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-1 mb-1">
              <div className="p-2" />
              {weekDays.map(day => {
                const ds = fmt(day);
                const isToday = ds === todayStr;
                const cnt = map[ds]?.length || 0;
                return (
                  <div key={ds} className={cn('text-center p-2 rounded-lg', isToday && 'bg-primary/10')}>
                    <div className={cn('text-xs font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                      {WEEKDAY_NAMES_SHORT[day.getDay()]}
                    </div>
                    <div className={cn('text-lg font-bold', isToday ? 'text-primary' : 'text-foreground')}>{day.getDate()}</div>
                    {cnt > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{cnt}</Badge>}
                  </div>
                );
              })}
            </div>

            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-[70px_repeat(7,1fr)] gap-1 mb-1">
                <div className="flex items-center justify-center text-xs text-muted-foreground font-medium p-1">{time}</div>
                {weekDays.map(day => {
                  const ds = fmt(day);
                  const cellId = `${ds}__${time}`;
                  const appt = getAt(ds, time);
                  const isToday = ds === todayStr;
                  return (
                    <Droppable key={cellId} droppableId={cellId}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={cn('min-h-[56px] rounded-md border p-1 transition-colors',
                            snapshot.isDraggingOver ? 'border-primary bg-primary/10 border-dashed'
                              : isToday ? 'border-primary/20 bg-primary/5'
                              : 'border-border/30 bg-muted/10 hover:bg-muted/20')}>
                          {appt ? (
                            <Draggable draggableId={appt.id} index={0}>
                              {(dp, ds2) => (
                                <div ref={dp.innerRef} {...dp.draggableProps}
                                  className={cn('rounded-md p-1.5 text-xs h-full flex flex-col gap-0.5',
                                    ds2.isDragging ? 'shadow-lg ring-2 ring-primary bg-card z-50' : 'bg-card/80')}>
                                  <div className="flex items-center gap-1">
                                    <div {...dp.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0">
                                      <GripVertical className="w-3 h-3" />
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColor(appt.status)}`} />
                                    <span className="font-medium text-foreground truncate">{clientName(appt.client_id)}</span>
                                  </div>
                                  <p className="text-muted-foreground truncate pl-4">{serviceName(appt.service_id)}</p>
                                  <div className="flex items-center justify-between pl-4">
                                    <span className="text-muted-foreground truncate">{profName(appt.professional_id)}</span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive flex-shrink-0"
                                      onClick={() => onDeleteAppointment(appt)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ) : (
                            <button className="w-full h-full min-h-[48px] flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                              onClick={() => onNewAppointment(time, ds)}>
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
