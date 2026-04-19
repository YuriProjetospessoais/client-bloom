import { useState, useEffect } from 'react';
import { sanitizeText } from '@/lib/security/sanitize';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Professional {
  id: string;
  name: string;
}

interface BlockTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  professionals: Professional[];
  /** Pre-select a professional (e.g. when barber blocks own time) */
  defaultProfessionalId?: string;
  /** Lock the professional field (barbers can only block their own time) */
  lockProfessional?: boolean;
  onSaved?: () => void;
}

export function BlockTimeModal({
  open,
  onOpenChange,
  companyId,
  professionals,
  defaultProfessionalId,
  lockProfessional,
  onSaved,
}: BlockTimeModalProps) {
  const [professionalId, setProfessionalId] = useState(defaultProfessionalId || '');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setProfessionalId(defaultProfessionalId || '');
      setDate(undefined);
      setStartTime('');
      setEndTime('');
      setReason('');
    }
  }, [open, defaultProfessionalId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!professionalId || !date || !startTime || !endTime) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    if (startTime >= endTime) {
      toast.error('O horário final deve ser posterior ao inicial.');
      return;
    }

    setSaving(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Não autenticado.');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('blocked_slots').insert({
        company_id: companyId,
        professional_id: professionalId,
        date: format(date, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        reason: sanitizeText(reason) || null,
        created_by: session.session.user.id,
      });

      if (error) throw error;

      toast.success('Horário bloqueado com sucesso!');
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error('Erro ao bloquear horário: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  // Generate time options (every 30 min from 06:00 to 23:00)
  const timeOptions: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) continue;
      timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Bloquear Horário
          </DialogTitle>
          <DialogDescription>
            Bloqueie um período na agenda. Esses horários não ficarão disponíveis para agendamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            {/* Professional */}
            <div className="grid gap-2">
              <Label>Barbeiro *</Label>
              {lockProfessional ? (
                <Input
                  value={professionals.find((p) => p.id === professionalId)?.name || ''}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <Select value={professionalId} onValueChange={setProfessionalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((pro) => (
                      <SelectItem key={pro.id} value={pro.id}>
                        {pro.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label>Data *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setCalendarOpen(false);
                    }}
                    disabled={(d) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return d < today;
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Início *</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Início">
                      {startTime || <span className="text-muted-foreground">Início</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Fim *</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fim">
                      {endTime || <span className="text-muted-foreground">Fim</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions
                      .filter((t) => !startTime || t > startTime)
                      .map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Almoço, Consulta médica, Folga..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={saving || !professionalId || !date || !startTime || !endTime}
            >
              {saving ? 'Salvando...' : 'Bloquear Horário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
