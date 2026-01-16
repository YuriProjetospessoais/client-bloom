import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { z } from 'zod';

const appointmentSchema = z.object({
  client: z.string().trim().min(2, 'Nome do cliente obrigatório'),
  procedure: z.string().min(1, 'Selecione um procedimento'),
  date: z.string().min(1, 'Selecione uma data'),
  time: z.string().min(1, 'Selecione um horário'),
  professional: z.string().min(1, 'Selecione um profissional'),
});

export interface Appointment {
  id: number;
  time: string;
  date?: string;
  client: string;
  procedure: string;
  professional: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultTime?: string;
  defaultDate?: string;
  onSave: (appointment: Partial<Appointment>) => void;
}

const procedures = [
  { name: 'Limpeza de pele', duration: 60 },
  { name: 'Botox', duration: 45 },
  { name: 'Peeling', duration: 90 },
  { name: 'Consulta', duration: 30 },
  { name: 'Tratamento Facial', duration: 60 },
  { name: 'Tratamento Capilar', duration: 120 },
];

const professionals = ['Dr. João', 'Dra. Ana', 'Maria'];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', 
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

export function AppointmentModal({ 
  open, 
  onOpenChange, 
  appointment, 
  defaultTime, 
  defaultDate,
  onSave 
}: AppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    procedure: '',
    date: '',
    time: '',
    professional: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (appointment) {
      setFormData({
        client: appointment.client,
        procedure: appointment.procedure,
        date: appointment.date || defaultDate || new Date().toISOString().split('T')[0],
        time: appointment.time,
        professional: appointment.professional,
      });
    } else {
      setFormData({
        client: '',
        procedure: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
        time: defaultTime || '',
        professional: '',
      });
    }
    setErrors({});
  }, [appointment, open, defaultTime, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = appointmentSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const selectedProcedure = procedures.find(p => p.name === formData.procedure);

    onSave({
      id: appointment?.id,
      client: formData.client,
      procedure: formData.procedure,
      date: formData.date,
      time: formData.time,
      professional: formData.professional,
      duration: selectedProcedure?.duration || 60,
      status: appointment?.status || 'pending',
    });

    setIsLoading(false);
    onOpenChange(false);
    toast.success(appointment ? 'Agendamento atualizado!' : 'Agendamento criado com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          <DialogDescription>
            {appointment ? 'Atualize os dados do agendamento.' : 'Preencha os dados para agendar.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              placeholder="Nome do cliente"
              className={errors.client ? 'border-destructive' : ''}
            />
            {errors.client && <p className="text-sm text-destructive">{errors.client}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedure">Procedimento *</Label>
            <Select value={formData.procedure} onValueChange={(v) => setFormData({ ...formData, procedure: v })}>
              <SelectTrigger className={errors.procedure ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedures.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name} ({p.duration}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.procedure && <p className="text-sm text-destructive">{errors.procedure}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })}>
                <SelectTrigger className={errors.time ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional">Profissional *</Label>
            <Select value={formData.professional} onValueChange={(v) => setFormData({ ...formData, professional: v })}>
              <SelectTrigger className={errors.professional ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.professional && <p className="text-sm text-destructive">{errors.professional}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : appointment ? 'Salvar' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
