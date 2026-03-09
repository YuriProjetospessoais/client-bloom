import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTenant } from '@/lib/tenant/TenantContext';
import { toast } from 'sonner';
import { format, addDays, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, ArrowLeft, ArrowRight, Scissors, User, CalendarDays, Clock } from 'lucide-react';
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
  specialties: string[] | null;
}

type Step = 'service' | 'professional' | 'datetime' | 'customer' | 'confirm';

export default function TenantBookingPage() {
  const { slug } = useParams();
  const { tenant } = useTenant();
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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);

  const companyId = tenant?.id;

  // Load services & professionals (public RLS allows anon read)
  useEffect(() => {
    if (!companyId) return;
    loadPublicData();
  }, [companyId]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  async function loadUserProfile() {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (profile) {
      if (profile.full_name) setCustomerName(profile.full_name);
      if (profile.phone) setCustomerPhone(profile.phone);
    }
  }

  async function loadPublicData() {
    setLoading(true);

    const [svcRes, proRes, compRes] = await Promise.all([
      supabase
        .from('services')
        .select('id, name, price, duration_minutes, description')
        .eq('company_id', companyId!)
        .eq('active', true)
        .order('name'),
      supabase
        .from('professionals')
        .select('id, name, avatar_url, specialties')
        .eq('company_id', companyId!)
        .eq('active', true)
        .order('name'),
      supabase
        .from('companies')
        .select('max_advance_days')
        .eq('id', companyId!)
        .maybeSingle(),
    ]);

    setServices(svcRes.data || []);
    setProfessionals(proRes.data || []);
    if (compRes.data) setMaxAdvanceDays(compRes.data.max_advance_days);
    setLoading(false);
  }

  // Load available time slots when date/professional/service change
  useEffect(() => {
    if (selectedDate && selectedProfessional && selectedService && companyId) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedProfessional, selectedService]);

  async function loadAvailableSlots() {
    if (!selectedDate || !selectedProfessional || !selectedService || !companyId) return;

    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const [whRes, aptsRes] = await Promise.all([
      supabase
        .from('working_hours')
        .select('start_time, end_time, is_available')
        .eq('company_id', companyId)
        .eq('professional_id', selectedProfessional.id)
        .eq('day_of_week', dayOfWeek),
      supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('company_id', companyId)
        .eq('professional_id', selectedProfessional.id)
        .eq('date', dateStr)
        .in('status', ['scheduled', 'confirmed']),
    ]);

    const available = whRes.data?.find((w) => w.is_available);
    if (!available) {
      setAvailableSlots([]);
      return;
    }

    const booked = (aptsRes.data || []).map((a) => ({
      start: a.start_time,
      end: a.end_time,
    }));

    const slots: string[] = [];
    const [startH, startM] = available.start_time.split(':').map(Number);
    const [endH, endM] = available.end_time.split(':').map(Number);
    const duration = selectedService.duration_minutes;

    let cursor = new Date(2000, 0, 1, startH, startM);
    const endLimit = new Date(2000, 0, 1, endH, endM);

    while (addMinutes(cursor, duration) <= endLimit) {
      const slotStart = format(cursor, 'HH:mm');
      const slotEnd = format(addMinutes(cursor, duration), 'HH:mm');

      const hasConflict = booked.some((b) => slotStart < b.end && slotEnd > b.start);
      if (!hasConflict) slots.push(slotStart);

      cursor = addMinutes(cursor, 30);
    }

    setAvailableSlots(slots);
    setSelectedTime(null);
  }

  async function handleConfirm() {
    if (!user) {
      toast.error('Você precisa estar logado para agendar.');
      navigate(`/${slug}`);
      return;
    }

    if (!companyId || !selectedService || !selectedProfessional || !selectedDate || !selectedTime || !customerName || !customerPhone) return;

    setSubmitting(true);

    // Get or create client record for this user+company
    let { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!clientData) {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          company_id: companyId,
          name: customerName,
          phone: customerPhone,
          email: user.email,
        })
        .select('id')
        .single();

      if (clientErr || !newClient) {
        toast.error('Erro ao criar perfil de cliente.');
        setSubmitting(false);
        return;
      }
      clientData = newClient;
    } else {
      // Update existing client with new name/phone
      await supabase
        .from('clients')
        .update({
          name: customerName,
          phone: customerPhone,
        })
        .eq('id', clientData.id);
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const [h, m] = selectedTime.split(':').map(Number);
    const endTime = format(addMinutes(new Date(2000, 0, 1, h, m), selectedService.duration_minutes), 'HH:mm');

    const { data: aptData, error } = await supabase.from('appointments').insert({
      client_id: clientData.id,
      company_id: companyId,
      service_id: selectedService.id,
      professional_id: selectedProfessional.id,
      date: dateStr,
      start_time: selectedTime,
      end_time: endTime,
      booked_by_client: true,
      status: 'scheduled',
      payment_method: 'in_person',
      payment_status: 'pending',
    }).select('id').single();

    if (error || !aptData) {
      setSubmitting(false);
      
      // Handle the custom trigger error message for double booking
      if (error?.message?.includes('já existe um agendamento') || error?.code === '23505') {
        toast.error('Este horário acabou de ser reservado. Por favor, escolha outro.');
        loadAvailableSlots(); // Reload slots to reflect the new state
        setStep('datetime'); // Go back to datetime selection
      } else {
        toast.error('Erro ao agendar. Tente novamente.');
      }
      return;
    }

    setSubmitting(false);
    toast.success('Agendamento realizado com sucesso!');
    navigate(`/${slug}/confirmacao`, {
      state: {
        serviceName: selectedService.name,
        professionalName: selectedProfessional.name,
        date: dateStr,
        time: selectedTime,
        duration: selectedService.duration_minutes,
        price: Number(selectedService.price),
        barbershopName: tenant?.name || '',
      },
    });
  }

  const steps: { key: Step; label: string; icon: typeof Scissors }[] = [
    { key: 'service', label: 'Serviço', icon: Scissors },
    { key: 'professional', label: 'Profissional', icon: User },
    { key: 'datetime', label: 'Data & Hora', icon: CalendarDays },
    { key: 'customer', label: 'Seus Dados', icon: User },
    { key: 'confirm', label: 'Confirmar', icon: CheckCircle },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);
  const tenantColor = tenant?.primaryColor || 'hsl(var(--primary))';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${tenantColor} transparent transparent transparent` }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <h1 className="text-2xl font-bold text-foreground">Agendar</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i < stepIndex && 'text-white',
                i === stepIndex && 'text-white shadow-lg scale-110',
                i > stepIndex && 'bg-muted text-muted-foreground'
              )}
              style={i <= stepIndex ? { backgroundColor: tenantColor } : undefined}
            >
              {i < stepIndex ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
            </div>
            <span className={cn(
              'text-xs sm:text-sm hidden sm:inline',
              i <= stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className="w-4 sm:w-8 h-0.5 rounded-full transition-colors"
                style={{ backgroundColor: i < stepIndex ? tenantColor : 'hsl(var(--border))' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Service */}
      {step === 'service' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Escolha o serviço desejado:</p>
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Scissors className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhum serviço disponível no momento</p>
              </CardContent>
            </Card>
          ) : (
            services.map((svc) => (
              <Card
                key={svc.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedService?.id === svc.id && 'ring-2'
                )}
                style={selectedService?.id === svc.id ? { borderColor: tenantColor, boxShadow: `0 0 0 2px ${tenantColor}40` } : undefined}
                onClick={() => {
                  setSelectedService(svc);
                  setStep('professional');
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{svc.name}</p>
                    {svc.description && <p className="text-xs text-muted-foreground">{svc.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {svc.duration_minutes} min
                    </div>
                  </div>
                  <Badge
                    className="text-white shrink-0"
                    style={{ backgroundColor: tenantColor }}
                  >
                    R$ {Number(svc.price).toFixed(2)}
                  </Badge>
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
          <p className="text-sm text-muted-foreground">Escolha o profissional:</p>
          {professionals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhum profissional disponível</p>
              </CardContent>
            </Card>
          ) : (
            professionals.map((pro) => (
              <Card
                key={pro.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedProfessional?.id === pro.id && 'ring-2'
                )}
                style={selectedProfessional?.id === pro.id ? { borderColor: tenantColor, boxShadow: `0 0 0 2px ${tenantColor}40` } : undefined}
                onClick={() => {
                  setSelectedProfessional(pro);
                  setStep('datetime');
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  {pro.avatar_url ? (
                    <img src={pro.avatar_url} alt={pro.name} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: tenantColor }}
                    >
                      {pro.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{pro.name}</p>
                    {pro.specialties && pro.specialties.length > 0 && (
                      <p className="text-xs text-muted-foreground">{pro.specialties.join(', ')}</p>
                    )}
                  </div>
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
            <CardContent className="p-4 flex justify-center">
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
                className="pointer-events-auto"
              />
            </CardContent>
          </Card>

          {selectedDate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Horários em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum horário disponível neste dia
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant="outline"
                        size="sm"
                        className={cn(
                          'transition-all',
                          selectedTime === slot && 'text-white border-transparent'
                        )}
                        style={selectedTime === slot ? { backgroundColor: tenantColor } : undefined}
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
            <Button
              className="w-full text-white"
              style={{ backgroundColor: tenantColor }}
              onClick={() => setStep('customer')}
            >
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Step: Customer Info */}
      {step === 'customer' && (
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={() => setStep('datetime')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <p className="text-sm text-muted-foreground">Preencha seus dados:</p>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome Completo</Label>
                <Input
                  id="customerName"
                  placeholder="Seu nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefone / WhatsApp</Label>
                <Input
                  id="customerPhone"
                  placeholder="(00) 00000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <Button
                className="w-full text-white"
                style={{ backgroundColor: tenantColor }}
                onClick={() => setStep('confirm')}
                disabled={!customerName.trim() || !customerPhone.trim()}
              >
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selectedService && selectedProfessional && selectedDate && selectedTime && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('customer')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          <Card style={{ borderColor: `${tenantColor}30` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Confirme seu agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Serviço" value={selectedService.name} />
              <SummaryRow label="Profissional" value={selectedProfessional.name} />
              <SummaryRow label="Data" value={format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })} />
              <SummaryRow label="Horário" value={selectedTime} />
              <SummaryRow label="Duração" value={`${selectedService.duration_minutes} min`} />
              <SummaryRow label="Cliente" value={customerName} />
              <SummaryRow label="Contato" value={customerPhone} />
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-bold text-lg" style={{ color: tenantColor }}>
                  R$ {Number(selectedService.price).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {!user && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-sm text-foreground font-medium">Faça login para confirmar seu agendamento</p>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${slug}`)}
                >
                  Fazer Login
                </Button>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full text-white"
            size="lg"
            style={{ backgroundColor: tenantColor }}
            onClick={handleConfirm}
            disabled={submitting || !user}
          >
            {submitting ? 'Processando...' : 'Confirmar Agendamento'}
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
