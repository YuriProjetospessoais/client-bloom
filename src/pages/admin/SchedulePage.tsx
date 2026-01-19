import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { appointmentsStore, Appointment, usersStore } from '@/lib/store';
import { toast } from 'sonner';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function SchedulePage() {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState('Todos');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<string[]>(['Todos']);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  // Load appointments for the current date - isolated per day
  const loadAppointments = useCallback(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayAppointments = appointmentsStore.getByDate(dateStr);
    setAppointments(dayAppointments);
  }, [currentDate]);

  // Load appointments whenever date changes
  useEffect(() => {
    loadAppointments();
    
    // Load professionals
    const users = usersStore.getAll();
    const profs = ['Todos', ...users.map(u => u.name)];
    setProfessionals(profs);
  }, [loadAppointments]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const filteredAppointments = appointments.filter(apt => 
    selectedProfessional === 'Todos' || apt.professionalName === selectedProfessional
  );

  const getAppointmentForTime = (time: string) => {
    return filteredAppointments.find(apt => apt.time === time);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Realizado';
      case 'cancelled': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleNewAppointment = (time?: string) => {
    setSelectedTime(time);
    setAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (appointmentData: any) => {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check for time conflict
    if (appointmentsStore.hasTimeConflict(dateStr, appointmentData.time)) {
      toast.error('Já existe um agendamento neste horário!');
      return;
    }
    
    const result = appointmentsStore.create({
      clientName: appointmentData.client,
      procedureName: appointmentData.procedure,
      professionalName: appointmentData.professional,
      date: dateStr,
      time: appointmentData.time,
      duration: appointmentData.duration || 60,
      status: 'pending',
    });
    
    if (result) {
      // Reload appointments for this specific date
      loadAppointments();
      toast.success('Agendamento criado com sucesso!');
      setAppointmentModalOpen(false);
    } else {
      toast.error('Erro ao criar agendamento. Verifique se o horário está disponível.');
    }
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (appointmentToDelete) {
      appointmentsStore.delete(appointmentToDelete.id);
      loadAppointments();
      toast.success('Agendamento excluído!');
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();
  const appointmentCount = appointments.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.schedule}</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os agendamentos • {appointmentCount} agendamento{appointmentCount !== 1 ? 's' : ''} para este dia
          </p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={() => handleNewAppointment()}>
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg capitalize">
                  {formatDate(currentDate)}
                </CardTitle>
                {!isToday && (
                  <Button variant="ghost" size="sm" onClick={handleToday} className="text-primary">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Hoje
                  </Button>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="w-[180px]">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((prof) => (
                  <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeSlots.map((time) => {
              const appointment = getAppointmentForTime(time);
              return (
                <div 
                  key={time} 
                  className={`flex items-stretch gap-4 p-3 rounded-lg border border-border/50 ${
                    appointment ? 'bg-muted/30' : 'hover:bg-muted/20'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-2 w-20 flex-shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{time}</span>
                  </div>
                  
                  {appointment ? (
                    <div className="flex-1 flex items-center gap-4">
                      <div className={`w-1 self-stretch rounded-full ${getStatusColor(appointment.status)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{appointment.clientName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {appointment.duration}min
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.procedureName}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{appointment.professionalName}</p>
                          <Badge className={`text-xs ${
                            appointment.status === 'confirmed' 
                              ? 'bg-green-500/20 text-green-500' 
                              : appointment.status === 'completed'
                              ? 'bg-blue-500/20 text-blue-500'
                              : appointment.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-yellow-500/20 text-yellow-600'
                          }`}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteAppointment(appointment)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleNewAppointment(time)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Horário livre - Clique para agendar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AppointmentModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        defaultTime={selectedTime}
        defaultDate={currentDate.toISOString().split('T')[0]}
        onSave={handleSaveAppointment}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Agendamento"
        description={`Deseja excluir o agendamento de ${appointmentToDelete?.clientName} às ${appointmentToDelete?.time}?`}
        onConfirm={confirmDelete}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
