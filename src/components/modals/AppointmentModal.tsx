import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useClients } from '@/hooks/queries/useClients';
import { useServices } from '@/hooks/queries/useServices';
import { useProfessionals } from '@/hooks/queries/useProfessionals';
import { useCreateAppointment } from '@/hooks/mutations/useAppointmentMutations';

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTime?: string;
  defaultDate?: string;
  defaultClientId?: string;
  defaultProfessionalId?: string;
  onSaved?: () => void;
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
];

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function AppointmentModal({
  open, onOpenChange, defaultTime, defaultDate, defaultClientId, defaultProfessionalId, onSaved,
}: AppointmentModalProps) {
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices({ onlyActive: true });
  const { data: professionals = [] } = useProfessionals({ onlyActive: true });
  const create = useCreateAppointment();

  const [form, setForm] = useState({
    client_id: '', service_id: '', professional_id: '',
    date: '', start_time: '', notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        client_id: defaultClientId ?? '',
        service_id: '',
        professional_id: defaultProfessionalId ?? '',
        date: defaultDate ?? new Date().toISOString().split('T')[0],
        start_time: defaultTime ?? '',
        notes: '',
      });
      setErrors({});
    }
  }, [open, defaultDate, defaultTime, defaultClientId, defaultProfessionalId]);

  const selectedService = useMemo(
    () => services.find(s => s.id === form.service_id),
    [services, form.service_id]
  );

  const endTime = useMemo(() => {
    if (!form.start_time || !selectedService) return '';
    return addMinutes(form.start_time, selectedService.duration_minutes ?? 30);
  }, [form.start_time, selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.client_id) errs.client_id = 'Selecione um cliente';
    if (!form.service_id) errs.service_id = 'Selecione um serviço';
    if (!form.professional_id) errs.professional_id = 'Selecione um profissional';
    if (!form.date) errs.date = 'Selecione uma data';
    if (!form.start_time) errs.start_time = 'Selecione um horário';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await create.mutateAsync({
        client_id: form.client_id,
        service_id: form.service_id,
        professional_id: form.professional_id,
        date: form.date,
        start_time: form.start_time,
        end_time: endTime,
        status: 'scheduled',
        payment_method: 'in_person',
        payment_status: 'pending',
        booked_by_client: false,
        notes: form.notes || null,
      });
      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code;
      if (code === '23505' || /já existe um agendamento/i.test(msg)) {
        toast.error('Esse horário acabou de ser ocupado.');
      }
      // other errors handled by mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>Preencha os dados para agendar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
              <SelectTrigger className={errors.client_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.filter(c => c.active).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && <p className="text-sm text-destructive">{errors.client_id}</p>}
          </div>

          <div className="space-y-2">
            <Label>Serviço *</Label>
            <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
              <SelectTrigger className={errors.service_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_id && <p className="text-sm text-destructive">{errors.service_id}</p>}
          </div>

          <div className="space-y-2">
            <Label>Profissional *</Label>
            <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
              <SelectTrigger className={errors.professional_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.professional_id && <p className="text-sm text-destructive">{errors.professional_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={errors.date ? 'border-destructive' : ''} />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label>Horário *</Label>
              <Select value={form.start_time} onValueChange={(v) => setForm({ ...form, start_time: v })}>
                <SelectTrigger className={errors.start_time ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.start_time && <p className="text-sm text-destructive">{errors.start_time}</p>}
            </div>
          </div>

          {endTime && (
            <p className="text-xs text-muted-foreground">Término previsto: {endTime}</p>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anotações opcionais" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={create.isPending}>
              {create.isPending ? 'Salvando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
