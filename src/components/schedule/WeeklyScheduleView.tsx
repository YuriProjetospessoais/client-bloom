import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GripVertical, Trash2, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { appointmentsStore, Appointment } from '@/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const WEEKDAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface WeeklyScheduleViewProps {
  selectedProfessional: string;
  onNewAppointment: (time?: string, date?: string) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
}

function getWeekDays(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7)); // shift to Monday
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    days.push(dd);
  }
  return days;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-500';
    case 'completed': return 'bg-blue-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-yellow-500';
  }
};

export default function WeeklyScheduleView({ selectedProfessional, onNewAppointment, onDeleteAppointment }: WeeklyScheduleViewProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const days = getWeekDays(new Date());
    return days[0];
  });
  const [weekAppointments, setWeekAppointments] = useState<Record<string, Appointment[]>>({});

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const loadWeekAppointments = useCallback(() => {
    const map: Record<string, Appointment[]> = {};
    for (const day of weekDays) {
      const dateStr = formatDateStr(day);
      let apts = appointmentsStore.getByDate(dateStr);
      if (selectedProfessional !== 'Todos') {
        apts = apts.filter(a => a.professionalName === selectedProfessional);
      }
      map[dateStr] = apts;
    }
    setWeekAppointments(map);
  }, [weekDays, selectedProfessional]);

  useEffect(() => {
    loadWeekAppointments();
  }, [loadWeekAppointments]);

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const handleThisWeek = () => {
    setWeekStart(getWeekDays(new Date())[0]);
  };

  const getAppointmentAt = (dateStr: string, time: string): Appointment | undefined => {
    return weekAppointments[dateStr]?.find(a => a.time === time);
  };

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    // droppableId format: "date__time"
    const [targetDate, targetTime] = destination.droppableId.split('__');
    if (!targetDate || !targetTime) return;

    // Find the appointment across all days
    let appointment: Appointment | undefined;
    for (const apts of Object.values(weekAppointments)) {
      appointment = apts.find(a => a.id === draggableId);
      if (appointment) break;
    }
    if (!appointment) return;
    if (appointment.date === targetDate && appointment.time === targetTime) return;

    // Check conflict at target
    const existing = getAppointmentAt(targetDate, targetTime);
    if (existing) {
      toast.error('Já existe um agendamento neste horário!');
      return;
    }

    const updated = appointmentsStore.update(draggableId, { date: targetDate, time: targetTime });
    if (updated) {
      loadWeekAppointments();
      const dayLabel = new Date(targetDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
      toast.success(`Agendamento movido para ${dayLabel} às ${targetTime}`);
    } else {
      toast.error('Não foi possível mover o agendamento.');
    }
  };

  const todayStr = formatDateStr(new Date());
  const isThisWeek = weekDays.some(d => formatDateStr(d) === todayStr);

  const weekLabel = `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold text-foreground capitalize min-w-[200px] text-center">
              {weekLabel}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {!isThisWeek && (
            <Button variant="ghost" size="sm" onClick={handleThisWeek} className="text-primary">
              <CalendarIcon className="w-4 h-4 mr-1" />
              Esta semana
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="min-w-[800px]">
            {/* Header row with day names */}
            <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-1 mb-1">
              <div className="text-xs text-muted-foreground font-medium p-2" />
              {weekDays.map(day => {
                const dateStr = formatDateStr(day);
                const isToday = dateStr === todayStr;
                const dayAptCount = weekAppointments[dateStr]?.length || 0;
                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'text-center p-2 rounded-lg',
                      isToday && 'bg-primary/10'
                    )}
                  >
                    <div className={cn('text-xs font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                      {WEEKDAY_NAMES_SHORT[day.getDay()]}
                    </div>
                    <div className={cn('text-lg font-bold', isToday ? 'text-primary' : 'text-foreground')}>
                      {day.getDate()}
                    </div>
                    {dayAptCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {dayAptCount}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time slot rows */}
            {timeSlots.map(time => (
              <div key={time} className="grid grid-cols-[70px_repeat(7,1fr)] gap-1 mb-1">
                <div className="flex items-center justify-center text-xs text-muted-foreground font-medium p-1">
                  {time}
                </div>
                {weekDays.map(day => {
                  const dateStr = formatDateStr(day);
                  const cellId = `${dateStr}__${time}`;
                  const appointment = getAppointmentAt(dateStr, time);
                  const isToday = dateStr === todayStr;

                  return (
                    <Droppable key={cellId} droppableId={cellId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            'min-h-[56px] rounded-md border p-1 transition-colors',
                            snapshot.isDraggingOver
                              ? 'border-primary bg-primary/10 border-dashed'
                              : isToday
                              ? 'border-primary/20 bg-primary/5'
                              : 'border-border/30 bg-muted/10 hover:bg-muted/20'
                          )}
                        >
                          {appointment ? (
                            <Draggable draggableId={appointment.id} index={0}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={cn(
                                    'rounded-md p-1.5 text-xs h-full flex flex-col gap-0.5',
                                    dragSnapshot.isDragging
                                      ? 'shadow-lg ring-2 ring-primary bg-card z-50'
                                      : 'bg-card/80'
                                  )}
                                >
                                  <div className="flex items-center gap-1">
                                    <div
                                      {...dragProvided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
                                    >
                                      <GripVertical className="w-3 h-3" />
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColor(appointment.status)}`} />
                                    <span className="font-medium text-foreground truncate">{appointment.clientName}</span>
                                  </div>
                                  <p className="text-muted-foreground truncate pl-4">{appointment.procedureName}</p>
                                  <div className="flex items-center justify-between pl-4">
                                    <span className="text-muted-foreground truncate">{appointment.professionalName}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-destructive flex-shrink-0"
                                      onClick={() => onDeleteAppointment(appointment)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ) : (
                            <button
                              className="w-full h-full min-h-[48px] flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                              onClick={() => onNewAppointment(time, dateStr)}
                            >
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
