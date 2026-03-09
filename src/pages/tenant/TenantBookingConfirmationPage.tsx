import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '@/lib/tenant/TenantContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Scissors, User, CalendarDays, Clock, Store, ArrowLeft, CalendarPlus, MessageCircle } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingConfirmationState {
  serviceName: string;
  professionalName: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  duration: number;
  price: number;
  barbershopName: string;
}

export default function TenantBookingConfirmationPage() {
  const { slug } = useParams();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const booking = location.state as BookingConfirmationState | null;
  const tenantColor = tenant?.primaryColor || 'hsl(var(--primary))';

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
        <Button variant="outline" onClick={() => navigate(`/${slug}/agendar`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para agendamento
        </Button>
      </div>
    );
  }

  const parsedDate = parse(booking.date, 'yyyy-MM-dd', new Date());
  const formattedDate = format(parsedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const details = [
    { icon: Store, label: 'Barbearia', value: booking.barbershopName },
    { icon: Scissors, label: 'Serviço', value: booking.serviceName },
    { icon: User, label: 'Profissional', value: booking.professionalName },
    { icon: CalendarDays, label: 'Data', value: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1) },
    { icon: Clock, label: 'Horário', value: `${booking.time} (${booking.duration} min)` },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in py-4">
      {/* Success header */}
      <div className="text-center space-y-3">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: `${tenantColor}20` }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: tenantColor }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Agendamento Confirmado!</h1>
        <p className="text-muted-foreground text-sm">
          Seu horário foi reservado com sucesso. Confira os detalhes abaixo.
        </p>
      </div>

      {/* Booking details card */}
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: tenantColor }} />
        <CardContent className="p-5 space-y-4">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${tenantColor}15` }}
              >
                <Icon className="h-4 w-4" style={{ color: tenantColor }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
              </div>
            </div>
          ))}

          {/* Price */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor</span>
            <span className="text-lg font-bold" style={{ color: tenantColor }}>
              R$ {booking.price.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          className="w-full text-white"
          style={{ backgroundColor: tenantColor }}
          onClick={() => navigate(`/${slug}/agendamentos`)}
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          Ver Meus Agendamentos
        </Button>
        <Button
          variant="outline"
          className="w-full text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          onClick={() => {
            const msg = `✅ *Agendamento Confirmado!*\n\n` +
              `📍 ${booking.barbershopName}\n` +
              `✂️ ${booking.serviceName}\n` +
              `👤 ${booking.professionalName}\n` +
              `📅 ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}\n` +
              `🕐 ${booking.time} (${booking.duration} min)\n` +
              `💰 R$ ${booking.price.toFixed(2)}`;
            const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
          }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Compartilhar no WhatsApp
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/${slug}/agendar`)}
        >
          Agendar Novamente
        </Button>
      </div>
    </div>
  );
}
