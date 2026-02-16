import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { format, parseISO, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarX, CalendarDays } from 'lucide-react';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';

interface AppointmentRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  services?: { name: string } | null;
  professionals?: { name: string } | null;
}

export default function PortalAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLimitHours, setCancelLimitHours] = useState(12);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, company_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!clientData) {
      setLoading(false);
      return;
    }

    // Get cancel limit
    const { data: company } = await supabase
      .from('companies')
      .select('cancel_limit_hours')
      .eq('id', clientData.company_id)
      .maybeSingle();

    if (company) setCancelLimitHours(company.cancel_limit_hours);

    const { data } = await supabase
      .from('appointments')
      .select('*, services(name), professionals(name)')
      .eq('client_id', clientData.id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    setAppointments((data as any[]) || []);
    setLoading(false);
  }

  function canCancel(apt: AppointmentRow): boolean {
    if (apt.status !== 'scheduled' && apt.status !== 'confirmed') return false;
    const aptDateTime = new Date(`${apt.date}T${apt.start_time}`);
    return differenceInHours(aptDateTime, new Date()) >= cancelLimitHours;
  }

  async function handleCancel(id: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao cancelar.');
      return;
    }

    toast.success('Agendamento cancelado.');
    setConfirmCancel(null);
    loadData();
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
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-primary" />
        Meus Agendamentos
      </h1>

      {appointments.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum agendamento encontrado</p>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {(apt as any).services?.name || 'Serviço'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(apt.date), "dd/MM/yyyy")} · {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                  </p>
                  {(apt as any).professionals?.name && (
                    <p className="text-xs text-muted-foreground">com {(apt as any).professionals.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusVariant(apt.status)}>
                    {statusLabel[apt.status] || apt.status}
                  </Badge>
                  {canCancel(apt) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setConfirmCancel(apt.id)}
                    >
                      <CalendarX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmCancel}
        onOpenChange={() => setConfirmCancel(null)}
        title="Cancelar agendamento"
        description="Tem certeza que deseja cancelar este agendamento?"
        onConfirm={() => confirmCancel && handleCancel(confirmCancel)}
        confirmLabel="Cancelar agendamento"
        variant="destructive"
      />
    </div>
  );
}
