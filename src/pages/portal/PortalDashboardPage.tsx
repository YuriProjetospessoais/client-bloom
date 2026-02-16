import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, Clock, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  service_id: string | null;
  professional_id: string | null;
  services?: { name: string } | null;
  professionals?: { name: string } | null;
}

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<AppointmentRow | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAppointments();
  }, [user]);

  async function loadAppointments() {
    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    // Get client record for this user
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!clientData) {
      setLoading(false);
      return;
    }

    // Next upcoming appointment
    const { data: upcoming } = await supabase
      .from('appointments')
      .select('*, services(name), professionals(name)')
      .eq('client_id', clientData.id)
      .gte('date', today)
      .in('status', ['scheduled', 'confirmed'])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(1);

    if (upcoming && upcoming.length > 0) {
      setNextAppointment(upcoming[0] as any);
    }

    // Recent / past appointments
    const { data: recent } = await supabase
      .from('appointments')
      .select('*, services(name), professionals(name)')
      .eq('client_id', clientData.id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(5);

    setRecentAppointments((recent as any[]) || []);
    setLoading(false);
  }

  const statusLabel: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Ausente',
  };

  const statusVariant = (s: string) => {
    if (s === 'confirmed' || s === 'completed') return 'default' as const;
    if (s === 'cancelled' || s === 'no_show') return 'destructive' as const;
    return 'secondary' as const;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground">Bem-vindo ao seu portal</p>
      </div>

      {/* Next appointment */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Próximo Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextAppointment ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {(nextAppointment as any).services?.name || 'Serviço'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(nextAppointment.date), "dd 'de' MMMM", { locale: ptBR })} às {nextAppointment.start_time.slice(0, 5)}
                </p>
                {(nextAppointment as any).professionals?.name && (
                  <p className="text-sm text-muted-foreground">
                    com {(nextAppointment as any).professionals.name}
                  </p>
                )}
              </div>
              <Badge variant={statusVariant(nextAppointment.status)}>
                {statusLabel[nextAppointment.status] || nextAppointment.status}
              </Badge>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">Nenhum agendamento futuro</p>
              <Button asChild>
                <Link to="/portal/agendar">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Agendar agora
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick action */}
      {nextAppointment && (
        <Button asChild className="w-full" size="lg">
          <Link to="/portal/agendar">
            <CalendarPlus className="h-5 w-5 mr-2" />
            Novo Agendamento
          </Link>
        </Button>
      )}

      {/* Recent history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum histórico ainda</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {(apt as any).services?.name || 'Serviço'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(apt.date), "dd/MM/yyyy")} · {apt.start_time.slice(0, 5)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(apt.status)} className="text-xs">
                    {statusLabel[apt.status] || apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
