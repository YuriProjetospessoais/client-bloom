import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';
import { format, addDays, parseISO, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, ArrowLeft, ArrowRight, Banknote, QrCode, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
}

interface Professional {
  id: string;
  name: string;
  avatar_url: string | null;
}

type Step = 'service' | 'professional' | 'datetime' | 'payment' | 'confirm';
type PaymentMethod = 'in_person' | 'pix' | 'credit_card';

export default function PortalBookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadInitialData();
  }, [user]);

  async function loadInitialData() {
    setLoading(true);
    // Get client record
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, company_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!clientData) {
      toast.error('Perfil de cliente não encontrado.');
      setLoading(false);
      return;
    }

    setClientId(clientData.id);
    setCompanyId(clientData.company_id);

    // Company config
    const { data: company } = await supabase
      .from('companies')
      .select('max_advance_days')
      .eq('id', clientData.company_id)
      .maybeSingle();

    if (company) setMaxAdvanceDays(company.max_advance_days);

    // Services
    const { data: svc } = await supabase
      .from('services')
      .select('id, name, price, duration_minutes, description')
      .eq('company_id', clientData.company_id)
      .eq('active', true)
      .order('name');

    setServices(svc || []);

    // Professionals
    const { data: pros } = await supabase
      .from('professionals')
      .select('id, name, avatar_url')
      .eq('company_id', clientData.company_id)
      .eq('active', true)
      .order('name');

    setProfessionals(pros || []);
    setLoading(false);
  }

  useEffect(() => {
    if (selectedDate && selectedProfessional && selectedService && companyId) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedProfessional, selectedService]);

  async function loadAvailableSlots() {
    if (!selectedDate || !selectedProfessional || !selectedService || !companyId) return;

    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Working hours for this professional on this day
    const { data: wh } = await supabase
      .from('working_hours')
      .select('start_time, end_time, is_available')
      .eq('company_id', companyId)
      .eq('professional_id', selectedProfessional.id)
      .eq('day_of_week', dayOfWeek);

    const available = wh?.find((w) => w.is_available);
    if (!available) {
      setAvailableSlots([]);
      return;
    }

    // Existing appointments for this professional on this date
    const { data: existingApts } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('company_id', companyId)
      .eq('professional_id', selectedProfessional.id)
      .eq('date', dateStr)
      .in('status', ['scheduled', 'confirmed']);

    const booked = (existingApts || []).map((a) => ({
      start: a.start_time,
      end: a.end_time,
    }));

    // Generate slots
    const slots: string[] = [];
    const [startH, startM] = available.start_time.split(':').map(Number);
    const [endH, endM] = available.end_time.split(':').map(Number);
    const duration = selectedService.duration_minutes;

    let cursor = new Date(2000, 0, 1, startH, startM);
    const endLimit = new Date(2000, 0, 1, endH, endM);

    while (addMinutes(cursor, duration) <= endLimit) {
      const slotStart = format(cursor, 'HH:mm');
      const slotEnd = format(addMinutes(cursor, duration), 'HH:mm');

      const hasConflict = booked.some((b) => {
        return slotStart < b.end && slotEnd > b.start;
      });

      if (!hasConflict) {
        slots.push(slotStart);
      }
      cursor = addMinutes(cursor, 30); // 30-min intervals
    }

    setAvailableSlots(slots);
    setSelectedTime(null);
  }

  async function handleConfirm() {
    if (!clientId || !companyId || !selectedService || !selectedProfessional || !selectedDate || !selectedTime || !selectedPayment) return;

    setSubmitting(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const [h, m] = selectedTime.split(':').map(Number);
    const endTime = format(addMinutes(new Date(2000, 0, 1, h, m), selectedService.duration_minutes), 'HH:mm');

    const { data: aptData, error } = await supabase.from('appointments').insert({
      client_id: clientId,
      company_id: companyId,
      service_id: selectedService.id,
      professional_id: selectedProfessional.id,
      date: dateStr,
      start_time: selectedTime,
      end_time: endTime,
      booked_by_client: true,
      status: 'scheduled',
      payment_method: selectedPayment,
      payment_status: selectedPayment === 'in_person' ? 'pending' : 'awaiting',
    }).select('id').single();

    if (error || !aptData) {
      setSubmitting(false);
      toast.error('Erro ao agendar. Tente novamente.');
      return;
    }

    // If payment is online (pix or credit_card), redirect to Stripe
    if (selectedPayment !== 'in_person') {
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          serviceName: selectedService.name,
          servicePrice: Number(selectedService.price),
          paymentMethod: selectedPayment === 'pix' ? 'pix' : 'card',
          appointmentId: aptData.id,
        },
      });

      setSubmitting(false);

      if (checkoutError || !checkoutData?.url) {
        toast.error('Erro ao iniciar pagamento. O agendamento foi criado, finalize o pagamento depois.');
        navigate('/portal/agendamentos');
        return;
      }

      window.location.href = checkoutData.url;
      return;
    }

    setSubmitting(false);
    toast.success('Agendamento realizado com sucesso!');
    navigate('/portal/agendamentos');
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'service', label: 'Serviço' },
    { key: 'professional', label: 'Profissional' },
    { key: 'datetime', label: 'Data & Hora' },
    { key: 'payment', label: 'Pagamento' },
    { key: 'confirm', label: 'Confirmar' },
  ];

  const paymentOptions: { key: PaymentMethod; label: string; description: string; icon: typeof Banknote }[] = [
    { key: 'in_person', label: 'Presencial', description: 'Pague no local do atendimento', icon: Banknote },
    { key: 'pix', label: 'Pix', description: 'Pagamento instantâneo via Pix', icon: QrCode },
    { key: 'credit_card', label: 'Cartão de Crédito', description: 'Pague com cartão de crédito', icon: CreditCard },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <h1 className="text-2xl font-bold text-foreground">Agendar</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i <= stepIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < stepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn('text-sm hidden sm:inline', i <= stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step: Service */}
      {step === 'service' && (
        <div className="space-y-3">
          {services.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum serviço disponível</p>
          ) : (
            services.map((svc) => (
              <Card
                key={svc.id}
                className={cn(
                  'cursor-pointer card-interactive',
                  selectedService?.id === svc.id && 'ring-2 ring-primary'
                )}
                onClick={() => {
                  setSelectedService(svc);
                  setStep('professional');
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{svc.name}</p>
                    {svc.description && <p className="text-xs text-muted-foreground">{svc.description}</p>}
                    <p className="text-xs text-muted-foreground">{svc.duration_minutes} min</p>
                  </div>
                  <Badge variant="secondary">R$ {Number(svc.price).toFixed(2)}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step: Professional */}
      {step === 'professional' && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setStep('service')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          {professionals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum profissional disponível</p>
          ) : (
            professionals.map((pro) => (
              <Card
                key={pro.id}
                className={cn(
                  'cursor-pointer card-interactive',
                  selectedProfessional?.id === pro.id && 'ring-2 ring-primary'
                )}
                onClick={() => {
                  setSelectedProfessional(pro);
                  setStep('datetime');
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {pro.name.charAt(0)}
                  </div>
                  <p className="font-medium text-foreground">{pro.name}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step: Date & Time */}
      {step === 'datetime' && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('professional')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d)}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today || date > addDays(today, maxAdvanceDays);
                }}
                locale={ptBR}
                className="mx-auto"
              />
            </CardContent>
          </Card>

          {selectedDate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Horários em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum horário disponível neste dia</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {selectedTime && (
            <Button className="w-full" onClick={() => setStep('payment')}>
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Step: Payment Method */}
      {step === 'payment' && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setStep('datetime')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <p className="text-sm text-muted-foreground">Escolha a forma de pagamento:</p>
          {paymentOptions.map((opt) => (
            <Card
              key={opt.key}
              className={cn(
                'cursor-pointer card-interactive',
                selectedPayment === opt.key && 'ring-2 ring-primary'
              )}
              onClick={() => {
                setSelectedPayment(opt.key);
                setStep('confirm');
              }}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selectedService && selectedProfessional && selectedDate && selectedTime && selectedPayment && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('payment')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Confirme seu agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium text-foreground">{selectedService.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profissional</span>
                <span className="font-medium text-foreground">{selectedProfessional.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium text-foreground">
                  {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium text-foreground">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duração</span>
                <span className="font-medium text-foreground">{selectedService.duration_minutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium text-foreground">
                  {paymentOptions.find(p => p.key === selectedPayment)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-bold text-foreground">R$ {Number(selectedService.price).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={submitting}>
            {submitting
              ? 'Processando...'
              : selectedPayment === 'in_person'
                ? 'Confirmar Agendamento'
                : 'Ir para Pagamento'
            }
          </Button>
        </div>
      )}
    </div>
  );
}
