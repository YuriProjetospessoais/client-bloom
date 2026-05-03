import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAppointmentsByDate, type Appointment } from '@/hooks/queries/useAppointments';
import { useUpdateAppointment } from '@/hooks/mutations/useAppointmentMutations';
import { useServices } from '@/hooks/queries/useServices';
import { useProfessionals } from '@/hooks/queries/useProfessionals';
import { useClients } from '@/hooks/queries/useClients';
import { useEffect } from 'react';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

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

export default function UserSchedulePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect company admins
  useEffect(() => {
    if (user?.role === 'company_admin') navigate('/admin/schedule');
  }, [user, navigate]);

  const isSecretary = user?.role === 'secretary';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  const dateStr = currentDate.toISOString().split('T')[0];
  const { data: appts = [] } = useAppointmentsByDate(dateStr);
  const { data: services = [] } = useServices({ onlyActive: false });
  const { data: clients = [] } = useClients();
  const { data: professionals = [] } = useProfessionals({ onlyActive: false });
  const updateAppt = useUpdateAppointment();

  const sorted = useMemo(() => [...appts].sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')), [appts]);

  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? '—';
  const serviceInfo = (id: string | null) => services.find(s => s.id === id);
  const profName = (id: string | null) => professionals.find(p => p.id === id)?.name ?? '';

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isToday = currentDate.toDateString() === new Date().toDateString();

  const setStatus = (id: string, status: 'completed' | 'cancelled' | 'no_show') => {
    const patch: { status: typeof status; completed_at?: string } = { status };
    if (status === 'completed') patch.completed_at = new Date().toISOString();
    updateAppt.mutate({ id, patch });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.nav.schedule}</h1>
          <p className="text-muted-foreground mt-1">
            {isSecretary ? 'Agenda da empresa' : 'Minha agenda'} • {appts.length} agendamento{appts.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isSecretary && (
          <Button className="gradient-primary text-white gap-2" onClick={() => { setSelectedTime(undefined); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Novo Agendamento
          </Button>
        )}
      </div>

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
          {sorted.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum agendamento neste dia.</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((appt) => {
                const svc = serviceInfo(appt.service_id);
                return (
                  <div key={appt.id} className="flex items-stretch gap-4 p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2 w-20 flex-shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{appt.start_time?.slice(0, 5)}</span>
                    </div>
                    <div className={`w-1 self-stretch rounded-full ${getStatusColor(appt.status)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{clientName(appt.client_id)}</span>
                        {svc && <Badge variant="secondary" className="text-xs">{svc.duration_minutes}min</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {svc?.name ?? '—'}
                        {!isSecretary && svc?.price ? ` • R$ ${Number(svc.price).toFixed(2)}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">{profName(appt.professional_id)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-muted/40 text-foreground">{getStatusLabel(appt.status)}</Badge>
                      {!isSecretary && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-600" onClick={() => setStatus(appt.id, 'completed')}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-600" onClick={() => setStatus(appt.id, 'no_show')}>
                            <UserX className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(appt.id, 'cancelled')}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isSecretary && (
        <AppointmentModal open={modalOpen} onOpenChange={setModalOpen}
          defaultTime={selectedTime} defaultDate={dateStr} />
      )}
    </div>
  );
}
