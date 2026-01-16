import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { AppointmentModal, Appointment } from '@/components/modals/AppointmentModal';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const initialAppointments: Appointment[] = [
  { id: 1, time: '09:00', client: 'Maria Silva', procedure: 'Limpeza de pele', professional: 'Dr. João', duration: 60, status: 'confirmed' },
  { id: 2, time: '10:30', client: 'Carlos Santos', procedure: 'Botox', professional: 'Dr. João', duration: 45, status: 'confirmed' },
  { id: 3, time: '14:00', client: 'Ana Costa', procedure: 'Peeling', professional: 'Dr. João', duration: 90, status: 'pending' },
  { id: 4, time: '15:30', client: 'Roberto Alves', procedure: 'Consulta', professional: 'Dr. João', duration: 30, status: 'confirmed' },
  { id: 5, time: '17:00', client: 'Patricia Lima', procedure: 'Tratamento Facial', professional: 'Dr. João', duration: 60, status: 'confirmed' },
];

export default function UserSchedulePage() {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getAppointmentForTime = (time: string) => appointments.find(apt => apt.time === time);
  const getStatusColor = (status: string) => status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500';

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

  const handleNewAppointment = (time?: string) => {
    setSelectedTime(time);
    setAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (data: Partial<Appointment>) => {
    const newAppointment: Appointment = { ...data as Appointment, id: Date.now(), status: 'pending' };
    setAppointments([...appointments, newAppointment]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.schedule}</h1>
          <p className="text-muted-foreground mt-1">Minha agenda de atendimentos</p>
        </div>
        <Button className="gradient-primary text-white gap-2" onClick={() => handleNewAppointment()}>
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg capitalize flex-1 text-center">{formatDate(currentDate)}</CardTitle>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeSlots.map((time) => {
              const appointment = getAppointmentForTime(time);
              return (
                <div key={time} className={`flex items-stretch gap-4 p-3 rounded-lg border border-border/50 ${appointment ? 'bg-muted/30' : 'hover:bg-muted/20'} transition-colors`}>
                  <div className="flex items-center gap-2 w-20 flex-shrink-0">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{time}</span>
                  </div>
                  {appointment ? (
                    <div className="flex-1 flex items-center gap-4">
                      <div className={`w-1 self-stretch rounded-full ${getStatusColor(appointment.status)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{appointment.client}</span>
                          <Badge variant="secondary" className="text-xs">{appointment.duration}min</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.procedure}</p>
                      </div>
                      <Badge className={`text-xs ${appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                        {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleNewAppointment(time)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Horário livre
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AppointmentModal open={appointmentModalOpen} onOpenChange={setAppointmentModalOpen} defaultTime={selectedTime} defaultDate={currentDate.toISOString().split('T')[0]} onSave={handleSaveAppointment} />
    </div>
  );
}
