import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tables } from '@/integrations/supabase/types';
import { useCreateOpportunity, useUpdateOpportunity } from '@/hooks/mutations/useOpportunityMutations';

type Opportunity = Tables<'opportunities'>;
type OppStatus = Opportunity['status'];

const STATUS_OPTIONS: { value: OppStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'won', label: 'Ganho' },
  { value: 'lost', label: 'Perdido' },
];

const SOURCES = ['Instagram', 'Facebook', 'Google', 'Indicação', 'Site', 'WhatsApp', 'Outro'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
}

export function LeadModal({ open, onOpenChange, opportunity }: Props) {
  const create = useCreateOpportunity();
  const update = useUpdateOpportunity();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '', contact_name: '', contact_email: '', contact_phone: '',
    estimated_value: '', source: '', status: 'lead' as OppStatus, notes: '',
  });

  useEffect(() => {
    if (opportunity) {
      setForm({
        title: opportunity.title ?? '',
        contact_name: opportunity.contact_name ?? '',
        contact_email: opportunity.contact_email ?? '',
        contact_phone: opportunity.contact_phone ?? '',
        estimated_value: String(opportunity.estimated_value ?? ''),
        source: opportunity.source ?? '',
        status: opportunity.status,
        notes: opportunity.notes ?? '',
      });
    } else {
      setForm({ title: '', contact_name: '', contact_email: '', contact_phone: '', estimated_value: '', source: '', status: 'lead', notes: '' });
    }
    setErrors({});
  }, [opportunity, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const title = form.title.trim() || form.contact_name.trim();
    if (!title) errs.title = 'Título ou nome obrigatório';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      title,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : 0,
      source: form.source || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    if (opportunity) {
      await update.mutateAsync({ id: opportunity.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
          <DialogDescription>Cadastre dados de contato e estágio do funil.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Corte mensal recorrente"
              className={errors.title ? 'border-destructive' : ''} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do contato</Label>
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Valor estimado</Label>
              <Input type="number" step="0.01" value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estágio</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as OppStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" className="gradient-primary text-white" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
