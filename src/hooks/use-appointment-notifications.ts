import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Subscribes to real-time appointment changes for the user's company.
 * Shows toast notifications for new bookings (especially client-booked ones).
 * Use in layouts for secretary / company_admin roles.
 */
export function useAppointmentNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const setup = async () => {
      // Get user's company_id
      const { data: role } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!role?.company_id) return;

      const channel = supabase
        .channel(`company-appointments-${role.company_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `company_id=eq.${role.company_id}`,
          },
          async (payload) => {
            const apt = payload.new as any;

            // Fetch client name
            const { data: client } = await supabase
              .from('clients')
              .select('name')
              .eq('id', apt.client_id)
              .maybeSingle();

            const clientName = client?.name || 'Cliente';
            const dateFormatted = format(
              new Date(apt.date + 'T00:00:00'),
              "dd/MM",
              { locale: ptBR }
            );
            const time = apt.start_time?.slice(0, 5) || '';

            const isClientBooked = apt.booked_by_client === true;

            toast.info(
              `🆕 ${isClientBooked ? 'Agendamento online' : 'Novo agendamento'}: ${clientName} — ${dateFormatted} às ${time}`,
              { duration: 8000 }
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments',
            filter: `company_id=eq.${role.company_id}`,
          },
          (payload) => {
            const apt = payload.new as any;
            if (apt.status === 'cancelled' && apt.booked_by_client) {
              toast.warning('Um cliente cancelou um agendamento.', { duration: 5000 });
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    setup();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);
}
