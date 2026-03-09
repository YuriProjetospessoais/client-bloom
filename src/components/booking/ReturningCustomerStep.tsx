import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, RotateCcw, Sparkles, Scissors, User, CalendarDays, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LastBookingInfo {
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  lastVisitDate: string;
  daysSinceVisit: number;
}

interface ReturningCustomerStepProps {
  companyId: string;
  tenantColor: string;
  onReturningCustomer: (info: LastBookingInfo) => void;
  onNewCustomer: (phone: string) => void;
  onNewBooking: (info: LastBookingInfo) => void;
}

export default function ReturningCustomerStep({
  companyId,
  tenantColor,
  onReturningCustomer,
  onNewCustomer,
  onNewBooking,
}: ReturningCustomerStepProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [lastBooking, setLastBooking] = useState<LastBookingInfo | null>(null);

  async function handleLookup() {
    if (!phone.trim()) return;
    setLoading(true);
    setChecked(false);
    setLastBooking(null);

    // Clean phone for matching (digits only for comparison)
    const cleanPhone = phone.replace(/\D/g, '');

    // Find client by phone in this company
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, phone')
      .eq('company_id', companyId)
      .eq('active', true);

    const matchedClient = clients?.find(c => {
      const cPhone = (c.phone || '').replace(/\D/g, '');
      return cPhone === cleanPhone && cleanPhone.length >= 8;
    });

    if (!matchedClient) {
      setLoading(false);
      setChecked(true);
      return;
    }

    // Get last completed/confirmed appointment for this client
    const { data: lastApt } = await supabase
      .from('appointments')
      .select(`
        date,
        service_id,
        professional_id,
        services ( id, name ),
        professionals ( id, name )
      `)
      .eq('client_id', matchedClient.id)
      .eq('company_id', companyId)
      .in('status', ['completed', 'confirmed', 'scheduled'])
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastApt && lastApt.services && lastApt.professionals) {
      const svc = lastApt.services as any;
      const pro = lastApt.professionals as any;
      const visitDate = lastApt.date;
      const daysSince = differenceInDays(new Date(), new Date(visitDate + 'T12:00:00'));

      setLastBooking({
        clientId: matchedClient.id,
        clientName: matchedClient.name,
        clientPhone: matchedClient.phone || phone,
        serviceId: svc.id,
        serviceName: svc.name,
        professionalId: pro.id,
        professionalName: pro.name,
        lastVisitDate: visitDate,
        daysSinceVisit: daysSince,
      });
    }

    setLoading(false);
    setChecked(true);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Digite seu telefone para começarmos:
      </p>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lookupPhone">Telefone / WhatsApp</Label>
            <div className="flex gap-2">
              <Input
                id="lookupPhone"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setChecked(false); setLastBooking(null); }}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                onClick={handleLookup}
                disabled={!phone.trim() || loading}
                style={{ backgroundColor: tenantColor }}
                className="text-white shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returning customer - welcome back */}
      {checked && lastBooking && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="overflow-hidden" style={{ borderColor: `${tenantColor}40` }}>
            <div className="px-4 py-3" style={{ backgroundColor: `${tenantColor}15` }}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: tenantColor }} />
                <h3 className="font-semibold text-foreground">
                  Bem-vindo de volta, {lastBooking.clientName.split(' ')[0]}!
                </h3>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Sua última visita:</p>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Scissors className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-medium text-foreground">{lastBooking.serviceName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium text-foreground">{lastBooking.professionalName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(lastBooking.lastVisitDate + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                  <Badge variant="secondary" className="text-xs ml-1">
                    há {lastBooking.daysSinceVisit} dias
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option 1: Rebook same */}
          <Card
            className="cursor-pointer transition-all hover:shadow-md group"
            onClick={() => onReturningCustomer(lastBooking)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: tenantColor }}
              >
                <RotateCcw className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Agendar o mesmo serviço</p>
                <p className="text-xs text-muted-foreground">
                  {lastBooking.serviceName} com {lastBooking.professionalName}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>

          {/* Option 2: New booking */}
          <Card
            className="cursor-pointer transition-all hover:shadow-md group"
            onClick={() => onNewBooking(lastBooking)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Novo agendamento</p>
                <p className="text-xs text-muted-foreground">Escolher outro serviço ou profissional</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* New customer - proceed to booking */}
      {checked && !lastBooking && !loading && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card>
            <CardContent className="p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Primeira vez aqui? Vamos agendar! 🎉
              </p>
              <Button
                className="w-full text-white"
                style={{ backgroundColor: tenantColor }}
                onClick={() => onNewCustomer(phone)}
              >
                Começar agendamento <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
