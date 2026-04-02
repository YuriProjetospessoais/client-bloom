import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const POLL_INTERVAL = 15_000; // 15 seconds

/**
 * Polls for new/cancelled appointments for the user's company.
 * Shows toast notifications for new bookings and cancellations.
 * Use in layouts for secretary / company_admin roles.
 */
export function useAppointmentNotifications() {
  const { user } = useAuth();
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const setup = async () => {
      const { data: role } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!role?.company_id || cancelled) return;

      const poll = async () => {
        const since = lastCheckedRef.current;
        lastCheckedRef.current = new Date().toISOString();

        // Check for new appointments
        const { data: newApts } = await supabase
          .from('appointments')
          .select('id, client_id, date, start_time, booked_by_client, status')
          .eq('company_id', role.company_id)
          .gt('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5);

        if (newApts?.length) {
          for (const apt of newApts) {
            if (apt.status === 'cancelled') continue;
            const { data: client } = await supabase
              .from('clients')
              .select('name')
              .eq('id', apt.client_id)
              .maybeSingle();

            const clientName = client?.name || 'Cliente';
            const dateFormatted = format(
              new Date(apt.date + 'T00:00:00'),
              'dd/MM',
              { locale: ptBR }
            );
            const time = apt.start_time?.slice(0, 5) || '';
            const isClientBooked = apt.booked_by_client === true;

            toast.info(
              `🆕 ${isClientBooked ? 'Agendamento online' : 'Novo agendamento'}: ${clientName} — ${dateFormatted} às ${time}`,
              { duration: 8000 }
            );
          }
        }

        // Check for recently cancelled client-booked appointments
        const { data: cancelledApts } = await supabase
          .from('appointments')
          .select('id, booked_by_client')
          .eq('company_id', role.company_id)
          .eq('status', 'cancelled')
          .eq('booked_by_client', true)
          .gt('updated_at', since)
          .limit(5);

        if (cancelledApts?.length) {
          for (const _ of cancelledApts) {
            toast.warning('Um cliente cancelou um agendamento.', { duration: 5000 });
          }
        }
      };

      intervalRef.current = setInterval(poll, POLL_INTERVAL);
    };

    setup();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id]);
}
